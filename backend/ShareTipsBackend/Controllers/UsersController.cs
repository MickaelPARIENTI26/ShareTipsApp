using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion des utilisateurs et profils
/// </summary>
[Route("api/[controller]")]
[Tags("Utilisateurs")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _userService;
    private readonly IFollowService _followService;
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    public UsersController(
        IUserService userService,
        IFollowService followService,
        ApplicationDbContext context,
        ICacheService cache)
    {
        _userService = userService;
        _followService = followService;
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Get current authenticated user's profile with stats
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetUserId();

        var user = await _context.Users
            .Include(u => u.Wallet)
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        // Calculate stats
        var stats = await CalculateUserStatsAsync(userId);

        var dto = new UserDto(
            user.Id,
            user.Email,
            user.Username,
            stats
        );

        return Ok(dto);
    }

    /// <summary>
    /// GDPR: Export all user data
    /// </summary>
    [HttpGet("me/export")]
    [Authorize]
    [ProducesResponseType(typeof(UserDataExportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportUserData()
    {
        var userId = GetUserId();

        try
        {
            var exportData = await _userService.ExportUserDataAsync(userId);
            return Ok(exportData);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
    }

    /// <summary>
    /// GDPR: Delete user account and anonymize data
    /// </summary>
    [HttpDelete("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = GetUserId();

        try
        {
            await _userService.DeleteAccountAsync(userId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "User not found" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get public profile of a user (tipster)
    /// </summary>
    [HttpGet("{id:guid}/profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserProfile(Guid id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        var stats = await CalculateUserStatsAsync(id);
        var ranking = await CalculateUserRankingAsync(id);

        var dto = new UserProfileDto(
            user.Id,
            user.Username,
            ranking,
            stats
        );

        return Ok(dto);
    }

    // --- Stats endpoint ---

    [HttpGet("{id:guid}/stats")]
    [ProducesResponseType(typeof(TipsterStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTipsterStats(Guid id)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == id && u.DeletedAt == null);

        if (!userExists)
            return NotFound(new { error = "User not found" });

        // Cache tipster stats for 5 minutes
        var stats = await _cache.GetOrCreateAsync(
            CacheKeys.TipsterStats(id),
            () => CalculateTipsterStatsAsync(id),
            CacheKeys.TipsterStatsTtl);

        return Ok(stats);
    }

    // --- Follow endpoints ---

    [HttpPost("{id:guid}/follow")]
    [Authorize]
    public async Task<IActionResult> Follow(Guid id)
    {
        var userId = GetUserId();
        var result = await _followService.FollowAsync(userId, id);
        return Ok(result);
    }

    [HttpPost("{id:guid}/unfollow")]
    [Authorize]
    public async Task<IActionResult> Unfollow(Guid id)
    {
        var userId = GetUserId();
        var result = await _followService.UnfollowAsync(userId, id);
        return Ok(result);
    }

    [HttpGet("{id:guid}/followers")]
    public async Task<IActionResult> GetFollowers(Guid id)
    {
        var followers = await _followService.GetFollowersAsync(id);
        return Ok(followers);
    }

    [HttpGet("{id:guid}/following")]
    public async Task<IActionResult> GetFollowing(Guid id)
    {
        var following = await _followService.GetFollowingAsync(id);
        return Ok(following);
    }

    [HttpGet("{id:guid}/follow-info")]
    public async Task<IActionResult> GetFollowInfo(Guid id)
    {
        Guid? currentUserId = null;
        try { currentUserId = GetUserId(); } catch { /* anonymous */ }
        var info = await _followService.GetFollowInfoAsync(id, currentUserId);
        return Ok(info);
    }

    private async Task<UserStatsDto> CalculateUserStatsAsync(Guid userId)
    {
        // Get user's finished tickets
        var userTickets = await _context.Tickets
            .Where(t => t.CreatorId == userId && t.DeletedAt == null && t.Status == TicketStatus.Finished)
            .ToListAsync();

        var ticketsCreated = await _context.Tickets
            .CountAsync(t => t.CreatorId == userId && t.DeletedAt == null);

        var ticketsSold = await _context.TicketPurchases
            .CountAsync(p => p.Ticket!.CreatorId == userId);

        // Calculate ROI
        decimal roi = 0;
        decimal avgOdds = 0;

        if (userTickets.Any())
        {
            var winCount = userTickets.Count(t => t.Result == TicketResult.Win);
            var totalTickets = userTickets.Count;

            // ROI: (wins * avgOdds - totalTickets) / totalTickets * 100
            var totalProfit = userTickets.Sum(t =>
                t.Result == TicketResult.Win ? t.AvgOdds - 1 : -1);
            roi = totalTickets > 0 ? Math.Round((totalProfit / totalTickets) * 100, 2) : 0;

            avgOdds = Math.Round(userTickets.Average(t => t.AvgOdds), 2);
        }

        var followersCount = await _context.UserFollows
            .CountAsync(f => f.FollowedUserId == userId);

        return new UserStatsDto(ticketsCreated, ticketsSold, roi, avgOdds, followersCount);
    }

    private async Task<RankingDto?> CalculateUserRankingAsync(Guid userId)
    {
        // This is a simplified version - in production you might want to cache rankings
        var now = DateTime.UtcNow;

        var dailyRank = await GetUserRankForPeriodAsync(userId, now.Date, now);
        var weeklyRank = await GetUserRankForPeriodAsync(userId, now.Date.AddDays(-7), now);
        var monthlyRank = await GetUserRankForPeriodAsync(userId, now.Date.AddDays(-30), now);

        if (dailyRank == 0 && weeklyRank == 0 && monthlyRank == 0)
        {
            return null;
        }

        return new RankingDto(dailyRank, weeklyRank, monthlyRank);
    }

    private async Task<int> GetUserRankForPeriodAsync(Guid userId, DateTime start, DateTime end)
    {
        var rankings = await _context.Tickets
            .Where(t => t.DeletedAt == null
                && t.Status == TicketStatus.Finished
                && t.Result != TicketResult.Pending
                && t.FirstMatchTime >= start && t.FirstMatchTime < end
                && t.IsPublic)
            .GroupBy(t => t.CreatorId)
            .Select(g => new
            {
                UserId = g.Key,
                ROI = g.Sum(t => t.Result == TicketResult.Win ? t.AvgOdds - 1 : -1) / g.Count() * 100
            })
            .OrderByDescending(x => x.ROI)
            .ToListAsync();

        var rank = rankings.FindIndex(r => r.UserId == userId);
        return rank >= 0 ? rank + 1 : 0;
    }

    private async Task<TipsterStatsDto> CalculateTipsterStatsAsync(Guid userId)
    {
        // Aggregate ticket stats in a single database query (no ToListAsync on all tickets)
        var ticketStats = await _context.Tickets
            .Where(t => t.CreatorId == userId && t.DeletedAt == null)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTickets = g.Count(),
                WinCount = g.Count(t => t.Status == TicketStatus.Finished && t.Result == TicketResult.Win),
                LoseCount = g.Count(t => t.Status == TicketStatus.Finished && t.Result == TicketResult.Lose),
                PendingCount = g.Count(t => t.Status != TicketStatus.Finished),
                AvgOddsFinished = g.Where(t => t.Status == TicketStatus.Finished).Average(t => (decimal?)t.AvgOdds),
                AvgOddsWin = g.Where(t => t.Status == TicketStatus.Finished && t.Result == TicketResult.Win).Average(t => (decimal?)t.AvgOdds),
                AvgConfidence = g.Average(t => (decimal?)t.ConfidenceIndex),
                HighestWinOdd = g.Where(t => t.Status == TicketStatus.Finished && t.Result == TicketResult.Win).Max(t => (decimal?)t.AvgOdds),
            })
            .FirstOrDefaultAsync();

        // Aggregate purchase stats in a single database query
        var purchaseStats = await _context.TicketPurchases
            .Where(p => p.Ticket!.CreatorId == userId)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TicketsSold = g.Count(),
                UniqueBuyers = g.Select(p => p.BuyerId).Distinct().Count(),
                RevenueGrossCents = g.Sum(p => p.PriceCents),
                TotalCommissionCents = g.Sum(p => p.CommissionCents),
            })
            .FirstOrDefaultAsync();

        // For streak calculation, fetch only minimal data (just the Result enum)
        var streakData = await _context.Tickets
            .Where(t => t.CreatorId == userId && t.DeletedAt == null
                && t.Status == TicketStatus.Finished
                && (t.Result == TicketResult.Win || t.Result == TicketResult.Lose))
            .OrderBy(t => t.CreatedAt)
            .Select(t => t.Result)
            .ToListAsync();

        // Calculate streaks in memory (O(n) with minimal data transfer)
        int longestWinStreak = 0, longestLoseStreak = 0;
        int currentWinStreak = 0, currentLoseStreak = 0;

        foreach (var result in streakData)
        {
            if (result == TicketResult.Win)
            {
                currentWinStreak++;
                currentLoseStreak = 0;
                if (currentWinStreak > longestWinStreak)
                    longestWinStreak = currentWinStreak;
            }
            else
            {
                currentLoseStreak++;
                currentWinStreak = 0;
                if (currentLoseStreak > longestLoseStreak)
                    longestLoseStreak = currentLoseStreak;
            }
        }

        // Build result with null-safe defaults
        var totalTickets = ticketStats?.TotalTickets ?? 0;
        var winCount = ticketStats?.WinCount ?? 0;
        var loseCount = ticketStats?.LoseCount ?? 0;
        var totalDecided = winCount + loseCount;

        decimal winRate = totalDecided > 0
            ? Math.Round((decimal)winCount / totalDecided * 100, 1)
            : 0;
        decimal winLossRatio = totalDecided > 0
            ? Math.Round((decimal)winCount / totalDecided, 2)
            : 0;

        var revenueGrossCents = purchaseStats?.RevenueGrossCents ?? 0;
        var totalCommissionCents = purchaseStats?.TotalCommissionCents ?? 0;

        // Convert cents to EUR for DTO
        var revenueGrossEur = revenueGrossCents / 100m;
        var revenueNetEur = (revenueGrossCents - totalCommissionCents) / 100m;

        return new TipsterStatsDto(
            totalTickets,
            purchaseStats?.TicketsSold ?? 0,
            purchaseStats?.UniqueBuyers ?? 0,
            winCount,
            loseCount,
            ticketStats?.PendingCount ?? 0,
            winRate,
            winLossRatio,
            ticketStats?.AvgOddsFinished.HasValue == true ? Math.Round(ticketStats.AvgOddsFinished.Value, 2) : 0,
            ticketStats?.AvgOddsWin.HasValue == true ? Math.Round(ticketStats.AvgOddsWin.Value, 2) : null,
            ticketStats?.AvgConfidence.HasValue == true ? Math.Round(ticketStats.AvgConfidence.Value, 1) : 0,
            revenueGrossEur,
            revenueNetEur,
            ticketStats?.HighestWinOdd.HasValue == true ? Math.Round(ticketStats.HighestWinOdd.Value, 2) : null,
            longestWinStreak,
            longestLoseStreak
        );
    }
}

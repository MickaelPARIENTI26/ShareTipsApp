using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.ExternalApis;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Development-only endpoints for testing API sync without admin authentication.
/// These endpoints are only available in Development environment.
/// </summary>
[ApiController]
[Route("api/dev")]
[AllowAnonymous]
public class DevController : ControllerBase
{
    private readonly IOddsSyncService _syncService;
    private readonly TheOddsApiService _oddsApi;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<DevController> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public DevController(
        IOddsSyncService syncService,
        TheOddsApiService oddsApi,
        IOptions<TheOddsApiConfig> config,
        ILogger<DevController> logger,
        IWebHostEnvironment env,
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        _syncService = syncService;
        _oddsApi = oddsApi;
        _config = config.Value;
        _logger = logger;
        _env = env;
        _context = context;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Get current API quota status (FREE - no API credits)
    /// </summary>
    [HttpGet("quota")]
    public IActionResult GetQuota()
    {
        if (!_env.IsDevelopment()) return NotFound();

        return Ok(new
        {
            RemainingCredits = _syncService.GetRemainingQuota(),
            EnabledLeagues = _config.EnabledSportKeys,
            EnabledMarkets = _config.EnabledMarkets,
            EstimatedSyncCost = _config.EnabledSportKeys.Count * _config.EnabledMarkets.Count
        });
    }

    /// <summary>
    /// Get available sports from The Odds API (FREE - no API credits)
    /// </summary>
    [HttpGet("sports")]
    public async Task<IActionResult> GetAvailableSports([FromQuery] string? filter = null)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var sports = await _oddsApi.GetSportsAsync();

        // Filter to show only active sports, optionally filtered by keyword
        var filteredSports = sports
            .Where(s => s.Active)
            .Where(s => string.IsNullOrEmpty(filter) ||
                        s.Key.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        s.Title.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        s.Group.Contains(filter, StringComparison.OrdinalIgnoreCase))
            .OrderBy(s => s.Group)
            .ThenBy(s => s.Title)
            .ToList();

        return Ok(new
        {
            TotalActive = sports.Count(s => s.Active),
            FilteredCount = filteredSports.Count,
            Sports = filteredSports
        });
    }

    /// <summary>
    /// Get upcoming events for a specific sport (FREE - no API credits)
    /// </summary>
    [HttpGet("events/{sportKey}")]
    public async Task<IActionResult> GetEvents(string sportKey)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var events = await _oddsApi.GetEventsAsync(sportKey);
        return Ok(new
        {
            SportKey = sportKey,
            EventCount = events.Count,
            Events = events.OrderBy(e => e.CommenceTime).ToList()
        });
    }

    /// <summary>
    /// Sync a specific league - loads matches and odds (COSTS API CREDITS)
    /// </summary>
    [HttpPost("sync/{sportKey}")]
    public async Task<IActionResult> SyncLeague(string sportKey)
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Manual sync triggered for {SportKey}", sportKey);
        var result = await _syncService.SyncLeagueAsync(sportKey);
        _logger.LogInformation("[DEV] Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync all enabled leagues (COSTS API CREDITS: leagues x markets)
    /// </summary>
    [HttpPost("sync/all")]
    public async Task<IActionResult> SyncAll()
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Manual sync triggered for all leagues");
        var result = await _syncService.SyncAllLeaguesAsync();
        _logger.LogInformation("[DEV] Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync scores for live/finished matches (COSTS API CREDITS)
    /// </summary>
    [HttpPost("sync/scores")]
    public async Task<IActionResult> SyncScores()
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Scores sync triggered");
        var result = await _syncService.SyncScoresAsync();

        return Ok(result);
    }

    /// <summary>
    /// Manually set a match result (for testing without API)
    /// </summary>
    [HttpPost("matches/{matchId}/result")]
    public async Task<IActionResult> SetMatchResult(Guid matchId, [FromBody] SetMatchResultRequest request)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var match = await _context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .FirstOrDefaultAsync(m => m.Id == matchId);

        if (match == null)
            return NotFound(new { Error = "Match not found" });

        match.HomeScore = request.HomeScore;
        match.AwayScore = request.AwayScore;
        match.Status = MatchStatus.Finished;
        match.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("[DEV] Match {MatchId} result set: {Home} {HomeScore} - {AwayScore} {Away}",
            matchId, match.HomeTeam?.Name, request.HomeScore, request.AwayScore, match.AwayTeam?.Name);

        return Ok(new
        {
            MatchId = matchId,
            HomeTeam = match.HomeTeam?.Name,
            AwayTeam = match.AwayTeam?.Name,
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            Status = match.Status.ToString()
        });
    }

    /// <summary>
    /// Get all matches for a ticket (to see which need results)
    /// </summary>
    [HttpGet("tickets/{ticketId}/matches")]
    public async Task<IActionResult> GetTicketMatches(Guid ticketId)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var ticket = await _context.Tickets
            .Include(t => t.Selections)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
            return NotFound(new { Error = "Ticket not found" });

        var matchIds = ticket.Selections.Select(s => s.MatchId).Distinct().ToList();
        var matches = await _context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => matchIds.Contains(m.Id))
            .ToListAsync();

        return Ok(new
        {
            TicketId = ticketId,
            TicketStatus = ticket.Status.ToString(),
            TicketResult = ticket.Result.ToString(),
            Selections = ticket.Selections.Select(s => new
            {
                s.Id,
                s.MatchId,
                s.MarketType,
                s.SelectionLabel,
                s.Odds
            }),
            Matches = matches.Select(m => new
            {
                m.Id,
                HomeTeam = m.HomeTeam?.Name,
                AwayTeam = m.AwayTeam?.Name,
                m.HomeScore,
                m.AwayScore,
                Status = m.Status.ToString(),
                m.StartTime
            })
        });
    }

    /// <summary>
    /// Process ticket results for all locked tickets with finished matches
    /// </summary>
    [HttpPost("tickets/process-results")]
    public async Task<IActionResult> ProcessTicketResults()
    {
        if (!_env.IsDevelopment()) return NotFound();

        var processedTickets = new List<object>();

        // Find locked tickets where all matches are finished
        var lockedTickets = await _context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Purchases)
            .Include(t => t.Creator)
            .Where(t => t.Status == TicketStatus.Locked && t.DeletedAt == null)
            .ToListAsync();

        foreach (var ticket in lockedTickets)
        {
            var matchIds = ticket.Selections.Select(s => s.MatchId).Distinct().ToList();
            var matches = await _context.Matches
                .Include(m => m.HomeTeam)
                .Include(m => m.AwayTeam)
                .Where(m => matchIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id);

            // Check if all matches are finished
            if (!matches.Values.All(m => m.Status == MatchStatus.Finished))
            {
                var pendingCount = matches.Values.Count(m => m.Status != MatchStatus.Finished);
                processedTickets.Add(new
                {
                    TicketId = ticket.Id,
                    Status = "Skipped",
                    Reason = $"{pendingCount} match(es) not finished yet"
                });
                continue;
            }

            // Determine result
            var allCorrect = true;
            var selectionResults = new List<object>();

            foreach (var selection in ticket.Selections)
            {
                if (!matches.TryGetValue(selection.MatchId, out var match))
                {
                    allCorrect = false;
                    selectionResults.Add(new { SelectionId = selection.Id, Result = "Match not found" });
                    continue;
                }

                if (match.HomeScore == null || match.AwayScore == null)
                {
                    allCorrect = false;
                    selectionResults.Add(new { SelectionId = selection.Id, Result = "No scores" });
                    continue;
                }

                var isCorrect = IsSelectionCorrect(selection, match);
                if (!isCorrect) allCorrect = false;

                selectionResults.Add(new
                {
                    SelectionId = selection.Id,
                    Selection = selection.SelectionLabel,
                    Market = selection.MarketType,
                    Match = $"{match.HomeTeam?.Name} vs {match.AwayTeam?.Name}",
                    Score = $"{match.HomeScore}-{match.AwayScore}",
                    Result = isCorrect ? "Correct" : "Wrong"
                });
            }

            // Update ticket
            ticket.Status = TicketStatus.Finished;
            ticket.Result = allCorrect ? TicketResult.Win : TicketResult.Lose;

            // Process winnings if won
            if (ticket.Result == TicketResult.Win)
            {
                foreach (var purchase in ticket.Purchases)
                {
                    var buyerWallet = await _context.Wallets
                        .FirstOrDefaultAsync(w => w.UserId == purchase.BuyerId);

                    if (buyerWallet != null)
                    {
                        var winnings = (int)Math.Floor(purchase.PriceCredits * ticket.AvgOdds);
                        buyerWallet.BalanceCredits += winnings;
                        buyerWallet.UpdatedAt = DateTime.UtcNow;

                        _context.WalletTransactions.Add(new WalletTransaction
                        {
                            Id = Guid.NewGuid(),
                            WalletId = buyerWallet.Id,
                            Type = TransactionType.Win,
                            AmountCredits = winnings,
                            ReferenceId = ticket.Id,
                            Status = TransactionStatus.Completed,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            // Notify users
            var isWin = ticket.Result == TicketResult.Win;
            var notificationType = isWin ? NotificationType.TicketWon : NotificationType.TicketLost;
            var title = isWin ? "Pronostic validé 🎉" : "Pronostic non validé ❌";
            var tipsterName = ticket.Creator?.Username ?? "Un tipster";
            var message = isWin
                ? $"Le pronostic de {tipsterName} est validé !"
                : $"Le pronostic de {tipsterName} n'est pas validé.";

            var buyerIds = ticket.Purchases.Select(p => p.BuyerId).ToList();
            var now = DateTime.UtcNow;
            var subscriberIds = await _context.Subscriptions
                .Where(s => s.TipsterId == ticket.CreatorId
                    && s.Status == SubscriptionStatus.Active
                    && s.EndDate > now)
                .Select(s => s.SubscriberId)
                .ToListAsync();

            var userIdsToNotify = buyerIds.Union(subscriberIds).Distinct().ToList();

            if (userIdsToNotify.Count > 0)
            {
                await _notificationService.NotifyManyAsync(
                    userIdsToNotify,
                    notificationType,
                    title,
                    message,
                    new { ticketId = ticket.Id, tipsterId = ticket.CreatorId });
            }

            processedTickets.Add(new
            {
                TicketId = ticket.Id,
                TicketTitle = ticket.Title,
                Result = ticket.Result.ToString(),
                SelectionResults = selectionResults,
                NotifiedUsers = userIdsToNotify.Count
            });

            _logger.LogInformation("[DEV] Ticket {TicketId} processed: {Result}", ticket.Id, ticket.Result);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            ProcessedCount = processedTickets.Count,
            Tickets = processedTickets
        });
    }

    private bool IsSelectionCorrect(TicketSelection selection, Match match)
    {
        var homeScore = match.HomeScore!.Value;
        var awayScore = match.AwayScore!.Value;
        var label = selection.SelectionLabel.ToLowerInvariant();
        var marketType = selection.MarketType.ToLowerInvariant();
        var homeTeamLower = (match.HomeTeam?.Name ?? "").ToLowerInvariant();
        var awayTeamLower = (match.AwayTeam?.Name ?? "").ToLowerInvariant();

        // Head-to-head (1X2) market
        if (marketType == "h2h" || marketType == "1x2" || marketType == "matchresult")
        {
            if (label.Contains("home") || label == "1" || (homeTeamLower.Length > 0 && label.Contains(homeTeamLower)))
                return homeScore > awayScore;

            if (label.Contains("away") || label == "2" || (awayTeamLower.Length > 0 && label.Contains(awayTeamLower)))
                return awayScore > homeScore;

            if (label.Contains("draw") || label.Contains("nul") || label == "x")
                return homeScore == awayScore;
        }

        // Totals (Over/Under)
        if (marketType == "totals" || marketType == "overunder" || marketType.Contains("over") || marketType.Contains("under"))
        {
            var totalGoals = homeScore + awayScore;
            var regexMatch = System.Text.RegularExpressions.Regex.Match(label, @"(\d+\.?\d*)");
            if (regexMatch.Success && decimal.TryParse(regexMatch.Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var threshold))
            {
                if (label.Contains("over") || label.Contains("+"))
                    return totalGoals > threshold;
                if (label.Contains("under") || label.Contains("-"))
                    return totalGoals < threshold;
            }
        }

        // Double chance
        if (marketType == "double_chance" || marketType == "doublechance")
        {
            if (label.Contains("1x") || (label.Contains("home") && label.Contains("draw")))
                return homeScore >= awayScore;
            if (label.Contains("x2") || (label.Contains("away") && label.Contains("draw")))
                return awayScore >= homeScore;
            if (label.Contains("12") || label.Contains("no draw"))
                return homeScore != awayScore;
        }

        // Both teams to score
        if (marketType == "btts" || marketType == "bothteamstoscore" || marketType.Contains("both"))
        {
            var bothScored = homeScore > 0 && awayScore > 0;
            if (label.Contains("yes") || label.Contains("oui"))
                return bothScored;
            if (label.Contains("no") || label.Contains("non"))
                return !bothScored;
        }

        _logger.LogWarning("[DEV] Unknown market/selection: {MarketType} / {Label}", marketType, label);
        return false;
    }
}

public record SetMatchResultRequest(int HomeScore, int AwayScore);

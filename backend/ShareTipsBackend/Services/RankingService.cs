using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class RankingService : IRankingService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    public RankingService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<RankingResponseDto> GetRankingAsync(string period, int limit = 100)
    {
        // Cache rankings per period (5 min TTL)
        var cacheKey = CacheKeys.Rankings(period.ToLower());

        return await _cache.GetOrCreateAsync(
            cacheKey,
            () => CalculateRankingAsync(period, limit),
            CacheKeys.RankingsTtl);
    }

    private async Task<RankingResponseDto> CalculateRankingAsync(string period, int limit)
    {
        var (periodStart, periodEnd) = GetPeriodRange(period);

        // Aggregate stats at database level (single query, no N+1)
        // Include both public and private tickets in ranking
        var userStats = await _context.Tickets
            .Where(t => t.DeletedAt == null)
            .Where(t => t.Status == TicketStatus.Finished)
            .Where(t => t.Result != TicketResult.Pending)
            .Where(t => t.FirstMatchTime >= periodStart && t.FirstMatchTime < periodEnd)
            .GroupBy(t => new { t.CreatorId, t.Creator!.Username })
            .Select(g => new
            {
                UserId = g.Key.CreatorId,
                Username = g.Key.Username ?? "Unknown",
                WinCount = g.Count(t => t.Result == TicketResult.Win),
                LoseCount = g.Count(t => t.Result == TicketResult.Lose),
                TotalTickets = g.Count(),
                AvgOdds = g.Average(t => t.AvgOdds),
                // Sum of profit: Win = (odds - 1), Lose = -1
                TotalProfit = g.Sum(t => t.Result == TicketResult.Win ? t.AvgOdds - 1 : -1)
            })
            .Where(s => s.TotalTickets > 0)
            .ToListAsync();

        // Calculate ROI and WinRate in memory (simple arithmetic on aggregated results)
        var rankedStats = userStats
            .Select(s => new
            {
                s.UserId,
                s.Username,
                ROI = s.TotalTickets > 0 ? (s.TotalProfit / s.TotalTickets) * 100 : 0,
                WinRate = s.TotalTickets > 0 ? (decimal)s.WinCount / s.TotalTickets * 100 : 0,
                s.AvgOdds,
                s.TotalTickets,
                s.WinCount,
                s.LoseCount
            })
            .OrderByDescending(s => s.ROI)
            .Take(limit)
            .ToList();

        // Assign ranks
        var rankings = rankedStats.Select((s, index) => new RankingEntryDto(
            Rank: index + 1,
            UserId: s.UserId,
            Username: s.Username,
            ROI: Math.Round(s.ROI, 2),
            WinRate: Math.Round(s.WinRate, 2),
            AvgOdds: Math.Round(s.AvgOdds, 2),
            TotalTickets: s.TotalTickets,
            WinCount: s.WinCount,
            LoseCount: s.LoseCount
        ));

        return new RankingResponseDto(
            Period: period.ToLower(),
            PeriodStart: periodStart,
            PeriodEnd: periodEnd,
            Rankings: rankings
        );
    }

    private static (DateTime Start, DateTime End) GetPeriodRange(string period)
    {
        var now = DateTime.UtcNow;
        var end = now;

        return period.ToLower() switch
        {
            "daily" => (now.Date, end),
            "weekly" => (now.Date.AddDays(-7), end),
            "monthly" => (now.Date.AddDays(-30), end),
            _ => throw new ArgumentException($"Invalid period: {period}. Use 'daily', 'weekly', or 'monthly'.")
        };
    }
}

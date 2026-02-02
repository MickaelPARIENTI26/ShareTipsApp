using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class MatchService : IMatchService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    // Short TTL for matches (they change more frequently)
    private static readonly TimeSpan MatchesCacheTtl = TimeSpan.FromMinutes(2);

    public MatchService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<IEnumerable<MatchListDto>> GetUpcomingMatchesAsync(string? sportCode = null, Guid? leagueId = null, int days = 7)
    {
        // Build cache key based on parameters
        var cacheKey = $"matches:upcoming:{sportCode ?? "all"}:{leagueId?.ToString() ?? "all"}:{days}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var now = DateTime.UtcNow;
                var endDate = now.AddDays(days);

                var query = _context.Matches
                    .Include(m => m.League)
                    .Include(m => m.HomeTeam)
                    .Include(m => m.AwayTeam)
                    .Include(m => m.Markets)
                    .Where(m => m.StartTime >= now && m.StartTime <= endDate)
                    .Where(m => m.Status == MatchStatus.Scheduled);

                if (!string.IsNullOrEmpty(sportCode))
                    query = query.Where(m => m.SportCode == sportCode.ToUpperInvariant());

                if (leagueId.HasValue)
                    query = query.Where(m => m.LeagueId == leagueId.Value);

                return await query
                    .OrderBy(m => m.StartTime)
                    .Select(m => new MatchListDto(
                        m.Id,
                        m.SportCode,
                        m.League!.Name,
                        m.HomeTeam!.Name,
                        m.AwayTeam!.Name,
                        m.StartTime,
                        m.Status.ToString(),
                        m.Markets.Count
                    ))
                    .ToListAsync();
            },
            MatchesCacheTtl);
    }

    public async Task<MatchDto?> GetMatchByIdAsync(Guid id)
    {
        var match = await _context.Matches
            .Include(m => m.League)
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.Markets)
                .ThenInclude(mk => mk.Selections)
                    .ThenInclude(s => s.Player)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (match == null) return null;

        return new MatchDto(
            match.Id,
            match.SportCode,
            match.League!.Name,
            new TeamInfoDto(match.HomeTeam!.Id, match.HomeTeam.Name, match.HomeTeam.ShortName, match.HomeTeam.LogoUrl),
            new TeamInfoDto(match.AwayTeam!.Id, match.AwayTeam.Name, match.AwayTeam.ShortName, match.AwayTeam.LogoUrl),
            match.StartTime,
            match.Status.ToString(),
            match.HomeScore,
            match.AwayScore,
            match.Markets.Where(mk => mk.IsActive).Select(mk => new MarketDto(
                mk.Id,
                mk.Type.ToString(),
                mk.Label,
                mk.Line,
                mk.Selections.Where(s => s.IsActive).Select(s => new SelectionDto(
                    s.Id,
                    s.Code,
                    s.Label,
                    s.Odds,
                    s.Player?.Name
                )).ToList()
            )).ToList()
        );
    }

    public async Task<MatchDto> CreateMatchAsync(CreateMatchRequest request)
    {
        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = request.SportCode.ToUpperInvariant(),
            LeagueId = request.LeagueId,
            HomeTeamId = request.HomeTeamId,
            AwayTeamId = request.AwayTeamId,
            StartTime = request.StartTime,
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        // Invalidate matches cache
        _cache.RemoveByPrefix("matches:");

        return (await GetMatchByIdAsync(match.Id))!;
    }

    public async Task<MatchDto?> UpdateMatchAsync(Guid id, UpdateMatchRequest request)
    {
        var match = await _context.Matches.FindAsync(id);
        if (match == null) return null;

        if (request.StartTime.HasValue) match.StartTime = request.StartTime.Value;
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<MatchStatus>(request.Status, out var status))
            match.Status = status;
        if (request.HomeScore.HasValue) match.HomeScore = request.HomeScore.Value;
        if (request.AwayScore.HasValue) match.AwayScore = request.AwayScore.Value;

        match.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Invalidate matches cache
        _cache.RemoveByPrefix("matches:");

        return await GetMatchByIdAsync(id);
    }

    public async Task<bool> DeleteMatchAsync(Guid id)
    {
        var match = await _context.Matches.FindAsync(id);
        if (match == null) return false;

        _context.Matches.Remove(match);
        await _context.SaveChangesAsync();

        // Invalidate matches cache
        _cache.RemoveByPrefix("matches:");

        return true;
    }

    public async Task<MarketDto> CreateMarketAsync(CreateMarketRequest request)
    {
        if (!Enum.TryParse<MarketType>(request.Type, out var marketType))
            throw new ArgumentException($"Invalid market type: {request.Type}");

        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = request.MatchId,
            Type = marketType,
            Label = request.Label,
            Line = request.Line,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var sel in request.Selections)
        {
            market.Selections.Add(new MarketSelection
            {
                Id = Guid.NewGuid(),
                MarketId = market.Id,
                Code = sel.Code,
                Label = sel.Label,
                Odds = sel.Odds,
                PlayerId = sel.PlayerId,
                IsActive = true
            });
        }

        _context.Markets.Add(market);
        await _context.SaveChangesAsync();

        return new MarketDto(
            market.Id,
            market.Type.ToString(),
            market.Label,
            market.Line,
            market.Selections.Select(s => new SelectionDto(s.Id, s.Code, s.Label, s.Odds, null)).ToList()
        );
    }

    public async Task<bool> UpdateOddsAsync(UpdateOddsRequest request)
    {
        var selection = await _context.Set<MarketSelection>().FindAsync(request.SelectionId);
        if (selection == null) return false;

        selection.Odds = request.NewOdds;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMarketAsync(Guid id)
    {
        var market = await _context.Markets.FindAsync(id);
        if (market == null) return false;

        market.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }
}

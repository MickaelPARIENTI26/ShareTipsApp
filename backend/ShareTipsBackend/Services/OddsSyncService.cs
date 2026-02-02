using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services.ExternalApis;

namespace ShareTipsBackend.Services;

public interface IOddsSyncService
{
    Task<OddsSyncResult> SyncAllLeaguesAsync();
    Task<OddsSyncResult> SyncLeagueAsync(string sportKey);
    Task<OddsSyncResult> SyncScoresAsync();
    int? GetRemainingQuota();
}

public class OddsSyncService : IOddsSyncService
{
    private readonly ApplicationDbContext _context;
    private readonly TheOddsApiService _oddsApi;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<OddsSyncService> _logger;

    // Mapping The Odds API sport_key to our internal structure
    private static readonly Dictionary<string, (string SportCode, string LeagueName, string Country)> LeagueMapping = new()
    {
        // Football (Soccer)
        ["soccer_france_ligue_one"] = ("FOOTBALL", "Ligue 1", "FR"),
        ["soccer_epl"] = ("FOOTBALL", "Premier League", "GB"),
        ["soccer_italy_serie_a"] = ("FOOTBALL", "Serie A", "IT"),
        ["soccer_spain_la_liga"] = ("FOOTBALL", "La Liga", "ES"),
        ["soccer_germany_bundesliga"] = ("FOOTBALL", "Bundesliga", "DE"),
        ["soccer_uefa_champs_league"] = ("FOOTBALL", "UEFA Champions League", "EU"),
        ["soccer_uefa_europa_league"] = ("FOOTBALL", "UEFA Europa League", "EU"),
        ["soccer_netherlands_eredivisie"] = ("FOOTBALL", "Eredivisie", "NL"),
        ["soccer_portugal_primeira_liga"] = ("FOOTBALL", "Primeira Liga", "PT"),
        ["soccer_belgium_first_div"] = ("FOOTBALL", "Jupiler Pro League", "BE"),

        // Basketball
        ["basketball_nba"] = ("BASKETBALL", "NBA", "US"),
        ["basketball_euroleague"] = ("BASKETBALL", "Euroleague", "EU"),
        ["basketball_ncaab"] = ("BASKETBALL", "NCAA Basketball", "US"),
        ["basketball_nbl"] = ("BASKETBALL", "NBL Australia", "AU"),
        ["basketball_wbbl"] = ("BASKETBALL", "WNBA", "US")
    };

    public OddsSyncService(
        ApplicationDbContext context,
        TheOddsApiService oddsApi,
        IOptions<TheOddsApiConfig> config,
        ILogger<OddsSyncService> logger)
    {
        _context = context;
        _oddsApi = oddsApi;
        _config = config.Value;
        _logger = logger;
    }

    public int? GetRemainingQuota() => _oddsApi.RequestsRemaining;

    public async Task<OddsSyncResult> SyncAllLeaguesAsync()
    {
        var result = new OddsSyncResult();

        foreach (var sportKey in _config.EnabledSportKeys)
        {
            try
            {
                var leagueResult = await SyncLeagueAsync(sportKey);
                result.MatchesCreated += leagueResult.MatchesCreated;
                result.MatchesUpdated += leagueResult.MatchesUpdated;
                result.MarketsCreated += leagueResult.MarketsCreated;
                result.MarketsUpdated += leagueResult.MarketsUpdated;
                result.TeamsCreated += leagueResult.TeamsCreated;
                result.ApiCreditsUsed += leagueResult.ApiCreditsUsed;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing {SportKey}", sportKey);
                result.Errors.Add($"{sportKey}: {ex.Message}");
            }
        }

        result.RemainingQuota = _oddsApi.RequestsRemaining;
        return result;
    }

    public async Task<OddsSyncResult> SyncLeagueAsync(string sportKey)
    {
        var result = new OddsSyncResult();

        if (!LeagueMapping.TryGetValue(sportKey, out var leagueInfo))
        {
            _logger.LogWarning("Unknown sport_key: {SportKey}", sportKey);
            return result;
        }

        _logger.LogInformation("Syncing {SportKey} ({LeagueName})...", sportKey, leagueInfo.LeagueName);

        // 1. Ensure league exists
        var league = await EnsureLeagueExistsAsync(sportKey, leagueInfo);

        // 2. Fetch odds from API (costs credits)
        var eventsWithOdds = await _oddsApi.GetOddsAsync(sportKey);
        result.ApiCreditsUsed = _config.EnabledMarkets.Count; // 1 credit per market per region

        // 3. Process each event - first create all matches
        foreach (var apiEvent in eventsWithOdds)
        {
            try
            {
                var (matchCreated, matchUpdated) = await ProcessMatchAsync(apiEvent, league);
                if (matchCreated) result.MatchesCreated++;
                if (matchUpdated) result.MatchesUpdated++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing match {EventId}", apiEvent.Id);
            }
        }

        // Save matches first so they exist in DB for market processing
        await _context.SaveChangesAsync();

        // 4. Now process markets (odds) for all events
        foreach (var apiEvent in eventsWithOdds)
        {
            try
            {
                var (marketsCreated, marketsUpdated, teamsCreated) = await ProcessMarketsAsync(apiEvent);
                result.MarketsCreated += marketsCreated;
                result.MarketsUpdated += marketsUpdated;
                result.TeamsCreated += teamsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing markets for {EventId}", apiEvent.Id);
            }
        }

        await _context.SaveChangesAsync();
        result.RemainingQuota = _oddsApi.RequestsRemaining;

        _logger.LogInformation("Sync complete for {SportKey}: {MatchesCreated} matches created, {MarketsUpdated} markets updated",
            sportKey, result.MatchesCreated, result.MarketsUpdated);

        return result;
    }

    /// <summary>
    /// Sync scores from The Odds API.
    /// Strategy: First fetch live games (1 credit), then fetch recent history if needed (2 credits)
    /// </summary>
    public async Task<OddsSyncResult> SyncScoresAsync()
    {
        var result = new OddsSyncResult();

        // Check if we have any locked tickets with matches that need score updates
        var needsHistoricalData = await _context.Tickets
            .AnyAsync(t => t.Status == TicketStatus.Locked
                && t.Selections.Any(s => _context.Matches
                    .Any(m => m.Id == s.MatchId
                        && m.Status != MatchStatus.Finished
                        && m.StartTime < DateTime.UtcNow.AddHours(-2))));

        foreach (var sportKey in _config.EnabledSportKeys)
        {
            try
            {
                // First call: Live games only (1 credit per sport)
                var scores = await _oddsApi.GetScoresAsync(sportKey);
                result.ApiCreditsUsed++;

                // If we need historical data and have locked tickets waiting, fetch history (2 credits)
                if (needsHistoricalData && scores.Count == 0)
                {
                    scores = await _oddsApi.GetScoresAsync(sportKey, daysFrom: 1);
                    result.ApiCreditsUsed++; // +1 for daysFrom parameter
                }

                var updatedCount = await ProcessScoresAsync(scores);
                result.MatchesUpdated += updatedCount;
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                _logger.LogWarning("API rate limit reached for {SportKey}", sportKey);
                result.Errors.Add($"Rate limit reached for {sportKey}");
                break; // Stop making more requests
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing scores for {SportKey}", sportKey);
                result.Errors.Add($"Scores {sportKey}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync();
        result.RemainingQuota = _oddsApi.RequestsRemaining;
        return result;
    }

    private async Task<int> ProcessScoresAsync(List<OddsApiScore> scores)
    {
        var updatedCount = 0;

        foreach (var score in scores.Where(s => s.Scores != null))
        {
            var match = await _context.Matches
                .FirstOrDefaultAsync(m => m.ExternalId == score.Id);

            if (match == null) continue;

            var homeScore = score.Scores?.FirstOrDefault(s => s.Name == score.HomeTeam)?.Score;
            var awayScore = score.Scores?.FirstOrDefault(s => s.Name == score.AwayTeam)?.Score;
            var newStatus = score.Completed ? MatchStatus.Finished : MatchStatus.Live;

            // Only update if something changed
            var hasChanges = match.HomeScore != homeScore
                || match.AwayScore != awayScore
                || match.Status != newStatus;

            if (hasChanges)
            {
                if (homeScore.HasValue) match.HomeScore = homeScore.Value;
                if (awayScore.HasValue) match.AwayScore = awayScore.Value;
                match.Status = newStatus;
                match.UpdatedAt = DateTime.UtcNow;
                updatedCount++;

                _logger.LogDebug("Updated match {MatchId}: {HomeTeam} {HomeScore} - {AwayScore} {AwayTeam} [{Status}]",
                    match.Id, score.HomeTeam, homeScore, awayScore, score.AwayTeam, newStatus);
            }
        }

        return updatedCount;
    }

    private async Task<League> EnsureLeagueExistsAsync(string sportKey, (string SportCode, string LeagueName, string Country) info)
    {
        var league = await _context.Leagues
            .FirstOrDefaultAsync(l => l.ExternalKey == sportKey);

        if (league == null)
        {
            league = new League
            {
                Id = Guid.NewGuid(),
                SportCode = info.SportCode,
                Name = info.LeagueName,
                Country = info.Country,
                ExternalKey = sportKey,
                IsActive = true
            };
            _context.Leagues.Add(league);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created league: {LeagueName}", info.LeagueName);
        }

        return league;
    }

    private async Task<(bool created, bool updated)> ProcessMatchAsync(OddsApiEventWithOdds apiEvent, League league)
    {
        var match = await _context.Matches
            .FirstOrDefaultAsync(m => m.ExternalId == apiEvent.Id);

        var homeTeam = await EnsureTeamExistsAsync(apiEvent.HomeTeam, league.SportCode);
        var awayTeam = await EnsureTeamExistsAsync(apiEvent.AwayTeam, league.SportCode);

        if (match == null)
        {
            match = new Match
            {
                Id = Guid.NewGuid(),
                ExternalId = apiEvent.Id,
                SportCode = league.SportCode,
                LeagueId = league.Id,
                HomeTeamId = homeTeam.Id,
                AwayTeamId = awayTeam.Id,
                StartTime = apiEvent.CommenceTime,
                Status = MatchStatus.Scheduled,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Matches.Add(match);
            return (true, false);
        }
        else
        {
            // Update if needed
            if (match.StartTime != apiEvent.CommenceTime)
            {
                match.StartTime = apiEvent.CommenceTime;
                match.UpdatedAt = DateTime.UtcNow;
                return (false, true);
            }
        }

        return (false, false);
    }

    private async Task<(int marketsCreated, int marketsUpdated, int teamsCreated)> ProcessMarketsAsync(OddsApiEventWithOdds apiEvent)
    {
        int marketsCreated = 0, marketsUpdated = 0, teamsCreated = 0;

        var match = await _context.Matches
            .Include(m => m.Markets)
            .ThenInclude(mk => mk.Selections)
            .FirstOrDefaultAsync(m => m.ExternalId == apiEvent.Id);

        if (match == null) return (0, 0, 0);

        // Aggregate odds from all bookmakers (take best odds)
        var aggregatedMarkets = AggregateBookmakerOdds(apiEvent.Bookmakers);

        foreach (var (marketKey, outcomes) in aggregatedMarkets)
        {
            var marketType = MapMarketType(marketKey);
            if (marketType == null) continue;

            var existingMarket = match.Markets
                .FirstOrDefault(m => m.Type == marketType.Value && m.IsActive);

            if (existingMarket == null)
            {
                // Create new market
                var market = new Market
                {
                    Id = Guid.NewGuid(),
                    MatchId = match.Id,
                    Type = marketType.Value,
                    Label = GetMarketLabel(marketType.Value),
                    Line = outcomes.FirstOrDefault().Point,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                foreach (var outcome in outcomes)
                {
                    market.Selections.Add(new MarketSelection
                    {
                        Id = Guid.NewGuid(),
                        MarketId = market.Id,
                        Code = MapOutcomeCode(outcome.Name, marketKey),
                        Label = outcome.Name,
                        Odds = outcome.Price,
                        IsActive = true
                    });
                }

                _context.Markets.Add(market);
                marketsCreated++;
            }
            else
            {
                // Update existing market odds
                foreach (var outcome in outcomes)
                {
                    var code = MapOutcomeCode(outcome.Name, marketKey);
                    var selection = existingMarket.Selections
                        .FirstOrDefault(s => s.Code == code && s.IsActive);

                    if (selection != null && selection.Odds != outcome.Price)
                    {
                        selection.Odds = outcome.Price;
                        marketsUpdated++;
                    }
                }
            }
        }

        return (marketsCreated, marketsUpdated, teamsCreated);
    }

    private async Task<Team> EnsureTeamExistsAsync(string teamName, string sportCode)
    {
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Name == teamName && t.SportCode == sportCode);

        if (team == null)
        {
            team = new Team
            {
                Id = Guid.NewGuid(),
                SportCode = sportCode,
                Name = teamName,
                IsActive = true
            };
            _context.Teams.Add(team);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created team: {TeamName}", teamName);
        }

        return team;
    }

    private Dictionary<string, List<OddsApiOutcome>> AggregateBookmakerOdds(List<OddsApiBookmaker> bookmakers)
    {
        var result = new Dictionary<string, List<OddsApiOutcome>>();

        foreach (var bookmaker in bookmakers)
        {
            foreach (var market in bookmaker.Markets)
            {
                if (!result.ContainsKey(market.Key))
                {
                    result[market.Key] = new List<OddsApiOutcome>();
                }

                foreach (var outcome in market.Outcomes)
                {
                    var existing = result[market.Key]
                        .FirstOrDefault(o => o.Name == outcome.Name && o.Point == outcome.Point);

                    if (existing == null)
                    {
                        result[market.Key].Add(outcome);
                    }
                    else if (outcome.Price > existing.Price)
                    {
                        // Keep best odds
                        result[market.Key].Remove(existing);
                        result[market.Key].Add(outcome);
                    }
                }
            }
        }

        return result;
    }

    private MarketType? MapMarketType(string apiMarketKey)
    {
        return apiMarketKey switch
        {
            "h2h" => MarketType.MatchResult,
            "totals" => MarketType.OverUnder,
            "spreads" => MarketType.Handicap,
            "btts" => MarketType.BothTeamsScore,
            "h2h_3_way" => MarketType.MatchResult,
            "draw_no_bet" => MarketType.DrawNoBet,
            "double_chance" => MarketType.DoubleChance,
            _ => null
        };
    }

    private string GetMarketLabel(MarketType type)
    {
        return type switch
        {
            MarketType.MatchResult => "Resultat du match",
            MarketType.OverUnder => "Plus/Moins de buts",
            MarketType.BothTeamsScore => "Les deux equipes marquent",
            MarketType.Handicap => "Handicap",
            MarketType.DrawNoBet => "Gagnant sans match nul",
            MarketType.DoubleChance => "Double chance",
            _ => type.ToString()
        };
    }

    private string MapOutcomeCode(string outcomeName, string marketKey)
    {
        if (marketKey == "h2h")
        {
            // For h2h, outcome names are team names or "Draw"
            return outcomeName.ToLower() switch
            {
                "draw" => "X",
                _ => outcomeName // Use team name as code
            };
        }

        if (marketKey == "totals")
        {
            return outcomeName.ToLower() switch
            {
                "over" => "OVER",
                "under" => "UNDER",
                _ => outcomeName.ToUpper()
            };
        }

        return outcomeName.ToUpper().Replace(" ", "_");
    }
}

public class OddsSyncResult
{
    public int MatchesCreated { get; set; }
    public int MatchesUpdated { get; set; }
    public int MarketsCreated { get; set; }
    public int MarketsUpdated { get; set; }
    public int TeamsCreated { get; set; }
    public int ApiCreditsUsed { get; set; }
    public int? RemainingQuota { get; set; }
    public List<string> Errors { get; set; } = new();

    public override string ToString() =>
        $"Matches: +{MatchesCreated}/~{MatchesUpdated}, Markets: +{MarketsCreated}/~{MarketsUpdated}, " +
        $"Teams: +{TeamsCreated}, Credits used: {ApiCreditsUsed}, Remaining: {RemainingQuota}";
}

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
    Task<OddsSyncResult> SyncPlayerPropsAsync(string sportKey);
    Task<CleanupResult> CleanupInvalidMarketsAsync();
    Task<CleanupResult> RefreshAllMarketLabelsAsync();
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

        // 1. First check if there are upcoming events (FREE - no quota cost)
        var upcomingEvents = await _oddsApi.GetEventsAsync(sportKey);
        if (upcomingEvents.Count == 0)
        {
            _logger.LogInformation("No upcoming events for {SportKey}, skipping odds fetch (saved credits!)", sportKey);
            return result;
        }
        _logger.LogInformation("Found {Count} upcoming events for {SportKey}", upcomingEvents.Count, sportKey);

        // 2. Ensure league exists
        var league = await EnsureLeagueExistsAsync(sportKey, leagueInfo);

        // 3. Fetch odds from API with fallback (costs credits)
        var eventsWithOdds = await _oddsApi.GetOddsWithFallbackAsync(sportKey);
        result.ApiCreditsUsed = _config.GetMarketsForSport(sportKey).Count; // 1 credit per market

        // 4. Process each event - first create all matches
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

        // 5. Now process markets (odds) for all events
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
    /// Sync player props (goalscorers, shots, cards, etc.) for upcoming matches
    /// This is more expensive in API credits as it requires per-event calls
    /// </summary>
    public async Task<OddsSyncResult> SyncPlayerPropsAsync(string sportKey)
    {
        var result = new OddsSyncResult();

        if (!_config.SyncPlayerPropsForSport(sportKey))
        {
            _logger.LogInformation("Player props sync disabled for {SportKey} (no player props configured)", sportKey);
            return result;
        }

        if (!LeagueMapping.TryGetValue(sportKey, out var leagueInfo))
        {
            _logger.LogWarning("Unknown sport_key for player props: {SportKey}", sportKey);
            return result;
        }

        _logger.LogInformation("Syncing player props for {SportKey}...", sportKey);

        // Get upcoming events first (free call)
        var events = await _oddsApi.GetEventsAsync(sportKey);

        // Limit to next 10 events to control API costs
        var upcomingEvents = events
            .Where(e => e.CommenceTime > DateTime.UtcNow)
            .OrderBy(e => e.CommenceTime)
            .Take(10)
            .ToList();

        foreach (var apiEvent in upcomingEvents)
        {
            try
            {
                var eventOdds = await _oddsApi.GetEventOddsAsync(sportKey, apiEvent.Id);
                if (eventOdds == null) continue;

                result.ApiCreditsUsed += _config.GetPlayerPropsForSport(sportKey).Count;

                var (marketsCreated, marketsUpdated, _) = await ProcessMarketsAsync(eventOdds);
                result.MarketsCreated += marketsCreated;
                result.MarketsUpdated += marketsUpdated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing player props for event {EventId}", apiEvent.Id);
                result.Errors.Add($"Event {apiEvent.Id}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync();
        result.RemainingQuota = _oddsApi.RequestsRemaining;

        _logger.LogInformation("Player props sync complete for {SportKey}: {MarketsCreated} markets created",
            sportKey, result.MarketsCreated);

        return result;
    }

    /// <summary>
    /// Clean up invalid markets: remove football-only markets from basketball, etc.
    /// Also removes "Draw" selections from basketball matches.
    /// </summary>
    public async Task<CleanupResult> CleanupInvalidMarketsAsync()
    {
        var result = new CleanupResult();

        _logger.LogInformation("Starting cleanup of invalid markets...");

        // Football-only market types that should not be on basketball matches
        var footballOnlyTypes = new HashSet<MarketType>
        {
            MarketType.DrawNoBet,
            MarketType.DoubleChance,
            MarketType.BothTeamsScore,
            MarketType.FirstGoalscorer,
            MarketType.LastGoalscorer,
            MarketType.AnytimeGoalscorer,
            MarketType.PlayerToScore2Plus,
            MarketType.PlayerToScore3Plus,
            MarketType.TeamTotalGoals,
            MarketType.TeamToScoreFirst,
            MarketType.TeamToScoreLast,
            MarketType.TeamToScoreBothHalves,
            MarketType.HalfTimeFullTime,
            MarketType.CorrectScore,
            MarketType.PlayerShotsOnTarget,
            MarketType.PlayerTotalShots,
            MarketType.PlayerToBeBooked,
            MarketType.PlayerToBeRedCarded,
            MarketType.PlayerFoulsCommitted,
            MarketType.TotalCorners,
            MarketType.TeamCorners,
            MarketType.CornerHandicap,
            MarketType.FirstCorner,
            MarketType.TotalCards,
            MarketType.TeamCards,
            MarketType.FirstCard,
            MarketType.PlayerAssists,
            MarketType.PlayerToAssist,
        };

        // 1. Remove invalid markets from basketball matches
        var basketballMatches = await _context.Matches
            .Include(m => m.Markets)
            .ThenInclude(mk => mk.Selections)
            .Where(m => m.SportCode == "BASKETBALL")
            .ToListAsync();

        foreach (var match in basketballMatches)
        {
            var invalidMarkets = match.Markets
                .Where(m => footballOnlyTypes.Contains(m.Type))
                .ToList();

            foreach (var market in invalidMarkets)
            {
                result.Details.Add($"Removed {market.Type} from {match.Id}");
                result.SelectionsRemoved += market.Selections.Count;
                _context.MarketSelections.RemoveRange(market.Selections);
                _context.Markets.Remove(market);
                result.MarketsRemoved++;
            }

            // 2. Remove "Draw" / "X" selections from h2h/MatchResult markets (basketball has no draws)
            foreach (var market in match.Markets.Where(m => m.Type == MarketType.MatchResult))
            {
                var drawSelections = market.Selections
                    .Where(s => s.Code == "X" || s.Label.ToLower() == "draw" || s.Label.ToLower() == "match nul")
                    .ToList();

                foreach (var sel in drawSelections)
                {
                    result.Details.Add($"Removed Draw selection from match {match.Id}");
                    _context.MarketSelections.Remove(sel);
                    result.SelectionsRemoved++;
                }
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cleanup complete: {Result}", result.ToString());

        return result;
    }

    /// <summary>
    /// Refresh all market and selection labels to use correct sport-specific terminology.
    /// </summary>
    public async Task<CleanupResult> RefreshAllMarketLabelsAsync()
    {
        var result = new CleanupResult();

        _logger.LogInformation("Refreshing all market labels...");

        var matches = await _context.Matches
            .Include(m => m.Markets)
            .ThenInclude(mk => mk.Selections)
            .ToListAsync();

        foreach (var match in matches)
        {
            foreach (var market in match.Markets)
            {
                var correctLabel = GetMarketLabel(market.Type, match.SportCode);
                if (market.Label != correctLabel)
                {
                    market.Label = correctLabel;
                    result.LabelsUpdated++;
                }

                // Update selection labels as well
                foreach (var sel in market.Selections)
                {
                    // For basic Over/Under/Yes/No selections, update labels
                    var correctSelLabel = GetSelectionLabel(sel.Code, market.Type.ToString().ToLower(), match.SportCode);
                    if (sel.Label != correctSelLabel && correctSelLabel != sel.Code)
                    {
                        sel.Label = correctSelLabel;
                        result.LabelsUpdated++;
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Label refresh complete: {LabelsUpdated} labels updated", result.LabelsUpdated);

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

        var sportCode = match.SportCode;

        // Aggregate odds from all bookmakers (take best odds)
        var aggregatedMarkets = AggregateBookmakerOdds(apiEvent.Bookmakers);

        foreach (var (marketKey, outcomes) in aggregatedMarkets)
        {
            var marketType = MapMarketType(marketKey);
            if (marketType == null) continue;

            // Skip markets that don't apply to this sport
            if (!IsMarketValidForSport(marketType.Value, sportCode))
            {
                _logger.LogDebug("Skipping market {MarketType} for sport {SportCode}", marketType.Value, sportCode);
                continue;
            }

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
                    Label = GetMarketLabel(marketType.Value, sportCode),
                    Line = outcomes.FirstOrDefault()?.Point,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                foreach (var outcome in outcomes)
                {
                    // For player props, use Description as player name if available
                    var playerName = outcome.Description;
                    var selectionLabel = GetSelectionLabel(outcome.Name, marketKey, sportCode, playerName);

                    market.Selections.Add(new MarketSelection
                    {
                        Id = Guid.NewGuid(),
                        MarketId = market.Id,
                        Code = MapOutcomeCode(outcome.Name, marketKey, playerName),
                        Label = selectionLabel,
                        Odds = outcome.Price,
                        Point = outcome.Point,
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
                    var playerName = outcome.Description;
                    var code = MapOutcomeCode(outcome.Name, marketKey, playerName);
                    // Match by code AND point for spread/total markets
                    var selection = existingMarket.Selections
                        .FirstOrDefault(s => s.Code == code && s.Point == outcome.Point && s.IsActive);

                    if (selection != null)
                    {
                        if (selection.Odds != outcome.Price)
                        {
                            selection.Odds = outcome.Price;
                            marketsUpdated++;
                        }
                    }
                    else
                    {
                        // Add new selection if not found (new line available)
                        existingMarket.Selections.Add(new MarketSelection
                        {
                            Id = Guid.NewGuid(),
                            MarketId = existingMarket.Id,
                            Code = code,
                            Label = GetSelectionLabel(outcome.Name, marketKey, sportCode, playerName),
                            Odds = outcome.Price,
                            Point = outcome.Point,
                            IsActive = true
                        });
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
        // Normalize the key (lowercase, trim)
        var key = apiMarketKey?.ToLowerInvariant().Trim() ?? "";

        return key switch
        {
            // ═══════════════════════════════════════════════════════════
            // STANDARD MARKETS (Football/Soccer & General)
            // ═══════════════════════════════════════════════════════════
            "h2h" => MarketType.MatchResult,
            "h2h_3_way" => MarketType.MatchResult,
            "h2h_lay" => MarketType.MatchResultLay,
            "totals" => MarketType.OverUnder,
            "totals_alternate" => MarketType.OverUnderAlternate,
            "alternate_totals" => MarketType.OverUnderAlternate,
            "spreads" => MarketType.Handicap,
            "spreads_alternate" => MarketType.HandicapAlternate,
            "alternate_spreads" => MarketType.HandicapAlternate,
            "btts" => MarketType.BothTeamsScore,
            "draw_no_bet" => MarketType.DrawNoBet,
            "double_chance" => MarketType.DoubleChance,

            // ═══════════════════════════════════════════════════════════
            // PLAYER PROPS - GOALSCORERS (Football)
            // API keys: player_first_goal_scorer, player_last_goal_scorer, player_goal_scorer_anytime
            // ═══════════════════════════════════════════════════════════
            "player_first_goal_scorer" => MarketType.FirstGoalscorer,
            "player_last_goal_scorer" => MarketType.LastGoalscorer,
            "player_goal_scorer_anytime" => MarketType.AnytimeGoalscorer,
            // Legacy keys (keep for backward compatibility)
            "player_goal_scorer_first" => MarketType.FirstGoalscorer,
            "player_goal_scorer_last" => MarketType.LastGoalscorer,
            "player_first_goalscorer" => MarketType.FirstGoalscorer,
            "player_last_goalscorer" => MarketType.LastGoalscorer,
            "player_anytime_goalscorer" => MarketType.AnytimeGoalscorer,
            "player_to_score_2_or_more" => MarketType.PlayerToScore2Plus,
            "player_to_score_3_or_more" => MarketType.PlayerToScore3Plus,

            // ═══════════════════════════════════════════════════════════
            // PLAYER PROPS - SHOTS (Football)
            // ═══════════════════════════════════════════════════════════
            "player_shots_on_target" => MarketType.PlayerShotsOnTarget,
            "player_total_shots" => MarketType.PlayerTotalShots,
            "player_shots" => MarketType.PlayerTotalShots,

            // ═══════════════════════════════════════════════════════════
            // PLAYER PROPS - CARDS (Football)
            // API keys: player_to_receive_card, player_to_receive_red_card
            // ═══════════════════════════════════════════════════════════
            "player_to_receive_card" => MarketType.PlayerToBeBooked,
            "player_to_receive_red_card" => MarketType.PlayerToBeRedCarded,
            // Legacy keys (keep for backward compatibility)
            "player_to_be_booked" => MarketType.PlayerToBeBooked,
            "player_to_be_carded" => MarketType.PlayerToBeBooked,
            "player_to_be_red_carded" => MarketType.PlayerToBeRedCarded,
            "player_fouls" => MarketType.PlayerFoulsCommitted,
            "player_fouls_committed" => MarketType.PlayerFoulsCommitted,

            // ═══════════════════════════════════════════════════════════
            // PLAYER PROPS - ASSISTS (Football)
            // ═══════════════════════════════════════════════════════════
            "player_assists" => MarketType.PlayerAssists,
            "player_to_assist" => MarketType.PlayerToAssist,

            // ═══════════════════════════════════════════════════════════
            // TEAM PROPS (Football)
            // ═══════════════════════════════════════════════════════════
            "team_totals" => MarketType.TeamTotalGoals,
            "team_total_goals" => MarketType.TeamTotalGoals,
            "clean_sheet" => MarketType.TeamCleanSheet,
            "team_clean_sheet" => MarketType.TeamCleanSheet,
            "team_to_score_first" => MarketType.TeamToScoreFirst,
            "first_team_to_score" => MarketType.TeamToScoreFirst,
            "team_to_score_last" => MarketType.TeamToScoreLast,
            "team_to_score_both_halves" => MarketType.TeamToScoreBothHalves,

            // ═══════════════════════════════════════════════════════════
            // CORNERS (Football)
            // ═══════════════════════════════════════════════════════════
            "total_corners" => MarketType.TotalCorners,
            "corners" => MarketType.TotalCorners,
            "team_corners" => MarketType.TeamCorners,
            "corner_handicap" => MarketType.CornerHandicap,
            "corners_handicap" => MarketType.CornerHandicap,
            "first_corner" => MarketType.FirstCorner,

            // ═══════════════════════════════════════════════════════════
            // CARDS (Football)
            // ═══════════════════════════════════════════════════════════
            "total_cards" => MarketType.TotalCards,
            "cards" => MarketType.TotalCards,
            "team_cards" => MarketType.TeamCards,
            "first_card" => MarketType.FirstCard,

            // ═══════════════════════════════════════════════════════════
            // HALF-TIME MARKETS (Football)
            // ═══════════════════════════════════════════════════════════
            "h2h_h1" => MarketType.HalfTimeResult,
            "first_half_h2h" => MarketType.HalfTimeResult,
            "half_time_result" => MarketType.HalfTimeResult,
            "half_time_full_time" => MarketType.HalfTimeFullTime,

            // ═══════════════════════════════════════════════════════════
            // BASKETBALL - STANDARD
            // ═══════════════════════════════════════════════════════════
            // Note: Basketball h2h is 2-way (no draw), maps to MoneyLine
            // The mapping depends on sport context, handled separately

            // ═══════════════════════════════════════════════════════════
            // BASKETBALL - PLAYER PROPS
            // ═══════════════════════════════════════════════════════════
            "player_points" => MarketType.PlayerPoints,
            "player_points_alternate" => MarketType.PlayerPointsAlternate,
            "player_rebounds" => MarketType.PlayerRebounds,
            "player_rebounds_alternate" => MarketType.PlayerReboundsAlternate,
            "player_assists_alternate" => MarketType.PlayerAssistsAlternate,
            "player_points_rebounds_assists" => MarketType.PlayerPointsReboundsAssists,
            "player_pra" => MarketType.PlayerPointsReboundsAssists,
            "player_points_rebounds" => MarketType.PlayerPointsRebounds,
            "player_points_assists" => MarketType.PlayerPointsAssists,
            "player_rebounds_assists" => MarketType.PlayerReboundsAssists,
            "player_threes" => MarketType.PlayerThrees,
            "player_3_pointers" => MarketType.PlayerThrees,
            "player_steals" => MarketType.PlayerSteals,
            "player_blocks" => MarketType.PlayerBlocks,
            "player_turnovers" => MarketType.PlayerTurnovers,
            "player_double_double" => MarketType.PlayerDoubleDouble,
            "player_triple_double" => MarketType.PlayerTripleDouble,

            // ═══════════════════════════════════════════════════════════
            // BASKETBALL - QUARTER/HALF MARKETS
            // ═══════════════════════════════════════════════════════════
            "spreads_q1" => MarketType.FirstQuarterSpread,
            "totals_q1" => MarketType.FirstQuarterTotal,
            "spreads_h1" => MarketType.FirstHalfSpread,
            "totals_h1" => MarketType.FirstHalfTotal,
            "spreads_h2" => MarketType.SecondHalfSpread,
            "totals_h2" => MarketType.SecondHalfTotal,

            // ═══════════════════════════════════════════════════════════
            // OUTRIGHTS / FUTURES
            // ═══════════════════════════════════════════════════════════
            "outrights" => MarketType.Outright,
            "outright" => MarketType.Outright,
            "winner" => MarketType.Outright,

            // ═══════════════════════════════════════════════════════════
            // CORRECT SCORE
            // ═══════════════════════════════════════════════════════════
            "correct_score" => MarketType.CorrectScore,

            // Default: return Other for unknown markets (log it)
            _ => MapUnknownMarket(key)
        };
    }

    private MarketType? MapUnknownMarket(string key)
    {
        // Log unknown market keys for future mapping
        _logger.LogDebug("Unknown market key: {MarketKey}", key);

        // Return Other for any unrecognized market so we still save it
        return MarketType.Other;
    }

    /// <summary>
    /// Determines if a market type is valid for a given sport.
    /// Filters out football-only markets from basketball and vice versa.
    /// </summary>
    private bool IsMarketValidForSport(MarketType type, string sportCode)
    {
        var sport = sportCode?.ToUpper() ?? "";

        // Markets ONLY valid for FOOTBALL (not basketball)
        var footballOnlyMarkets = new HashSet<MarketType>
        {
            // Draw-related (basketball has no draws)
            MarketType.DrawNoBet,
            MarketType.DoubleChance,

            // Goal-specific terminology
            MarketType.BothTeamsScore,
            MarketType.FirstGoalscorer,
            MarketType.LastGoalscorer,
            MarketType.AnytimeGoalscorer,
            MarketType.PlayerToScore2Plus,
            MarketType.PlayerToScore3Plus,
            MarketType.TeamTotalGoals,
            MarketType.TeamToScoreFirst,
            MarketType.TeamToScoreLast,
            MarketType.TeamToScoreBothHalves,
            MarketType.HalfTimeFullTime,
            MarketType.CorrectScore,

            // Football-specific props
            MarketType.PlayerShotsOnTarget,
            MarketType.PlayerTotalShots,
            MarketType.PlayerToBeBooked,
            MarketType.PlayerToBeRedCarded,
            MarketType.PlayerFoulsCommitted,

            // Corners (football only)
            MarketType.TotalCorners,
            MarketType.TeamCorners,
            MarketType.CornerHandicap,
            MarketType.FirstCorner,

            // Cards (football only)
            MarketType.TotalCards,
            MarketType.TeamCards,
            MarketType.FirstCard,

            // Football assists (different from basketball assists)
            MarketType.PlayerAssists,
            MarketType.PlayerToAssist,
        };

        // Markets ONLY valid for BASKETBALL (not football)
        var basketballOnlyMarkets = new HashSet<MarketType>
        {
            MarketType.MoneyLine,
            MarketType.PointSpread,
            MarketType.TotalPoints,
            MarketType.TeamTotalPoints,
            MarketType.FirstTeamToScore,

            // Player props specific to basketball
            MarketType.PlayerPoints,
            MarketType.PlayerPointsAlternate,
            MarketType.PlayerRebounds,
            MarketType.PlayerReboundsAlternate,
            MarketType.PlayerAssistsBasketball,
            MarketType.PlayerAssistsAlternate,
            MarketType.PlayerPointsReboundsAssists,
            MarketType.PlayerPointsRebounds,
            MarketType.PlayerPointsAssists,
            MarketType.PlayerReboundsAssists,
            MarketType.PlayerThrees,
            MarketType.PlayerSteals,
            MarketType.PlayerBlocks,
            MarketType.PlayerTurnovers,
            MarketType.PlayerDoubleDouble,
            MarketType.PlayerTripleDouble,

            // Quarter/Half markets (basketball style)
            MarketType.FirstQuarterSpread,
            MarketType.FirstQuarterTotal,
            MarketType.FirstHalfSpread,
            MarketType.FirstHalfTotal,
            MarketType.SecondHalfSpread,
            MarketType.SecondHalfTotal,
        };

        // Check sport-specific restrictions
        if (sport == "BASKETBALL" && footballOnlyMarkets.Contains(type))
        {
            return false;
        }

        if (sport == "FOOTBALL" && basketballOnlyMarkets.Contains(type))
        {
            return false;
        }

        // Markets valid for both sports: MatchResult, Handicap, OverUnder, etc.
        return true;
    }

    /// <summary>
    /// Get the market label with sport-specific terminology.
    /// </summary>
    private string GetMarketLabel(MarketType type, string sportCode)
    {
        var sport = sportCode?.ToUpper() ?? "";
        var isBasketball = sport == "BASKETBALL";

        return type switch
        {
            // Standard Markets - Sport-aware labels
            MarketType.MatchResult => isBasketball ? "Vainqueur" : "Résultat du match",
            MarketType.MatchResultLay => "Résultat (Lay)",
            MarketType.OverUnder => isBasketball ? "Total points" : "Plus/Moins de buts",
            MarketType.OverUnderAlternate => isBasketball ? "Total points (Autres lignes)" : "Plus/Moins (Autres lignes)",
            MarketType.Handicap => isBasketball ? "Spread" : "Handicap",
            MarketType.HandicapAlternate => isBasketball ? "Spread (Autres lignes)" : "Handicap (Autres lignes)",

            // Football-only markets
            MarketType.BothTeamsScore => "Les deux équipes marquent",
            MarketType.DrawNoBet => "Gagnant sans match nul",
            MarketType.DoubleChance => "Double chance",
            MarketType.CorrectScore => "Score exact",
            MarketType.HalfTimeResult => "Résultat mi-temps",
            MarketType.HalfTimeFullTime => "Mi-temps / Fin de match",

            // Player Props - Goalscorers (Football)
            MarketType.FirstGoalscorer => "Premier buteur",
            MarketType.LastGoalscorer => "Dernier buteur",
            MarketType.AnytimeGoalscorer => "Buteur",
            MarketType.PlayerToScore2Plus => "Marquer 2+ buts",
            MarketType.PlayerToScore3Plus => "Hat-trick",

            // Player Props - Shots (Football)
            MarketType.PlayerShotsOnTarget => "Tirs cadrés",
            MarketType.PlayerTotalShots => "Tirs totaux",

            // Player Props - Cards (Football)
            MarketType.PlayerToBeBooked => "Recevoir un carton",
            MarketType.PlayerToBeRedCarded => "Carton rouge",
            MarketType.PlayerFoulsCommitted => "Fautes commises",

            // Player Props - Assists (Football)
            MarketType.PlayerAssists => "Passes décisives",
            MarketType.PlayerToAssist => "Faire une passe décisive",

            // Team Props (Football)
            MarketType.TeamTotalGoals => "Buts de l'équipe",
            MarketType.TeamCleanSheet => "Clean sheet",
            MarketType.TeamToScoreFirst => "Marquer en premier",
            MarketType.TeamToScoreLast => "Marquer en dernier",
            MarketType.TeamToScoreBothHalves => "Marquer dans les 2 mi-temps",

            // Corners (Football)
            MarketType.TotalCorners => "Total corners",
            MarketType.TeamCorners => "Corners équipe",
            MarketType.CornerHandicap => "Handicap corners",
            MarketType.FirstCorner => "Premier corner",

            // Cards (Football)
            MarketType.TotalCards => "Total cartons",
            MarketType.TeamCards => "Cartons équipe",
            MarketType.FirstCard => "Premier carton",

            // Basketball Standard
            MarketType.MoneyLine => "Vainqueur",
            MarketType.PointSpread => "Spread",
            MarketType.TotalPoints => "Total points",

            // Basketball Player Props
            MarketType.PlayerPoints => "Points joueur",
            MarketType.PlayerPointsAlternate => "Points joueur (Autres lignes)",
            MarketType.PlayerRebounds => "Rebonds joueur",
            MarketType.PlayerReboundsAlternate => "Rebonds joueur (Autres lignes)",
            MarketType.PlayerAssistsBasketball => "Passes joueur",
            MarketType.PlayerAssistsAlternate => "Passes joueur (Autres lignes)",
            MarketType.PlayerPointsReboundsAssists => "Points + Rebonds + Passes",
            MarketType.PlayerPointsRebounds => "Points + Rebonds",
            MarketType.PlayerPointsAssists => "Points + Passes",
            MarketType.PlayerReboundsAssists => "Rebonds + Passes",
            MarketType.PlayerThrees => "Paniers à 3 points",
            MarketType.PlayerSteals => "Interceptions",
            MarketType.PlayerBlocks => "Contres",
            MarketType.PlayerTurnovers => "Balles perdues",
            MarketType.PlayerDoubleDouble => "Double-double",
            MarketType.PlayerTripleDouble => "Triple-double",

            // Basketball Team Props
            MarketType.TeamTotalPoints => "Points équipe",
            MarketType.FirstTeamToScore => "Première équipe à marquer",

            // Basketball Quarter/Half
            MarketType.FirstQuarterSpread => "Spread 1er quart",
            MarketType.FirstQuarterTotal => "Total 1er quart",
            MarketType.FirstHalfSpread => "Spread 1ère mi-temps",
            MarketType.FirstHalfTotal => "Total 1ère mi-temps",
            MarketType.SecondHalfSpread => "Spread 2ème mi-temps",
            MarketType.SecondHalfTotal => "Total 2ème mi-temps",

            // Outrights
            MarketType.Outright => "Vainqueur (Compétition)",
            MarketType.TopScorer => isBasketball ? "Meilleur marqueur" : "Meilleur buteur",
            MarketType.Relegation => "Relégation",

            // Other
            MarketType.Other => "Autre marché",

            _ => type.ToString()
        };
    }

    /// <summary>
    /// Get selection label with sport-specific terminology.
    /// For player props, playerName comes from the API's "description" field.
    /// </summary>
    private string GetSelectionLabel(string outcomeName, string marketKey, string sportCode, string? playerName = null)
    {
        var name = outcomeName?.Trim() ?? "";
        var key = marketKey?.ToLowerInvariant() ?? "";
        var sport = sportCode?.ToUpper() ?? "";
        var isBasketball = sport == "BASKETBALL";

        // Handle "Draw" outcome - should not appear for basketball
        if (name.ToLower() == "draw")
        {
            return "Match nul";
        }

        // Over/Under outcomes for player props - include player name
        if (name.ToLower() == "over" && !string.IsNullOrEmpty(playerName))
        {
            return $"{playerName} Plus";
        }
        if (name.ToLower() == "under" && !string.IsNullOrEmpty(playerName))
        {
            return $"{playerName} Moins";
        }

        // Over/Under outcomes (standard)
        if (name.ToLower() == "over")
        {
            return "Plus";
        }
        if (name.ToLower() == "under")
        {
            return "Moins";
        }

        // Yes/No outcomes (BTTS, player props yes/no)
        if (name.ToLower() == "yes")
        {
            return !string.IsNullOrEmpty(playerName) ? playerName : "Oui";
        }
        if (name.ToLower() == "no")
        {
            return "Non";
        }

        // For team names and player names, keep as-is
        return name;
    }

    private string MapOutcomeCode(string outcomeName, string marketKey, string? playerName = null)
    {
        var name = outcomeName?.Trim() ?? "";
        var key = marketKey?.ToLowerInvariant() ?? "";

        // Match Result (1X2)
        if (key is "h2h" or "h2h_3_way" or "h2h_h1")
        {
            return name.ToLower() switch
            {
                "draw" => "X",
                _ => name // Use team name as code
            };
        }

        // Over/Under (totals)
        if (key.StartsWith("totals"))
        {
            return name.ToLower() switch
            {
                "over" => "OVER",
                "under" => "UNDER",
                _ => name.ToUpper()
            };
        }

        // Spreads/Handicap
        if (key.StartsWith("spreads"))
        {
            return name; // Team name with point value
        }

        // Both Teams to Score
        if (key == "btts")
        {
            return name.ToLower() switch
            {
                "yes" => "YES",
                "no" => "NO",
                _ => name.ToUpper()
            };
        }

        // Double Chance
        if (key == "double_chance")
        {
            return name; // "Team A or Draw", "Team A or Team B", etc.
        }

        // Draw No Bet
        if (key == "draw_no_bet")
        {
            return name; // Team name
        }

        // Player Props - Goalscorers (Yes/No style - player name in description)
        if (key.Contains("goal_scorer") || key.Contains("goalscorer"))
        {
            // For goalscorer markets, use player name from description as code
            if (!string.IsNullOrEmpty(playerName))
            {
                return playerName.ToUpper().Replace(" ", "_");
            }
            return name.ToUpper().Replace(" ", "_");
        }

        // Player Props - Over/Under stats (points, rebounds, etc.)
        if (key.StartsWith("player_"))
        {
            // For Over/Under player props, include player name in code
            if (!string.IsNullOrEmpty(playerName))
            {
                var playerCode = playerName.ToUpper().Replace(" ", "_");
                return name.ToLower() switch
                {
                    "over" => $"{playerCode}_OVER",
                    "under" => $"{playerCode}_UNDER",
                    "yes" => playerCode,
                    "no" => $"NO_{playerCode}",
                    _ => playerCode
                };
            }
            return name.ToLower() switch
            {
                "over" => "OVER",
                "under" => "UNDER",
                "yes" => "YES",
                "no" => "NO",
                _ => name.ToUpper().Replace(" ", "_")
            };
        }

        // Corners, Cards
        if (key.Contains("corner") || key.Contains("card"))
        {
            return name.ToLower() switch
            {
                "over" => "OVER",
                "under" => "UNDER",
                _ => name
            };
        }

        // Default: normalize to uppercase with underscores
        return name.ToUpper().Replace(" ", "_");
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

public class CleanupResult
{
    public int MarketsRemoved { get; set; }
    public int SelectionsRemoved { get; set; }
    public int LabelsUpdated { get; set; }
    public List<string> Details { get; set; } = new();

    public override string ToString() =>
        $"Markets removed: {MarketsRemoved}, Selections removed: {SelectionsRemoved}, Labels updated: {LabelsUpdated}";
}

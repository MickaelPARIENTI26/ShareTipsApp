using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace ShareTipsBackend.Services.ExternalApis;

public class TheOddsApiService : ISportsApiService
{
    private readonly HttpClient _httpClient;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<TheOddsApiService> _logger;

    // Track API usage from response headers
    public int? RequestsRemaining { get; private set; }
    public int? RequestsUsed { get; private set; }

    public TheOddsApiService(
        HttpClient httpClient,
        IOptions<TheOddsApiConfig> config,
        ILogger<TheOddsApiService> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _logger = logger;
        _httpClient.BaseAddress = new Uri(_config.BaseUrl);
    }

    /// <summary>
    /// Get all available sports (FREE - no quota cost)
    /// </summary>
    public async Task<List<OddsApiSport>> GetSportsAsync()
    {
        var url = $"/v4/sports/?apiKey={_config.ApiKey}";
        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        UpdateQuotaFromHeaders(response);

        var sports = await response.Content.ReadFromJsonAsync<List<OddsApiSport>>();
        return sports ?? new List<OddsApiSport>();
    }

    /// <summary>
    /// Get upcoming events for a sport (FREE - no quota cost)
    /// </summary>
    public async Task<List<OddsApiEvent>> GetEventsAsync(string sportKey)
    {
        var url = $"/v4/sports/{sportKey}/events?apiKey={_config.ApiKey}&dateFormat={_config.DateFormat}";
        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        UpdateQuotaFromHeaders(response);

        var events = await response.Content.ReadFromJsonAsync<List<OddsApiEvent>>();
        return events ?? new List<OddsApiEvent>();
    }

    /// <summary>
    /// Get odds for upcoming matches (COSTS QUOTA: markets × regions)
    /// Uses sport-specific markets: football gets btts/draw_no_bet, basketball doesn't
    /// When Bookmakers is set (e.g., "winamax_fr"), it overrides the Region parameter.
    /// </summary>
    public async Task<List<OddsApiEventWithOdds>> GetOddsAsync(string sportKey, string[]? markets = null, string? bookmakerOverride = null)
    {
        // Use sport-specific markets if not explicitly provided
        markets ??= _config.GetMarketsForSport(sportKey).ToArray();
        var marketsParam = string.Join(",", markets);

        // Determine bookmaker: override > config > region
        var bookmaker = bookmakerOverride ?? _config.Bookmakers;
        var bookmakerParam = !string.IsNullOrEmpty(bookmaker)
            ? $"&bookmakers={bookmaker}"
            : $"&regions={_config.Region}";

        var url = $"/v4/sports/{sportKey}/odds?" +
                  $"apiKey={_config.ApiKey}" +
                  bookmakerParam +
                  $"&markets={marketsParam}" +
                  $"&oddsFormat={_config.OddsFormat}" +
                  $"&dateFormat={_config.DateFormat}";

        _logger.LogInformation("Fetching odds for {SportKey} with markets [{Markets}] from {Source} - Expected cost: {Cost} credits",
            sportKey, marketsParam,
            !string.IsNullOrEmpty(bookmaker) ? bookmaker : _config.Region,
            markets.Length);

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        UpdateQuotaFromHeaders(response);

        var events = await response.Content.ReadFromJsonAsync<List<OddsApiEventWithOdds>>(new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        _logger.LogInformation("Received {Count} events. Remaining quota: {Remaining}",
            events?.Count ?? 0, RequestsRemaining);

        return events ?? new List<OddsApiEventWithOdds>();
    }

    /// <summary>
    /// Get odds with automatic fallback to secondary bookmaker if primary returns no odds.
    /// </summary>
    public async Task<List<OddsApiEventWithOdds>> GetOddsWithFallbackAsync(string sportKey, string[]? markets = null)
    {
        // First try primary bookmaker
        var events = await GetOddsAsync(sportKey, markets);

        // Check if we got odds (not just events, but events with actual bookmaker data)
        var hasOdds = events.Any(e => e.Bookmakers.Count > 0);

        // If no odds and fallback is configured, try fallback
        if (!hasOdds && !string.IsNullOrEmpty(_config.FallbackBookmaker))
        {
            _logger.LogInformation("No odds from primary bookmaker, trying fallback: {Fallback}", _config.FallbackBookmaker);
            events = await GetOddsAsync(sportKey, markets, _config.FallbackBookmaker);
        }

        return events;
    }

    /// <summary>
    /// Get player props odds for a specific event (COSTS QUOTA)
    /// Player props are fetched per event, not in bulk
    /// Uses sport-specific player props: football gets goalscorers, basketball gets points/rebounds
    /// </summary>
    public async Task<OddsApiEventWithOdds?> GetEventOddsAsync(string sportKey, string eventId, string[]? markets = null)
    {
        // Use sport-specific player props if not explicitly provided
        markets ??= _config.GetPlayerPropsForSport(sportKey).ToArray();
        if (markets.Length == 0) return null;

        var marketsParam = string.Join(",", markets);

        // Use bookmakers if specified, otherwise use region
        var bookmakerParam = !string.IsNullOrEmpty(_config.Bookmakers)
            ? $"&bookmakers={_config.Bookmakers}"
            : $"&regions={_config.Region}";

        var url = $"/v4/sports/{sportKey}/events/{eventId}/odds?" +
                  $"apiKey={_config.ApiKey}" +
                  bookmakerParam +
                  $"&markets={marketsParam}" +
                  $"&oddsFormat={_config.OddsFormat}" +
                  $"&dateFormat={_config.DateFormat}";

        _logger.LogInformation("Fetching player props for event {EventId} with markets [{Markets}]",
            eventId, marketsParam);

        try
        {
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            UpdateQuotaFromHeaders(response);

            var eventOdds = await response.Content.ReadFromJsonAsync<OddsApiEventWithOdds>(new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return eventOdds;
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogDebug("No player props available for event {EventId}", eventId);
            return null;
        }
    }

    /// <summary>
    /// Get scores for live/recent matches (COSTS QUOTA)
    /// Without daysFrom: 1 credit (live + upcoming only)
    /// With daysFrom: 2 credits (includes historical data up to 3 days)
    /// </summary>
    public async Task<List<OddsApiScore>> GetScoresAsync(string sportKey, int? daysFrom = null)
    {
        var url = $"/v4/sports/{sportKey}/scores?" +
                  $"apiKey={_config.ApiKey}" +
                  $"&dateFormat={_config.DateFormat}";

        // Only add daysFrom if specified (costs extra credit)
        if (daysFrom.HasValue)
        {
            url += $"&daysFrom={daysFrom.Value}";
        }

        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        UpdateQuotaFromHeaders(response);

        var scores = await response.Content.ReadFromJsonAsync<List<OddsApiScore>>();
        return scores ?? new List<OddsApiScore>();
    }

    private void UpdateQuotaFromHeaders(HttpResponseMessage response)
    {
        if (response.Headers.TryGetValues("x-requests-remaining", out var remaining))
            RequestsRemaining = int.TryParse(remaining.FirstOrDefault(), out var r) ? r : null;

        if (response.Headers.TryGetValues("x-requests-used", out var used))
            RequestsUsed = int.TryParse(used.FirstOrDefault(), out var u) ? u : null;
    }

    // ISportsApiService implementation (for backward compatibility)
    public async Task<IEnumerable<ExternalMatchData>> GetUpcomingMatchesAsync(string sportCode, int days = 7)
    {
        var sportKey = MapSportCodeToKey(sportCode);
        if (string.IsNullOrEmpty(sportKey)) return Enumerable.Empty<ExternalMatchData>();

        var events = await GetEventsAsync(sportKey);
        return events.Select(e => new ExternalMatchData(
            e.Id,
            sportCode,
            e.SportTitle,
            e.HomeTeam,
            e.AwayTeam,
            e.CommenceTime
        ));
    }

    public Task<IEnumerable<ExternalMarketData>> GetMatchOddsAsync(string externalMatchId)
    {
        // For single event odds, we'd need to know the sport_key
        // This is a simplified implementation
        return Task.FromResult(Enumerable.Empty<ExternalMarketData>());
    }

    public async Task<IEnumerable<ExternalScoreData>> GetLiveScoresAsync(string sportCode)
    {
        var sportKey = MapSportCodeToKey(sportCode);
        if (string.IsNullOrEmpty(sportKey)) return Enumerable.Empty<ExternalScoreData>();

        var scores = await GetScoresAsync(sportKey);
        return scores
            .Where(s => s.Scores != null)
            .Select(s => new ExternalScoreData(
                s.Id,
                s.Scores?.FirstOrDefault(sc => sc.Name == s.HomeTeam)?.Score ?? 0,
                s.Scores?.FirstOrDefault(sc => sc.Name == s.AwayTeam)?.Score ?? 0,
                s.Completed ? "FINISHED" : "LIVE"
            ));
    }

    private string? MapSportCodeToKey(string sportCode)
    {
        // Simple mapping - could be enhanced
        return sportCode.ToUpper() switch
        {
            "FOOTBALL" => "soccer_france_ligue_one", // Default to Ligue 1
            _ => null
        };
    }
}

// DTO classes for The Odds API responses
public record OddsApiSport(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("group")] string Group,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("active")] bool Active,
    [property: JsonPropertyName("has_outrights")] bool HasOutrights
);

public record OddsApiEvent(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sport_key")] string SportKey,
    [property: JsonPropertyName("sport_title")] string SportTitle,
    [property: JsonPropertyName("commence_time")] DateTime CommenceTime,
    [property: JsonPropertyName("home_team")] string HomeTeam,
    [property: JsonPropertyName("away_team")] string AwayTeam
);

public record OddsApiEventWithOdds(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sport_key")] string SportKey,
    [property: JsonPropertyName("sport_title")] string SportTitle,
    [property: JsonPropertyName("commence_time")] DateTime CommenceTime,
    [property: JsonPropertyName("home_team")] string HomeTeam,
    [property: JsonPropertyName("away_team")] string AwayTeam,
    [property: JsonPropertyName("bookmakers")] List<OddsApiBookmaker> Bookmakers
);

public record OddsApiBookmaker(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("last_update")] DateTime LastUpdate,
    [property: JsonPropertyName("markets")] List<OddsApiMarket> Markets
);

public record OddsApiMarket(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("last_update")] DateTime LastUpdate,
    [property: JsonPropertyName("outcomes")] List<OddsApiOutcome> Outcomes
);

public record OddsApiOutcome(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("price")] decimal Price,
    [property: JsonPropertyName("point")] decimal? Point, // For spreads/totals
    [property: JsonPropertyName("description")] string? Description // For player props (player name)
);

public record OddsApiScore(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sport_key")] string SportKey,
    [property: JsonPropertyName("sport_title")] string SportTitle,
    [property: JsonPropertyName("commence_time")] DateTime CommenceTime,
    [property: JsonPropertyName("home_team")] string HomeTeam,
    [property: JsonPropertyName("away_team")] string AwayTeam,
    [property: JsonPropertyName("completed")] bool Completed,
    [property: JsonPropertyName("scores")] List<OddsApiTeamScore>? Scores
);

public record OddsApiTeamScore(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("score")] int Score
);

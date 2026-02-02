using ShareTipsBackend.Domain.Entities;

namespace ShareTipsBackend.Services.ExternalApis;

/// <summary>
/// Interface for external sports data API integration
/// Implement this interface to connect to specific providers (TheOddsAPI, API-Football, etc.)
/// </summary>
public interface ISportsApiService
{
    /// <summary>
    /// Fetch upcoming matches for the next N days
    /// </summary>
    Task<IEnumerable<ExternalMatchData>> GetUpcomingMatchesAsync(string sportCode, int days = 7);

    /// <summary>
    /// Fetch odds/markets for a specific match
    /// </summary>
    Task<IEnumerable<ExternalMarketData>> GetMatchOddsAsync(string externalMatchId);

    /// <summary>
    /// Fetch live scores for in-progress matches
    /// </summary>
    Task<IEnumerable<ExternalScoreData>> GetLiveScoresAsync(string sportCode);
}

// DTOs for external API responses
public record ExternalMatchData(
    string ExternalId,
    string SportCode,
    string LeagueName,
    string HomeTeamName,
    string AwayTeamName,
    DateTime StartTime
);

public record ExternalMarketData(
    string MarketType,
    string Label,
    decimal? Line,
    IEnumerable<ExternalSelectionData> Selections
);

public record ExternalSelectionData(
    string Code,
    string Label,
    decimal Odds
);

public record ExternalScoreData(
    string ExternalMatchId,
    int HomeScore,
    int AwayScore,
    string Status
);

using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

// Match DTOs
public record MatchDto(
    Guid Id,
    string SportCode,
    string LeagueName,
    TeamInfoDto HomeTeam,
    TeamInfoDto AwayTeam,
    DateTime StartTime,
    string Status,
    int? HomeScore,
    int? AwayScore,
    List<MarketDto> Markets
);

public record MatchListDto(
    Guid Id,
    string SportCode,
    string LeagueName,
    string HomeTeamName,
    string AwayTeamName,
    DateTime StartTime,
    string Status,
    int MarketsCount
);

public record TeamInfoDto(
    Guid Id,
    string Name,
    string? ShortName,
    string? LogoUrl
);

public record CreateMatchRequest(
    [Required] string SportCode,
    [Required] Guid LeagueId,
    [Required] Guid HomeTeamId,
    [Required] Guid AwayTeamId,
    [Required] DateTime StartTime
);

public record UpdateMatchRequest(
    DateTime? StartTime,
    string? Status,
    int? HomeScore,
    int? AwayScore
);

// Market DTOs
public record MarketDto(
    Guid Id,
    string Type,
    string Label,
    decimal? Line,
    List<SelectionDto> Selections
);

public record SelectionDto(
    Guid Id,
    string Code,
    string Label,
    decimal Odds,
    decimal? Point,
    string? PlayerName
);

public record CreateMarketRequest(
    [Required] Guid MatchId,
    [Required] string Type,
    [Required] string Label,
    decimal? Line,
    [Required, MinLength(1)] List<CreateSelectionRequest> Selections
);

public record CreateSelectionRequest(
    [Required] string Code,
    [Required] string Label,
    [Required, Range(1.01, 1000.0, ErrorMessage = "Odds must be between 1.01 and 1000")] decimal Odds,
    Guid? PlayerId
);

public record UpdateOddsRequest(
    [Required] Guid SelectionId,
    [Required, Range(1.01, 1000.0, ErrorMessage = "Odds must be between 1.01 and 1000")] decimal NewOdds
);

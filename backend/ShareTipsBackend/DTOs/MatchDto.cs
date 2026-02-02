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
    string? PlayerName
);

public record CreateMarketRequest(
    [Required] Guid MatchId,
    [Required] string Type,
    [Required] string Label,
    decimal? Line,
    [Required] List<CreateSelectionRequest> Selections
);

public record CreateSelectionRequest(
    [Required] string Code,
    [Required] string Label,
    [Required] decimal Odds,
    Guid? PlayerId
);

public record UpdateOddsRequest(
    [Required] Guid SelectionId,
    [Required] decimal NewOdds
);

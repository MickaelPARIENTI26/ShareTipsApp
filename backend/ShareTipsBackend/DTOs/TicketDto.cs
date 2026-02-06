using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

public record TicketDto(
    Guid Id,
    Guid CreatorId,
    string CreatorUsername,
    string Title,
    bool IsPublic,
    decimal PriceEur,
    int ConfidenceIndex,
    decimal AvgOdds,
    string[] Sports,
    DateTime FirstMatchTime,
    DateTime LastMatchTime,
    string Status,
    string Result,
    DateTime CreatedAt,
    List<TicketSelectionDto> Selections,
    int SelectionCount,
    bool IsPurchasedByCurrentUser = false,
    bool IsSubscribedToCreator = false
);

public record TicketSelectionDto(
    Guid Id,
    Guid MatchId,
    string MarketType,
    string SelectionLabel,
    decimal Odds,
    string? PlayerName,
    string? MatchLabel,
    string? LeagueName,
    DateTime? MatchStartTime,
    string? MatchStatus = null,
    int? HomeScore = null,
    int? AwayScore = null,
    string Result = "Pending" // Pending, Win, Lose
);

public record CreateTicketDto(
    [Required, StringLength(200, MinimumLength = 3)] string Title,
    bool IsPublic,
    [Range(0, 10000)] decimal PriceEur,
    [Range(1, 10)] int ConfidenceIndex,
    [Required, MinLength(1)] List<CreateTicketSelectionDto> Selections
);

public record CreateTicketSelectionDto(
    [Required] Guid MatchId,
    [Required] string Sport,
    [Required] string MarketType,
    [Required] string SelectionCode,
    [Range(1.01, 1000.0, ErrorMessage = "Odds must be between 1.01 and 1000")] decimal Odds,
    string? MatchLabel = null,
    string? LeagueName = null
);

public record UpdateTicketDto(
    string? Title,
    bool? IsPublic,
    decimal? PriceEur,
    int? ConfidenceIndex,
    List<CreateTicketSelectionDto>? Selections
);

public record TicketFilterMetaDto(
    decimal MinOdds,
    decimal MaxOdds,
    int MinConfidence,
    int MaxConfidence,
    string[] AvailableSports,
    int MinSelections,
    int MaxSelections
);

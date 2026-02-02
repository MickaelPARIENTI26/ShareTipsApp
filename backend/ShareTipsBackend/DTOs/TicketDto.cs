namespace ShareTipsBackend.DTOs;

public record TicketDto(
    Guid Id,
    Guid CreatorId,
    string CreatorUsername,
    string Title,
    bool IsPublic,
    int PriceCredits,
    int ConfidenceIndex,
    decimal AvgOdds,
    string[] Sports,
    DateTime FirstMatchTime,
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
    string Title,
    bool IsPublic,
    int PriceCredits,
    int ConfidenceIndex,
    List<CreateTicketSelectionDto> Selections
);

public record CreateTicketSelectionDto(
    Guid MatchId,
    string Sport,
    string MarketType,
    string SelectionCode,
    decimal Odds,
    string? MatchLabel = null,
    string? LeagueName = null
);

public record UpdateTicketDto(
    string? Title,
    bool? IsPublic,
    int? PriceCredits,
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

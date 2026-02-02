namespace ShareTipsBackend.DTOs;

public record FavoriteTicketDto(
    Guid Id,
    Guid TicketId,
    string TicketTitle,
    Guid CreatorId,
    string CreatorUsername,
    bool IsPublic,
    int PriceCredits,
    int ConfidenceIndex,
    decimal AvgOdds,
    string[] Sports,
    DateTime FirstMatchTime,
    string Status,
    string Result,
    DateTime FavoritedAt
);

public record FavoriteToggleRequest(
    Guid TicketId
);

public record FavoriteResultDto(
    bool IsFavorited,
    string Message
);

namespace ShareTipsBackend.DTOs;

public record NotificationDto(
    Guid Id,
    Guid UserId,
    string Type,
    string Title,
    string Message,
    string? DataJson,
    bool IsRead,
    DateTime CreatedAt
);

public record CreateNotificationDto(
    Guid UserId,
    string Type,
    string Title,
    string Message,
    string? DataJson = null
);

public record MarkReadDto(
    Guid[] NotificationIds
);

public record UnreadCountDto(
    int Count
);

namespace ShareTipsBackend.DTOs;

public record SubscriptionPlanDto(
    Guid Id,
    Guid TipsterUserId,
    string Title,
    string? Description,
    int DurationInDays,
    decimal PriceEur,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateSubscriptionPlanRequest(
    string Title,
    string? Description,
    int DurationInDays,
    decimal PriceEur
);

public record UpdateSubscriptionPlanRequest(
    string? Title,
    string? Description,
    int? DurationInDays,
    decimal? PriceEur,
    bool? IsActive
);

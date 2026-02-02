namespace ShareTipsBackend.DTOs;

public record SubscriptionPlanDto(
    Guid Id,
    Guid TipsterUserId,
    string Title,
    string? Description,
    int DurationInDays,
    int PriceCredits,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateSubscriptionPlanRequest(
    string Title,
    string? Description,
    int DurationInDays,
    int PriceCredits
);

public record UpdateSubscriptionPlanRequest(
    string? Title,
    string? Description,
    int? DurationInDays,
    int? PriceCredits,
    bool? IsActive
);

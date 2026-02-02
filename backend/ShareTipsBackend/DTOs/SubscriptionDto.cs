namespace ShareTipsBackend.DTOs;

public record SubscriptionDto(
    Guid Id,
    Guid SubscriberId,
    string SubscriberUsername,
    Guid TipsterId,
    string TipsterUsername,
    int PriceCredits,
    int CommissionCredits,
    DateTime StartDate,
    DateTime EndDate,
    string Status,
    DateTime CreatedAt
);

public record SubscribeRequest(
    Guid TipsterId,
    int PriceCredits
);

public record SubscriptionResultDto(
    bool Success,
    string? Message,
    SubscriptionDto? Subscription,
    int NewBalance
);

public record SubscriptionStatusDto(
    bool IsSubscribed,
    DateTime? EndDate,
    int RemainingDays,
    bool WasSubscribed = false,
    DateTime? PreviousEndDate = null
);

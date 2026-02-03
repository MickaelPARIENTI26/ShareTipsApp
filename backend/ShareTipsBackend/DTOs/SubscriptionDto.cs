namespace ShareTipsBackend.DTOs;

public record SubscriptionDto(
    Guid Id,
    Guid SubscriberId,
    string SubscriberUsername,
    Guid TipsterId,
    string TipsterUsername,
    decimal PriceEur,
    decimal CommissionEur,
    DateTime StartDate,
    DateTime EndDate,
    string Status,
    DateTime CreatedAt
);

public record SubscribeRequest(
    Guid TipsterId
);

public record SubscriptionResultDto(
    bool Success,
    string? Message,
    SubscriptionDto? Subscription,
    decimal NewBalanceEur
);

public record SubscriptionStatusDto(
    bool IsSubscribed,
    DateTime? EndDate,
    int RemainingDays,
    bool WasSubscribed = false,
    DateTime? PreviousEndDate = null
);

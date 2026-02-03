namespace ShareTipsBackend.DTOs;

/// <summary>
/// Response for Stripe Connect onboarding link
/// </summary>
public record OnboardingLinkDto(
    string Url,
    DateTime ExpiresAt
);

/// <summary>
/// Status of a connected Stripe account
/// </summary>
public record ConnectedAccountStatusDto(
    string Status,
    bool ChargesEnabled,
    bool PayoutsEnabled,
    string? RequirementsMessage
);

/// <summary>
/// Result of creating a PaymentIntent
/// </summary>
public record PaymentIntentResultDto(
    bool Success,
    string? ClientSecret,
    Guid? PaymentId,
    string? Message
);

/// <summary>
/// Tipster wallet balance in EUR
/// </summary>
public record TipsterWalletDto(
    decimal AvailableBalance,
    decimal PendingPayout,
    decimal TotalEarned
);

/// <summary>
/// Result of a payout request
/// </summary>
public record PayoutResultDto(
    bool Success,
    string? Message,
    decimal? Amount,
    string? PayoutId
);

/// <summary>
/// Request to initiate a ticket purchase
/// </summary>
public record InitiatePurchaseRequest(
    Guid TicketId
);

/// <summary>
/// Request to initiate a subscription purchase
/// </summary>
public record InitiateSubscriptionRequest(
    Guid SubscriptionPlanId
);

/// <summary>
/// Request to request a payout
/// </summary>
public record PayoutRequest(
    int? AmountCents
);

namespace ShareTipsBackend.Domain.Entities;

public class Subscription
{
    public Guid Id { get; set; }
    public Guid SubscriberId { get; set; }
    public Guid TipsterId { get; set; }
    public Guid? SubscriptionPlanId { get; set; }

    // EUR cents (Stripe Connect)
    public int PriceCents { get; set; }
    public int CommissionCents { get; set; }
    public int TipsterAmountCents { get; set; }
    public Guid? StripePaymentId { get; set; }

    // Legacy credits system (kept for backward compatibility)
    public int PriceCredits { get; set; }
    public int CommissionCredits { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Notification tracking to avoid duplicates
    public bool NotifiedExpiringJ3 { get; set; }
    public bool NotifiedExpiringJ1 { get; set; }
    public bool NotifiedExpired { get; set; }

    // Navigation
    public User? Subscriber { get; set; }
    public User? Tipster { get; set; }
    public SubscriptionPlan? SubscriptionPlan { get; set; }
    public StripePayment? StripePayment { get; set; }

    /// <summary>
    /// Returns true if the subscription is currently active (status is Active and end date is in the future)
    /// </summary>
    public bool IsActive => Status == SubscriptionStatus.Active && EndDate > DateTime.UtcNow;
}

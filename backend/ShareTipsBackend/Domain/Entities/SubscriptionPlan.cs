namespace ShareTipsBackend.Domain.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; set; }
    public Guid TipsterUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationInDays { get; set; }

    // EUR cents (Stripe Connect)
    public int PriceCents { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public User? Tipster { get; set; }
}

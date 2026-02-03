using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Domain.Entities;

public class StripePayout
{
    public Guid Id { get; set; }
    public Guid TipsterId { get; set; }
    public string StripePayoutId { get; set; } = string.Empty;
    public int AmountCents { get; set; }
    public StripePayoutStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }

    // Navigation
    public User? Tipster { get; set; }
}

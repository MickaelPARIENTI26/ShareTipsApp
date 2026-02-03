using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Domain.Entities;

public class StripePayment
{
    public Guid Id { get; set; }
    public Guid BuyerId { get; set; }
    public Guid SellerId { get; set; }
    public string StripePaymentIntentId { get; set; } = string.Empty;
    public string? StripeTransferId { get; set; }
    public int AmountCents { get; set; }
    public int PlatformFeeCents { get; set; }
    public int SellerAmountCents { get; set; }
    public PaymentType Type { get; set; }
    public Guid ReferenceId { get; set; }
    public StripePaymentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }

    // Navigation
    public User? Buyer { get; set; }
    public User? Seller { get; set; }
}

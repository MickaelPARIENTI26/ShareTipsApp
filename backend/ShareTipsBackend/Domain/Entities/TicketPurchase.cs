namespace ShareTipsBackend.Domain.Entities;

public class TicketPurchase
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid BuyerId { get; set; }

    // EUR cents (Stripe Connect)
    public int PriceCents { get; set; }
    public int CommissionCents { get; set; }
    public int SellerAmountCents { get; set; }
    public Guid? StripePaymentId { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation
    public Ticket? Ticket { get; set; }
    public User? Buyer { get; set; }
    public StripePayment? StripePayment { get; set; }
}

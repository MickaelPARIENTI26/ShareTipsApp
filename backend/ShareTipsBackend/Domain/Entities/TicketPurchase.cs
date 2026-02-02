namespace ShareTipsBackend.Domain.Entities;

public class TicketPurchase
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid BuyerId { get; set; }
    public int PriceCredits { get; set; }
    public int CommissionCredits { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Ticket? Ticket { get; set; }
    public User? Buyer { get; set; }
}

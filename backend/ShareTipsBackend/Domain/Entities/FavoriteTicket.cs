namespace ShareTipsBackend.Domain.Entities;

public class FavoriteTicket
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TicketId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public Ticket? Ticket { get; set; }
}

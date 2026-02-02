namespace ShareTipsBackend.Domain.Entities;

public class Ticket
{
    public Guid Id { get; set; }
    public Guid CreatorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public int PriceCredits { get; set; }
    public int ConfidenceIndex { get; set; }
    public decimal AvgOdds { get; set; }
    public string[] Sports { get; set; } = Array.Empty<string>();
    public DateTime FirstMatchTime { get; set; }
    public TicketStatus Status { get; set; }
    public TicketResult Result { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public User? Creator { get; set; }
    public ICollection<TicketSelection> Selections { get; set; } = new List<TicketSelection>();
    public ICollection<TicketPurchase> Purchases { get; set; } = new List<TicketPurchase>();
    public ICollection<FavoriteTicket> FavoriteTickets { get; set; } = new List<FavoriteTicket>();
}

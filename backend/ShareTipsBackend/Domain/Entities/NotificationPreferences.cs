namespace ShareTipsBackend.Domain.Entities;

public class NotificationPreferences
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Notification type preferences (all default to true)
    public bool NewTicket { get; set; } = true;
    public bool MatchStart { get; set; } = true;
    public bool TicketResult { get; set; } = true;  // Covers TicketWon and TicketLost
    public bool SubscriptionExpire { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}

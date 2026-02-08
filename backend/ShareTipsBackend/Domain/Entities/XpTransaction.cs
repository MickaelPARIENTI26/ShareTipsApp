using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// XP transaction history
/// </summary>
public class XpTransaction
{
    public Guid Id { get; set; }
    public Guid UserGamificationId { get; set; }
    public XpActionType ActionType { get; set; }
    public int Amount { get; set; }
    public string? Description { get; set; }
    public Guid? ReferenceId { get; set; }  // Optional reference (e.g., TicketId, BadgeId)
    public DateTime CreatedAt { get; set; }

    // Navigation
    public UserGamification? UserGamification { get; set; }
}

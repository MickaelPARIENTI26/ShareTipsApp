namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// Tracks badges earned by users
/// </summary>
public class UserBadge
{
    public Guid Id { get; set; }
    public Guid UserGamificationId { get; set; }
    public Guid BadgeId { get; set; }
    public DateTime EarnedAt { get; set; }

    // Navigation
    public UserGamification? UserGamification { get; set; }
    public Badge? Badge { get; set; }
}

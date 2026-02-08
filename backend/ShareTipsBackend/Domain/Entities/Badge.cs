using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// Badge definition (seeded data)
/// </summary>
public class Badge
{
    public Guid Id { get; set; }
    public BadgeType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;  // Icon name (e.g., "trophy", "star", "fire")
    public string Color { get; set; } = string.Empty; // Hex color (e.g., "#FFD700")
    public int XpReward { get; set; } = 0;            // XP awarded when badge is earned
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}

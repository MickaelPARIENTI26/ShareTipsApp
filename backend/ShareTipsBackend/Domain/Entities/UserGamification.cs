namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// Stores user's gamification progress (level, XP, streaks)
/// </summary>
public class UserGamification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Level & XP
    public int Level { get; set; } = 1;
    public int CurrentXp { get; set; } = 0;
    public int TotalXpEarned { get; set; } = 0;

    // Streaks
    public int CurrentDailyStreak { get; set; } = 0;
    public int LongestDailyStreak { get; set; } = 0;
    public DateTime? LastLoginDate { get; set; }

    // Win streaks (for tipsters)
    public int CurrentWinStreak { get; set; } = 0;
    public int LongestWinStreak { get; set; } = 0;

    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
    public ICollection<XpTransaction> XpTransactions { get; set; } = new List<XpTransaction>();
}

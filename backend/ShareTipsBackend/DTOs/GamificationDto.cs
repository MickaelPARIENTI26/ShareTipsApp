namespace ShareTipsBackend.DTOs;

/// <summary>
/// User's gamification profile
/// </summary>
public record UserGamificationDto(
    int Level,
    string LevelName,
    int CurrentXp,
    int TotalXpEarned,
    int XpForNextLevel,
    int ProgressPercent,
    int CurrentDailyStreak,
    int LongestDailyStreak,
    int CurrentWinStreak,
    int LongestWinStreak,
    int BadgeCount
);

/// <summary>
/// Badge definition
/// </summary>
public record BadgeDto(
    Guid Id,
    string Type,
    string Name,
    string Description,
    string Icon,
    string Color,
    int XpReward
);

/// <summary>
/// User's earned badge with earn date
/// </summary>
public record UserBadgeDto(
    Guid Id,
    string Type,
    string Name,
    string Description,
    string Icon,
    string Color,
    DateTime EarnedAt
);

/// <summary>
/// Result of XP gain action
/// </summary>
public record XpGainResultDto(
    int XpGained,
    int TotalXp,
    int Level,
    bool LeveledUp,
    int? NewLevel,
    string? NewLevelName,
    List<BadgeDto>? NewBadges
);

/// <summary>
/// Leaderboard entry
/// </summary>
public record LeaderboardEntryDto(
    int Rank,
    Guid UserId,
    string Username,
    int Level,
    string LevelName,
    int TotalXp,
    int BadgeCount
);

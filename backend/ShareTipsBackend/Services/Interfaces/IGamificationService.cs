using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IGamificationService
{
    /// <summary>
    /// Get or create gamification profile for a user
    /// </summary>
    Task<UserGamificationDto> GetUserGamificationAsync(Guid userId);

    /// <summary>
    /// Get gamification profile for another user (public info)
    /// </summary>
    Task<UserGamificationDto?> GetPublicGamificationAsync(Guid userId);

    /// <summary>
    /// Award XP to a user for an action
    /// </summary>
    Task<XpGainResultDto> AwardXpAsync(Guid userId, XpActionType action, string? description = null, Guid? referenceId = null);

    /// <summary>
    /// Check and award badges based on user's current stats
    /// </summary>
    Task<List<BadgeDto>> CheckAndAwardBadgesAsync(Guid userId);

    /// <summary>
    /// Record daily login and update streak
    /// </summary>
    Task<XpGainResultDto> RecordDailyLoginAsync(Guid userId);

    /// <summary>
    /// Get all available badges
    /// </summary>
    Task<List<BadgeDto>> GetAllBadgesAsync();

    /// <summary>
    /// Get user's earned badges
    /// </summary>
    Task<List<UserBadgeDto>> GetUserBadgesAsync(Guid userId);

    /// <summary>
    /// Get leaderboard by level/XP
    /// </summary>
    Task<List<LeaderboardEntryDto>> GetXpLeaderboardAsync(int limit = 20);

    /// <summary>
    /// Seed gamification data for all existing users (admin only)
    /// Gives them a random level between 8-15 and some badges
    /// </summary>
    Task<int> SeedExistingUsersAsync();
}

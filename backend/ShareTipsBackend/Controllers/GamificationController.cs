using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gamification - Niveaux, XP, Badges
/// </summary>
[Route("api/[controller]")]
[Authorize]
[Tags("Gamification")]
public class GamificationController : ApiControllerBase
{
    private readonly IGamificationService _gamificationService;

    public GamificationController(IGamificationService gamificationService)
    {
        _gamificationService = gamificationService;
    }

    /// <summary>
    /// Get my gamification profile (level, XP, streaks)
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserGamificationDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyGamification()
    {
        var userId = GetUserId();
        var gamification = await _gamificationService.GetUserGamificationAsync(userId);
        return Ok(gamification);
    }

    /// <summary>
    /// Get gamification profile for a user
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserGamificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserGamification(Guid userId)
    {
        var gamification = await _gamificationService.GetPublicGamificationAsync(userId);
        if (gamification == null)
            return NotFound();

        return Ok(gamification);
    }

    /// <summary>
    /// Record daily login and get XP
    /// </summary>
    [HttpPost("daily-login")]
    [ProducesResponseType(typeof(XpGainResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordDailyLogin()
    {
        var userId = GetUserId();
        var result = await _gamificationService.RecordDailyLoginAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Get my earned badges
    /// </summary>
    [HttpGet("my-badges")]
    [ProducesResponseType(typeof(List<UserBadgeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBadges()
    {
        var userId = GetUserId();
        var badges = await _gamificationService.GetUserBadgesAsync(userId);
        return Ok(badges);
    }

    /// <summary>
    /// Get badges for a user
    /// </summary>
    [HttpGet("user/{userId:guid}/badges")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<UserBadgeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserBadges(Guid userId)
    {
        var badges = await _gamificationService.GetUserBadgesAsync(userId);
        return Ok(badges);
    }

    /// <summary>
    /// Get all available badges
    /// </summary>
    [HttpGet("badges")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BadgeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllBadges()
    {
        var badges = await _gamificationService.GetAllBadgesAsync();
        return Ok(badges);
    }

    /// <summary>
    /// Get XP leaderboard
    /// </summary>
    [HttpGet("leaderboard")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<LeaderboardEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 20)
    {
        var leaderboard = await _gamificationService.GetXpLeaderboardAsync(Math.Min(limit, 100));
        return Ok(leaderboard);
    }

    /// <summary>
    /// Check and award any pending badges
    /// </summary>
    [HttpPost("check-badges")]
    [ProducesResponseType(typeof(List<BadgeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckBadges()
    {
        var userId = GetUserId();
        var newBadges = await _gamificationService.CheckAndAwardBadgesAsync(userId);
        return Ok(newBadges);
    }

    /// <summary>
    /// [ADMIN] Seed gamification data for all existing users
    /// Gives random levels (8-18) and appropriate badges for testing
    /// </summary>
    [HttpPost("admin/seed-users")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedExistingUsers()
    {
        var count = await _gamificationService.SeedExistingUsersAsync();
        return Ok(new { message = $"Seeded gamification for {count} users", count });
    }
}

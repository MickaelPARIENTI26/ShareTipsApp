using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class FollowService : IFollowService
{
    private readonly ApplicationDbContext _context;
    private readonly IGamificationService _gamificationService;

    public FollowService(ApplicationDbContext context, IGamificationService gamificationService)
    {
        _context = context;
        _gamificationService = gamificationService;
    }

    public async Task<FollowResultDto> FollowAsync(Guid followerId, Guid followedId)
    {
        if (followerId == followedId)
            return new FollowResultDto(false, "Impossible de se suivre soi-même");

        var exists = await _context.UserFollows
            .AnyAsync(f => f.FollowerUserId == followerId && f.FollowedUserId == followedId);

        if (exists)
            return new FollowResultDto(true, "Déjà suivi");

        var follow = new UserFollow
        {
            Id = Guid.NewGuid(),
            FollowerUserId = followerId,
            FollowedUserId = followedId,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserFollows.Add(follow);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Race condition: another request already created the follow
            return new FollowResultDto(true, "Déjà suivi");
        }

        // Award XP for following a user
        await _gamificationService.AwardXpAsync(
            followerId,
            XpActionType.FollowUser,
            "Nouveau follow",
            followedId);

        return new FollowResultDto(true, "Suivi avec succès");
    }

    public async Task<FollowResultDto> UnfollowAsync(Guid followerId, Guid followedId)
    {
        var follow = await _context.UserFollows
            .FirstOrDefaultAsync(f => f.FollowerUserId == followerId && f.FollowedUserId == followedId);

        if (follow == null)
            return new FollowResultDto(false, "Vous ne suivez pas cet utilisateur");

        _context.UserFollows.Remove(follow);
        await _context.SaveChangesAsync();

        // Award negative XP for unfollowing
        await _gamificationService.AwardXpAsync(
            followerId,
            XpActionType.UnfollowUser,
            "Unfollow",
            followedId);

        return new FollowResultDto(false, "Désabonné avec succès");
    }

    public async Task<FollowInfoDto> GetFollowInfoAsync(Guid userId, Guid? currentUserId = null)
    {
        var followerCount = await _context.UserFollows
            .CountAsync(f => f.FollowedUserId == userId);

        var followingCount = await _context.UserFollows
            .CountAsync(f => f.FollowerUserId == userId);

        var isFollowing = currentUserId.HasValue &&
            await _context.UserFollows
                .AnyAsync(f => f.FollowerUserId == currentUserId.Value && f.FollowedUserId == userId);

        return new FollowInfoDto(followerCount, followingCount, isFollowing);
    }

    public async Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId)
    {
        return await _context.UserFollows
            .Where(f => f.FollowedUserId == userId)
            .Include(f => f.Follower)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FollowerDto(
                f.FollowerUserId,
                f.Follower!.Username,
                f.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<IEnumerable<FollowerDto>> GetFollowingAsync(Guid userId)
    {
        return await _context.UserFollows
            .Where(f => f.FollowerUserId == userId)
            .Include(f => f.Followed)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FollowerDto(
                f.FollowedUserId,
                f.Followed!.Username,
                f.CreatedAt
            ))
            .ToListAsync();
    }
}

using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IFollowService
{
    Task<FollowResultDto> FollowAsync(Guid followerId, Guid followedId);
    Task<FollowResultDto> UnfollowAsync(Guid followerId, Guid followedId);
    Task<FollowInfoDto> GetFollowInfoAsync(Guid userId, Guid? currentUserId = null);
    Task<IEnumerable<FollowerDto>> GetFollowersAsync(Guid userId);
    Task<IEnumerable<FollowerDto>> GetFollowingAsync(Guid userId);
}

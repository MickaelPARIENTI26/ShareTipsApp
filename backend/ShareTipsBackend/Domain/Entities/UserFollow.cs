namespace ShareTipsBackend.Domain.Entities;

public class UserFollow
{
    public Guid Id { get; set; }
    public Guid FollowerUserId { get; set; }
    public Guid FollowedUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public User? Follower { get; set; }
    public User? Followed { get; set; }
}

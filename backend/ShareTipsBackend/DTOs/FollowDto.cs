namespace ShareTipsBackend.DTOs;

public record FollowResultDto(
    bool IsFollowing,
    string Message
);

public record FollowInfoDto(
    int FollowerCount,
    int FollowingCount,
    bool IsFollowing
);

public record FollowerDto(
    Guid UserId,
    string Username,
    DateTime FollowedAt
);

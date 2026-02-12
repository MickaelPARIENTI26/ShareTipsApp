using FluentAssertions;
using Moq;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class FollowServiceTests
{
    private static Mock<IGamificationService> CreateMockGamificationService()
    {
        var mock = new Mock<IGamificationService>();
        mock.Setup(x => x.AwardXpAsync(It.IsAny<Guid>(), It.IsAny<XpActionType>(), It.IsAny<string?>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new XpGainResultDto(10, 100, 1, false, null, null, null));
        return mock;
    }

    private async Task<User> CreateUserAsync(Data.ApplicationDbContext context, string username)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{username}@example.com",
            Username = username,
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task FollowAsync_ValidFollow_ReturnsSuccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        // Act
        var result = await followService.FollowAsync(follower.Id, tipster.Id);

        // Assert
        result.IsFollowing.Should().BeTrue();
        result.Message.Should().Contain("succès");
    }

    [Fact]
    public async Task FollowAsync_AlreadyFollowing_ReturnsAlreadyFollowed()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        // Follow once
        await followService.FollowAsync(follower.Id, tipster.Id);

        // Act - try to follow again
        var result = await followService.FollowAsync(follower.Id, tipster.Id);

        // Assert
        result.IsFollowing.Should().BeTrue();
        result.Message.Should().Contain("Déjà suivi");
    }

    [Fact]
    public async Task FollowAsync_SelfFollow_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var user = await CreateUserAsync(context, "narcissist");

        // Act - try to follow yourself
        var result = await followService.FollowAsync(user.Id, user.Id);

        // Assert
        result.IsFollowing.Should().BeFalse();
        result.Message.Should().Contain("soi-même");
    }

    [Fact]
    public async Task UnfollowAsync_ExistingFollow_ReturnsSuccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        // First follow
        await followService.FollowAsync(follower.Id, tipster.Id);

        // Act
        var result = await followService.UnfollowAsync(follower.Id, tipster.Id);

        // Assert
        result.IsFollowing.Should().BeFalse(); // Success is false for unfollow (not following anymore)
        result.Message.Should().Contain("Désabonné");
    }

    [Fact]
    public async Task UnfollowAsync_NotFollowing_ReturnsNotFollowing()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        // Act - try to unfollow without following first
        var result = await followService.UnfollowAsync(follower.Id, tipster.Id);

        // Assert
        result.IsFollowing.Should().BeFalse();
        result.Message.Should().Contain("ne suivez pas");
    }

    [Fact]
    public async Task GetFollowInfoAsync_ReturnsCorrectCounts()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var tipster = await CreateUserAsync(context, "tipster");
        var follower1 = await CreateUserAsync(context, "follower1");
        var follower2 = await CreateUserAsync(context, "follower2");
        var anotherTipster = await CreateUserAsync(context, "anotherTipster");

        // Tipster has 2 followers
        await followService.FollowAsync(follower1.Id, tipster.Id);
        await followService.FollowAsync(follower2.Id, tipster.Id);

        // Tipster follows 1 person
        await followService.FollowAsync(tipster.Id, anotherTipster.Id);

        // Act
        var result = await followService.GetFollowInfoAsync(tipster.Id);

        // Assert
        result.FollowerCount.Should().Be(2);
        result.FollowingCount.Should().Be(1);
    }

    [Fact]
    public async Task GetFollowInfoAsync_WithCurrentUser_ReturnsIsFollowing()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var tipster = await CreateUserAsync(context, "tipster");
        var currentUser = await CreateUserAsync(context, "currentUser");

        // Current user follows the tipster
        await followService.FollowAsync(currentUser.Id, tipster.Id);

        // Act
        var result = await followService.GetFollowInfoAsync(tipster.Id, currentUser.Id);

        // Assert
        result.IsFollowing.Should().BeTrue();
    }

    [Fact]
    public async Task GetFollowInfoAsync_WithCurrentUserNotFollowing_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var tipster = await CreateUserAsync(context, "tipster");
        var currentUser = await CreateUserAsync(context, "currentUser");

        // Current user does NOT follow the tipster

        // Act
        var result = await followService.GetFollowInfoAsync(tipster.Id, currentUser.Id);

        // Assert
        result.IsFollowing.Should().BeFalse();
    }

    [Fact]
    public async Task GetFollowersAsync_ReturnsFollowersList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var tipster = await CreateUserAsync(context, "tipster");
        var follower1 = await CreateUserAsync(context, "follower1");
        var follower2 = await CreateUserAsync(context, "follower2");

        await followService.FollowAsync(follower1.Id, tipster.Id);
        await followService.FollowAsync(follower2.Id, tipster.Id);

        // Act
        var result = (await followService.GetFollowersAsync(tipster.Id)).ToList();

        // Assert
        result.Should().HaveCount(2);
        result.Select(f => f.UserId).Should().Contain(follower1.Id);
        result.Select(f => f.UserId).Should().Contain(follower2.Id);
    }

    [Fact]
    public async Task GetFollowersAsync_NoFollowers_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var lonelyUser = await CreateUserAsync(context, "lonely");

        // Act
        var result = await followService.GetFollowersAsync(lonelyUser.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFollowingAsync_ReturnsFollowingList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var user = await CreateUserAsync(context, "user");
        var tipster1 = await CreateUserAsync(context, "tipster1");
        var tipster2 = await CreateUserAsync(context, "tipster2");

        await followService.FollowAsync(user.Id, tipster1.Id);
        await followService.FollowAsync(user.Id, tipster2.Id);

        // Act
        var result = (await followService.GetFollowingAsync(user.Id)).ToList();

        // Assert
        result.Should().HaveCount(2);
        result.Select(f => f.UserId).Should().Contain(tipster1.Id);
        result.Select(f => f.UserId).Should().Contain(tipster2.Id);
    }

    [Fact]
    public async Task GetFollowingAsync_NotFollowingAnyone_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var user = await CreateUserAsync(context, "hermit");

        // Act
        var result = await followService.GetFollowingAsync(user.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFollowersAsync_ReturnsOrderedByMostRecent()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var tipster = await CreateUserAsync(context, "tipster");

        var followers = new List<User>();
        for (int i = 0; i < 3; i++)
        {
            var follower = await CreateUserAsync(context, $"follower{i}");
            followers.Add(follower);
            await followService.FollowAsync(follower.Id, tipster.Id);
            await Task.Delay(10); // Ensure different timestamps
        }

        // Act
        var result = (await followService.GetFollowersAsync(tipster.Id)).ToList();

        // Assert - most recent first
        result.Should().HaveCount(3);
        result[0].UserId.Should().Be(followers[2].Id);
        result[2].UserId.Should().Be(followers[0].Id);
    }

    [Fact]
    public async Task FollowAsync_CreatesFollowRecord()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        // Act
        await followService.FollowAsync(follower.Id, tipster.Id);

        // Assert - verify the record exists in DB
        var followRecord = context.UserFollows
            .FirstOrDefault(f => f.FollowerUserId == follower.Id && f.FollowedUserId == tipster.Id);
        followRecord.Should().NotBeNull();
        followRecord!.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UnfollowAsync_RemovesFollowRecord()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var gamificationMock = CreateMockGamificationService();
        var followService = new FollowService(context, gamificationMock.Object);
        var follower = await CreateUserAsync(context, "follower");
        var tipster = await CreateUserAsync(context, "tipster");

        await followService.FollowAsync(follower.Id, tipster.Id);

        // Verify record exists
        context.UserFollows.Any(f => f.FollowerUserId == follower.Id && f.FollowedUserId == tipster.Id)
            .Should().BeTrue();

        // Act
        await followService.UnfollowAsync(follower.Id, tipster.Id);

        // Assert - record should be removed
        context.UserFollows.Any(f => f.FollowerUserId == follower.Id && f.FollowedUserId == tipster.Id)
            .Should().BeFalse();
    }
}

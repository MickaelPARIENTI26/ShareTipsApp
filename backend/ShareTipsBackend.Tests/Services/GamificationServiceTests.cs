using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;

namespace ShareTipsBackend.Tests.Services;

/// <summary>
/// Unit tests for GamificationService.
/// Tests XP awarding, level progression, badge unlocking, and daily login streak tracking.
/// </summary>
public class GamificationServiceTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private async Task<User> CreateUserAsync(ApplicationDbContext context, string username = "testuser")
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

    private async Task SeedBadgesAsync(ApplicationDbContext context)
    {
        // Seed some basic badges for testing
        var badges = new List<Badge>
        {
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.FirstTicketCreated, Name = "Premier Ticket", Description = "Créez votre premier ticket", Icon = "ticket", Color = "#4CAF50", XpReward = 25, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.FirstFollow, Name = "Premier Follow", Description = "Suivez votre premier tipster", Icon = "heart", Color = "#E91E63", XpReward = 25, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.FirstFavorite, Name = "Premier Favori", Description = "Ajoutez un ticket aux favoris", Icon = "star", Color = "#FFD700", XpReward = 25, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.DailyStreak3, Name = "3 Jours", Description = "3 jours de connexion consécutifs", Icon = "fire", Color = "#FF5722", XpReward = 50, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.DailyStreak7, Name = "7 Jours", Description = "7 jours de connexion consécutifs", Icon = "fire", Color = "#FF5722", XpReward = 100, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.Level5, Name = "Niveau 5", Description = "Atteindre le niveau 5", Icon = "trending-up", Color = "#2196F3", XpReward = 100, IsActive = true },
            new Badge { Id = Guid.NewGuid(), Type = BadgeType.Xp1000, Name = "1000 XP", Description = "Accumulez 1000 XP", Icon = "zap", Color = "#9C27B0", XpReward = 50, IsActive = true },
        };
        context.Badges.AddRange(badges);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetUserGamificationAsync_NewUser_CreatesProfile()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Act
        var result = await service.GetUserGamificationAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Level.Should().Be(1);
        result.CurrentXp.Should().Be(0);
        result.TotalXpEarned.Should().Be(0);
        result.CurrentDailyStreak.Should().Be(0);
    }

    [Fact]
    public async Task AwardXpAsync_AddsXpToUser()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Act
        var result = await service.AwardXpAsync(user.Id, XpActionType.CreateTicket, "Test ticket creation");

        // Assert
        result.XpGained.Should().BeGreaterThan(0);
        result.TotalXp.Should().Be(result.XpGained);

        // Verify in database
        var gamification = await context.UserGamifications.FirstOrDefaultAsync(g => g.UserId == user.Id);
        gamification.Should().NotBeNull();
        gamification!.TotalXpEarned.Should().Be(result.XpGained);
    }

    [Fact]
    public async Task AwardXpAsync_MultipleActions_AccumulatesXp()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Act - Award XP for multiple actions
        var result1 = await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);
        var result2 = await service.AwardXpAsync(user.Id, XpActionType.FollowUser);
        var result3 = await service.AwardXpAsync(user.Id, XpActionType.FavoriteTicket);

        // Assert
        result3.TotalXp.Should().Be(result1.XpGained + result2.XpGained + result3.XpGained);
    }

    [Fact]
    public async Task AwardXpAsync_NegativeXpAction_DeductsXp()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // First add some XP
        await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);
        await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);

        var beforeUnfollow = await service.GetUserGamificationAsync(user.Id);

        // Act - Award negative XP for unfollowing
        var result = await service.AwardXpAsync(user.Id, XpActionType.UnfollowUser);

        // Assert
        result.XpGained.Should().BeLessThan(0);
    }

    [Fact]
    public async Task RecordDailyLoginAsync_FirstLogin_AwardsXpAndStartsStreak()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Act
        var result = await service.RecordDailyLoginAsync(user.Id);

        // Assert
        result.XpGained.Should().BeGreaterThan(0);

        var gamification = await context.UserGamifications.FirstAsync(g => g.UserId == user.Id);
        gamification.CurrentDailyStreak.Should().Be(1);
        gamification.LongestDailyStreak.Should().Be(1);
        gamification.LastLoginDate.Should().NotBeNull();
    }

    [Fact]
    public async Task RecordDailyLoginAsync_SameDayLogin_NoExtraXp()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // First login
        var firstResult = await service.RecordDailyLoginAsync(user.Id);

        // Act - Login again same day
        var secondResult = await service.RecordDailyLoginAsync(user.Id);

        // Assert
        secondResult.XpGained.Should().Be(0);
        secondResult.TotalXp.Should().Be(firstResult.TotalXp);
    }

    [Fact]
    public async Task CheckAndAwardBadgesAsync_WithEligibleBadges_AwardsBadges()
    {
        // Arrange
        using var context = CreateContext();
        await SeedBadgesAsync(context);
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Create a ticket to be eligible for FirstTicketCreated badge
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = user.Id,
            Title = "Test Ticket",
            IsPublic = true,
            PriceCents = 0,
            ConfidenceIndex = 5,
            AvgOdds = 2.0m,
            Sports = new[] { "soccer" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Reload user with tickets
        await context.Entry(user).Collection(u => u.CreatedTickets).LoadAsync();

        // Act
        var badges = await service.CheckAndAwardBadgesAsync(user.Id);

        // Assert
        badges.Should().Contain(b => b.Type == BadgeType.FirstTicketCreated.ToString());
    }

    [Fact]
    public async Task GetUserBadgesAsync_WithBadges_ReturnsBadgeList()
    {
        // Arrange
        using var context = CreateContext();
        await SeedBadgesAsync(context);
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Award some XP to trigger badge check
        await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);

        // Create a ticket for badge eligibility
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = user.Id,
            Title = "Test Ticket",
            IsPublic = true,
            PriceCents = 0,
            ConfidenceIndex = 5,
            AvgOdds = 2.0m,
            Sports = new[] { "soccer" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Check and award badges
        await service.CheckAndAwardBadgesAsync(user.Id);

        // Act
        var userBadges = await service.GetUserBadgesAsync(user.Id);

        // Assert
        userBadges.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetAllBadgesAsync_ReturnsAllActiveBadges()
    {
        // Arrange
        using var context = CreateContext();
        await SeedBadgesAsync(context);
        var service = new GamificationService(context);

        // Act
        var badges = await service.GetAllBadgesAsync();

        // Assert
        badges.Should().NotBeEmpty();
        badges.Should().HaveCountGreaterThanOrEqualTo(7); // We seeded 7 badges
    }

    [Fact]
    public async Task GetXpLeaderboardAsync_ReturnsOrderedByXp()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);

        // Create multiple users with different XP
        var user1 = await CreateUserAsync(context, "lowxp");
        var user2 = await CreateUserAsync(context, "midxp");
        var user3 = await CreateUserAsync(context, "highxp");

        // Award different XP amounts
        await service.AwardXpAsync(user1.Id, XpActionType.DailyLogin);
        await service.AwardXpAsync(user2.Id, XpActionType.CreateTicket);
        await service.AwardXpAsync(user2.Id, XpActionType.CreateTicket);
        await service.AwardXpAsync(user3.Id, XpActionType.CreateTicket);
        await service.AwardXpAsync(user3.Id, XpActionType.CreateTicket);
        await service.AwardXpAsync(user3.Id, XpActionType.CreateTicket);

        // Act
        var leaderboard = await service.GetXpLeaderboardAsync(10);

        // Assert
        leaderboard.Should().NotBeEmpty();
        leaderboard.First().Username.Should().Be("highxp");
        leaderboard.Last().Username.Should().Be("lowxp");
    }

    [Fact]
    public async Task GetPublicGamificationAsync_ExistingUser_ReturnsProfile()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Create gamification profile
        await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);

        // Act
        var result = await service.GetPublicGamificationAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Level.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task GetPublicGamificationAsync_NonExistingUser_ReturnsNull()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);

        // Act
        var result = await service.GetPublicGamificationAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task AwardXpAsync_CreatesXpTransaction()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);
        var referenceId = Guid.NewGuid();

        // Act
        await service.AwardXpAsync(user.Id, XpActionType.PurchaseTicket, "Test purchase", referenceId);

        // Assert
        var transaction = await context.XpTransactions.FirstOrDefaultAsync(t => t.ReferenceId == referenceId);
        transaction.Should().NotBeNull();
        transaction!.ActionType.Should().Be(XpActionType.PurchaseTicket);
        transaction.Description.Should().Contain("Test purchase");
    }

    [Fact]
    public async Task AwardXpAsync_LevelUp_TriggersLevelUpBonus()
    {
        // Arrange
        using var context = CreateContext();
        var service = new GamificationService(context);
        var user = await CreateUserAsync(context);

        // Award enough XP to level up (Level 2 requires ~100 XP)
        // Keep awarding XP until level up
        bool leveledUp = false;
        for (int i = 0; i < 20 && !leveledUp; i++)
        {
            var result = await service.AwardXpAsync(user.Id, XpActionType.CreateTicket);
            leveledUp = result.LeveledUp;
        }

        // Assert
        leveledUp.Should().BeTrue();
    }

    [Fact]
    public void XpConfig_ReturnsCorrectXpForActions()
    {
        // Assert XP values are configured correctly
        GamificationConfig.GetXpForAction(XpActionType.DailyLogin).Should().BeGreaterThan(0);
        GamificationConfig.GetXpForAction(XpActionType.CreateTicket).Should().BeGreaterThan(0);
        GamificationConfig.GetXpForAction(XpActionType.PurchaseTicket).Should().BeGreaterThan(0);
        GamificationConfig.GetXpForAction(XpActionType.FollowUser).Should().BeGreaterThan(0);
        GamificationConfig.GetXpForAction(XpActionType.TicketWin).Should().BeGreaterThan(0);

        // Negative XP actions
        GamificationConfig.GetXpForAction(XpActionType.TicketLose).Should().BeLessThan(0);
        GamificationConfig.GetXpForAction(XpActionType.UnfollowUser).Should().BeLessThan(0);
    }

    [Fact]
    public void LevelConfig_ReturnsCorrectLevelNames()
    {
        // Assert level names are configured
        GamificationConfig.GetLevelName(1).Should().NotBeNullOrEmpty();
        GamificationConfig.GetLevelName(10).Should().NotBeNullOrEmpty();
        GamificationConfig.GetLevelName(50).Should().NotBeNullOrEmpty();
    }
}

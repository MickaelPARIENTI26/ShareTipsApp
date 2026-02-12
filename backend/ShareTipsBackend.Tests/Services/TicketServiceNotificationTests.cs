using Microsoft.EntityFrameworkCore;
using Moq;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using Xunit;

namespace ShareTipsBackend.Tests.Services;

public class TicketServiceNotificationTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static TicketService CreateTicketService(ApplicationDbContext context, INotificationService notificationService)
    {
        var cacheService = new Mock<ICacheService>();
        var gamificationService = new Mock<IGamificationService>();
        gamificationService.Setup(x => x.AwardXpAsync(It.IsAny<Guid>(), It.IsAny<XpActionType>(), It.IsAny<string?>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new XpGainResultDto(15, 100, 1, false, null, null, null));
        return new TicketService(context, notificationService, cacheService.Object, gamificationService.Object);
    }

    private async Task<User> CreateUserAsync(ApplicationDbContext context, string username)
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

    private async Task<Domain.Entities.Match> CreateMatchAsync(ApplicationDbContext context)
    {
        var league = new League
        {
            Id = Guid.NewGuid(),
            ExternalKey = "ligue1",
            Name = "Ligue 1",
            SportCode = "soccer",
            Country = "France"
        };
        context.Leagues.Add(league);

        var homeTeam = new Team
        {
            Id = Guid.NewGuid(),
            Name = "PSG",
            SportCode = "soccer"
        };
        var awayTeam = new Team
        {
            Id = Guid.NewGuid(),
            Name = "OM",
            SportCode = "soccer"
        };
        context.Teams.AddRange(homeTeam, awayTeam);

        var match = new Domain.Entities.Match
        {
            Id = Guid.NewGuid(),
            ExternalId = Guid.NewGuid().ToString(),
            SportCode = "soccer",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Matches.Add(match);
        await context.SaveChangesAsync();
        return match;
    }

    [Fact]
    public async Task CreateAsync_ShouldNotifyAllFollowers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();
        var ticketService = CreateTicketService(context, mockNotificationService.Object);

        var tipster = await CreateUserAsync(context, "tipster1");
        var follower1 = await CreateUserAsync(context, "follower1");
        var follower2 = await CreateUserAsync(context, "follower2");
        var match = await CreateMatchAsync(context);

        // Create follows
        context.UserFollows.AddRange(
            new UserFollow { Id = Guid.NewGuid(), FollowerUserId = follower1.Id, FollowedUserId = tipster.Id, CreatedAt = DateTime.UtcNow },
            new UserFollow { Id = Guid.NewGuid(), FollowerUserId = follower2.Id, FollowedUserId = tipster.Id, CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        await ticketService.CreateAsync(tipster.Id, dto);

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Count() == 2 && ids.Contains(follower1.Id) && ids.Contains(follower2.Id)),
                NotificationType.NewTicket,
                "Nouveau ticket publié",
                It.Is<string>(msg => msg.Contains("tipster1")),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldNotifyActiveSubscribers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();
        var ticketService = CreateTicketService(context, mockNotificationService.Object);

        var tipster = await CreateUserAsync(context, "tipster2");
        var subscriber1 = await CreateUserAsync(context, "subscriber1");
        var subscriber2 = await CreateUserAsync(context, "subscriber2");
        var match = await CreateMatchAsync(context);

        // Create active subscriptions
        context.Subscriptions.AddRange(
            new Subscription
            {
                Id = Guid.NewGuid(),
                SubscriberId = subscriber1.Id,
                TipsterId = tipster.Id,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            },
            new Subscription
            {
                Id = Guid.NewGuid(),
                SubscriberId = subscriber2.Id,
                TipsterId = tipster.Id,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            }
        );
        await context.SaveChangesAsync();

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        await ticketService.CreateAsync(tipster.Id, dto);

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Count() == 2 && ids.Contains(subscriber1.Id) && ids.Contains(subscriber2.Id)),
                NotificationType.NewTicket,
                "Nouveau ticket publié",
                It.Is<string>(msg => msg.Contains("tipster2")),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldNotNotifyExpiredSubscribers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();
        var ticketService = CreateTicketService(context, mockNotificationService.Object);

        var tipster = await CreateUserAsync(context, "tipster3");
        var activeSubscriber = await CreateUserAsync(context, "activeSubscriber");
        var expiredSubscriber = await CreateUserAsync(context, "expiredSubscriber");
        var match = await CreateMatchAsync(context);

        // Create subscriptions - one active, one expired
        context.Subscriptions.AddRange(
            new Subscription
            {
                Id = Guid.NewGuid(),
                SubscriberId = activeSubscriber.Id,
                TipsterId = tipster.Id,
                Status = SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(30),
                CreatedAt = DateTime.UtcNow
            },
            new Subscription
            {
                Id = Guid.NewGuid(),
                SubscriberId = expiredSubscriber.Id,
                TipsterId = tipster.Id,
                Status = SubscriptionStatus.Expired,
                StartDate = DateTime.UtcNow.AddDays(-60),
                EndDate = DateTime.UtcNow.AddDays(-30),
                CreatedAt = DateTime.UtcNow
            }
        );
        await context.SaveChangesAsync();

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        await ticketService.CreateAsync(tipster.Id, dto);

        // Assert - only active subscriber should be notified
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Count() == 1 && ids.Contains(activeSubscriber.Id) && !ids.Contains(expiredSubscriber.Id)),
                NotificationType.NewTicket,
                "Nouveau ticket publié",
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldNotDuplicateNotifications_WhenUserIsFollowerAndSubscriber()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();
        var ticketService = CreateTicketService(context, mockNotificationService.Object);

        var tipster = await CreateUserAsync(context, "tipster4");
        var bothFollowerAndSubscriber = await CreateUserAsync(context, "bothUser");
        var onlyFollower = await CreateUserAsync(context, "onlyFollower");
        var match = await CreateMatchAsync(context);

        // User is both follower and subscriber
        context.UserFollows.Add(new UserFollow
        {
            Id = Guid.NewGuid(),
            FollowerUserId = bothFollowerAndSubscriber.Id,
            FollowedUserId = tipster.Id,
            CreatedAt = DateTime.UtcNow
        });
        context.UserFollows.Add(new UserFollow
        {
            Id = Guid.NewGuid(),
            FollowerUserId = onlyFollower.Id,
            FollowedUserId = tipster.Id,
            CreatedAt = DateTime.UtcNow
        });
        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = bothFollowerAndSubscriber.Id,
            TipsterId = tipster.Id,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        await ticketService.CreateAsync(tipster.Id, dto);

        // Assert - should have exactly 2 users (no duplicates)
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids =>
                    ids.Count() == 2 &&
                    ids.Contains(bothFollowerAndSubscriber.Id) &&
                    ids.Contains(onlyFollower.Id)),
                NotificationType.NewTicket,
                "Nouveau ticket publié",
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_ShouldNotNotify_WhenNoFollowersOrSubscribers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();
        var ticketService = CreateTicketService(context, mockNotificationService.Object);

        var tipster = await CreateUserAsync(context, "lonelyTipster");
        var match = await CreateMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        await ticketService.CreateAsync(tipster.Id, dto);

        // Assert - NotifyManyAsync should not be called
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ShouldIncludeCorrectDataInNotification()
    {
        // Arrange
        using var context = CreateContext();
        object? capturedData = null;
        var mockNotificationService = new Mock<INotificationService>();
        mockNotificationService
            .Setup(s => s.NotifyManyAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()))
            .Callback<IEnumerable<Guid>, NotificationType, string, string, object?>(
                (_, _, _, _, data) => capturedData = data);

        var ticketService = CreateTicketService(context, mockNotificationService.Object);
        var tipster = await CreateUserAsync(context, "tipster5");
        var follower = await CreateUserAsync(context, "follower");
        var match = await CreateMatchAsync(context);

        context.UserFollows.Add(new UserFollow
        {
            Id = Guid.NewGuid(),
            FollowerUserId = follower.Id,
            FollowedUserId = tipster.Id,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var dto = new CreateTicketDto(
            Title: "Test Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        var result = await ticketService.CreateAsync(tipster.Id, dto);

        // Assert
        Assert.NotNull(capturedData);
        var dataType = capturedData.GetType();
        var ticketIdProp = dataType.GetProperty("ticketId");
        var tipsterIdProp = dataType.GetProperty("tipsterId");

        Assert.NotNull(ticketIdProp);
        Assert.NotNull(tipsterIdProp);
        Assert.Equal(result.Id, ticketIdProp.GetValue(capturedData));
        Assert.Equal(tipster.Id, tipsterIdProp.GetValue(capturedData));
    }
}

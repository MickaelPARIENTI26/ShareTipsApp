using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using Xunit;

namespace ShareTipsBackend.Tests.Services;

public class NotificationServiceOptimizationTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private NotificationService CreateService(ApplicationDbContext context)
    {
        var preferencesService = new NotificationPreferencesService(context);
        var pushService = new Mock<IPushNotificationService>().Object;
        var logger = NullLogger<NotificationService>.Instance;
        return new NotificationService(context, preferencesService, pushService, logger);
    }

    // --- Anti-duplicate tests ---

    [Fact]
    public async Task NotifyUserAsync_ShouldPreventDuplicate_WithinTimeWindow()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var ticketId = Guid.NewGuid();

        // Act - send the same notification twice
        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un nouveau ticket disponible",
            new { ticketId }
        );

        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un nouveau ticket disponible",
            new { ticketId }
        );

        // Assert - only 1 notification created
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Single(notifications);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldAllowDifferentData_SameType()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        // Act - send notifications with different data
        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket 1",
            "Message",
            new { ticketId = Guid.NewGuid() }
        );

        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket 2",
            "Message",
            new { ticketId = Guid.NewGuid() }
        );

        // Assert - both notifications created (different data)
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Equal(2, notifications.Count);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldAllowSameData_DifferentTypes()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var ticketId = Guid.NewGuid();

        // Act - send different notification types with same data
        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message",
            new { ticketId }
        );

        await service.NotifyUserAsync(
            userId,
            NotificationType.TicketWon,
            "Ticket gagné",
            "Message",
            new { ticketId }
        );

        // Assert - both notifications created (different types)
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Equal(2, notifications.Count);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldPreventDuplicates_ForAllUsers()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        var ticketId = Guid.NewGuid();

        // Act - send the same notification twice
        await service.NotifyManyAsync(
            new[] { user1, user2 },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message",
            new { ticketId }
        );

        await service.NotifyManyAsync(
            new[] { user1, user2 },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message",
            new { ticketId }
        );

        // Assert - only 2 notifications created (one per user)
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(2, notifications.Count);
        Assert.Contains(notifications, n => n.UserId == user1);
        Assert.Contains(notifications, n => n.UserId == user2);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldOnlyCreateForNewUsers_WhenPartialDuplicate()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var existingUser = Guid.NewGuid();
        var newUser = Guid.NewGuid();
        var ticketId = Guid.NewGuid();

        // First notification to existingUser only
        await service.NotifyManyAsync(
            new[] { existingUser },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message",
            new { ticketId }
        );

        // Act - send to both users
        await service.NotifyManyAsync(
            new[] { existingUser, newUser },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message",
            new { ticketId }
        );

        // Assert - 2 total notifications (1 for existing, 1 for new)
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(2, notifications.Count);
        Assert.Single(notifications.Where(n => n.UserId == existingUser));
        Assert.Single(notifications.Where(n => n.UserId == newUser));
    }

    // --- High load / batch tests ---

    [Fact]
    public async Task NotifyManyAsync_ShouldHandleLargeUserCount()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Create 250 users (more than batch size of 100)
        var userIds = Enumerable.Range(0, 250).Select(_ => Guid.NewGuid()).ToList();

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Message test pour charge élevée"
        );

        // Assert - all 250 notifications created
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(250, notifications.Count);
        Assert.Equal(userIds.OrderBy(x => x), notifications.Select(n => n.UserId).OrderBy(x => x));
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldHandleVeryLargeUserCount()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Create 500 users (5 batches)
        var userIds = Enumerable.Range(0, 500).Select(_ => Guid.NewGuid()).ToList();

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.MatchStart,
            "Match commence",
            "Test haute charge"
        );

        // Assert - all 500 notifications created
        var count = await context.Notifications.CountAsync();
        Assert.Equal(500, count);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldHandleLargeUserCount_WithSomeDisabledPreferences()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Create 200 users, disable notifications for 50 of them
        var allUserIds = Enumerable.Range(0, 200).Select(_ => Guid.NewGuid()).ToList();
        var disabledUserIds = allUserIds.Take(50).ToList();

        foreach (var userId in disabledUserIds)
        {
            context.NotificationPreferences.Add(new NotificationPreferences
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                NewTicket = false,
                MatchStart = true,
                TicketResult = true,
                SubscriptionExpire = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // Act
        await service.NotifyManyAsync(
            allUserIds,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Test avec préférences désactivées"
        );

        // Assert - only 150 notifications created (200 - 50 disabled)
        var count = await context.Notifications.CountAsync();
        Assert.Equal(150, count);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldCreateNoDuplicates_EvenWithConcurrentCalls()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userIds = Enumerable.Range(0, 50).Select(_ => Guid.NewGuid()).ToList();
        var ticketId = Guid.NewGuid();

        // Act - simulate multiple calls (not truly concurrent due to InMemory DB, but tests the logic)
        await service.NotifyManyAsync(
            userIds,
            NotificationType.NewTicket,
            "Test",
            "Message",
            new { ticketId }
        );

        await service.NotifyManyAsync(
            userIds,
            NotificationType.NewTicket,
            "Test",
            "Message",
            new { ticketId }
        );

        await service.NotifyManyAsync(
            userIds,
            NotificationType.NewTicket,
            "Test",
            "Message",
            new { ticketId }
        );

        // Assert - exactly 50 notifications (no duplicates from any call)
        var count = await context.Notifications.CountAsync();
        Assert.Equal(50, count);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldHandleEmptyUserList_Gracefully()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Act
        await service.NotifyManyAsync(
            Array.Empty<Guid>(),
            NotificationType.NewTicket,
            "Test",
            "Message"
        );

        // Assert - no notifications, no errors
        var count = await context.Notifications.CountAsync();
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldHandleSingleUser_AsSpecialCase()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        // Act
        await service.NotifyManyAsync(
            new[] { userId },
            NotificationType.NewTicket,
            "Test single",
            "Message"
        );

        // Assert
        var notifications = await context.Notifications.ToListAsync();
        Assert.Single(notifications);
        Assert.Equal(userId, notifications[0].UserId);
    }
}

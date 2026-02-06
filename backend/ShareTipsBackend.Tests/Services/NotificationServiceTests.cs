using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using Xunit;

namespace ShareTipsBackend.Tests.Services;

public class NotificationServiceTests
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
        var serviceProvider = new Mock<IServiceProvider>().Object;
        var logger = NullLogger<NotificationService>.Instance;
        return new NotificationService(context, preferencesService, serviceProvider, logger);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userId = Guid.NewGuid();

        var notifications = new[]
        {
            new Notification { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.NewTicket, Title = "N1", Message = "M1", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.NewTicket, Title = "N2", Message = "M2", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.NewTicket, Title = "N3", Message = "M3", IsRead = true, CreatedAt = DateTime.UtcNow },
        };
        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();

        // Act
        var count = await service.GetUnreadCountAsync(userId);

        // Assert
        Assert.Equal(2, count);
    }

    [Fact(Skip = "ExecuteUpdate not supported by InMemory provider - requires PostgreSQL")]
    public async Task MarkAsReadAsync_ShouldMarkSpecificNotifications()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userId = Guid.NewGuid();
        var notificationId1 = Guid.NewGuid();
        var notificationId2 = Guid.NewGuid();
        var notificationId3 = Guid.NewGuid();

        var notifications = new[]
        {
            new Notification { Id = notificationId1, UserId = userId, Type = NotificationType.NewTicket, Title = "N1", Message = "M1", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = notificationId2, UserId = userId, Type = NotificationType.NewTicket, Title = "N2", Message = "M2", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = notificationId3, UserId = userId, Type = NotificationType.NewTicket, Title = "N3", Message = "M3", IsRead = false, CreatedAt = DateTime.UtcNow },
        };
        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();

        // Act
        await service.MarkAsReadAsync(userId, new[] { notificationId1, notificationId2 });

        // Assert - need to reload from DB
        context.ChangeTracker.Clear();
        var n1 = await context.Notifications.FindAsync(notificationId1);
        var n2 = await context.Notifications.FindAsync(notificationId2);
        var n3 = await context.Notifications.FindAsync(notificationId3);

        Assert.True(n1!.IsRead);
        Assert.True(n2!.IsRead);
        Assert.False(n3!.IsRead);
    }

    [Fact(Skip = "ExecuteUpdate not supported by InMemory provider - requires PostgreSQL")]
    public async Task MarkAllAsReadAsync_ShouldMarkAllUserNotifications()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        var notifications = new[]
        {
            new Notification { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.NewTicket, Title = "N1", Message = "M1", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.NewTicket, Title = "N2", Message = "M2", IsRead = false, CreatedAt = DateTime.UtcNow },
            new Notification { Id = Guid.NewGuid(), UserId = otherUserId, Type = NotificationType.NewTicket, Title = "N3", Message = "M3", IsRead = false, CreatedAt = DateTime.UtcNow },
        };
        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();

        // Act
        await service.MarkAllAsReadAsync(userId);

        // Assert
        context.ChangeTracker.Clear();
        var userNotifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        var otherNotifications = await context.Notifications.Where(n => n.UserId == otherUserId).ToListAsync();

        Assert.All(userNotifications, n => Assert.True(n.IsRead));
        Assert.All(otherNotifications, n => Assert.False(n.IsRead));
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteNotification()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "To delete",
            Message = "This will be deleted",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAsync(notificationId, userId);

        // Assert
        Assert.True(result);
        var deleted = await context.Notifications.FindAsync(notificationId);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotificationNotFound()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenDifferentUser()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "N1",
            Message = "M1",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        // Act - try to delete with different user
        var result = await service.DeleteAsync(notificationId, otherUserId);

        // Assert
        Assert.False(result);
        var stillExists = await context.Notifications.FindAsync(notificationId);
        Assert.NotNull(stillExists);
    }

    // --- Tests for NotifyUserAsync (simple notification) ---

    [Fact]
    public async Task NotifyUserAsync_ShouldCreateNotification()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        // Act
        await service.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster que vous suivez a publié un nouveau ticket"
        );

        // Assert
        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == userId);
        Assert.NotNull(notification);
        Assert.Equal(userId, notification.UserId);
        Assert.Equal(NotificationType.NewTicket, notification.Type);
        Assert.Equal("Nouveau ticket", notification.Title);
        Assert.Equal("Un tipster que vous suivez a publié un nouveau ticket", notification.Message);
        Assert.Null(notification.DataJson);
        Assert.False(notification.IsRead);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldSerializeDataToJson()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var ticketId = Guid.NewGuid();

        // Act
        await service.NotifyUserAsync(
            userId,
            NotificationType.TicketWon,
            "Ticket gagné",
            "Votre ticket a gagné!",
            new { ticketId = ticketId, winAmount = 150 }
        );

        // Assert
        var notification = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == userId);
        Assert.NotNull(notification);
        Assert.NotNull(notification.DataJson);
        Assert.Contains(ticketId.ToString(), notification.DataJson);
        Assert.Contains("150", notification.DataJson);
    }

    // --- Tests for NotifyManyAsync (multiple notifications) ---

    [Fact]
    public async Task NotifyManyAsync_ShouldCreateNotificationsForAllUsers()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userIds = new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.MatchStart,
            "Match commencé",
            "Le match PSG vs OM a commencé"
        );

        // Assert
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(3, notifications.Count);
        Assert.All(notifications, n =>
        {
            Assert.Equal(NotificationType.MatchStart, n.Type);
            Assert.Equal("Match commencé", n.Title);
            Assert.Equal("Le match PSG vs OM a commencé", n.Message);
            Assert.False(n.IsRead);
        });
        Assert.Equal(userIds.OrderBy(x => x), notifications.Select(n => n.UserId).OrderBy(x => x));
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldShareSameDataJsonForAllUsers()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userIds = new[] { Guid.NewGuid(), Guid.NewGuid() };
        var matchId = Guid.NewGuid();

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.MatchStart,
            "Match commencé",
            "Le match a commencé",
            new { matchId = matchId }
        );

        // Assert
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(2, notifications.Count);
        Assert.All(notifications, n =>
        {
            Assert.NotNull(n.DataJson);
            Assert.Contains(matchId.ToString(), n.DataJson);
        });
        // All notifications should have the same DataJson
        Assert.Equal(notifications[0].DataJson, notifications[1].DataJson);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldNotCreateNotifications_WhenEmptyUserIds()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userIds = Array.Empty<Guid>();

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.NewTicket,
            "Test",
            "Test message"
        );

        // Assert
        var notifications = await context.Notifications.ToListAsync();
        Assert.Empty(notifications);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldUseSameCreatedAtForAllNotifications()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userIds = new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        // Act
        await service.NotifyManyAsync(
            userIds,
            NotificationType.SubscriptionExpire,
            "Abonnement expire",
            "Votre abonnement expire bientôt"
        );

        // Assert
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(3, notifications.Count);
        // All notifications should have the same CreatedAt timestamp
        var firstCreatedAt = notifications[0].CreatedAt;
        Assert.All(notifications, n => Assert.Equal(firstCreatedAt, n.CreatedAt));
    }

    // --- Tests for GetByUserIdPaginatedAsync (pagination with unread first) ---

    [Fact]
    public async Task GetByUserIdPaginatedAsync_ShouldReturnPaginatedResults()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        // Create 15 notifications
        for (int i = 0; i < 15; i++)
        {
            context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = NotificationType.NewTicket,
                Title = $"Notification {i}",
                Message = $"Message {i}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await context.SaveChangesAsync();

        // Act
        var page1 = await service.GetByUserIdPaginatedAsync(userId, page: 1, pageSize: 10);
        var page2 = await service.GetByUserIdPaginatedAsync(userId, page: 2, pageSize: 10);

        // Assert
        Assert.Equal(10, page1.Items.Count());
        Assert.Equal(5, page2.Items.Count());
        Assert.Equal(15, page1.TotalCount);
        Assert.Equal(15, page2.TotalCount);
        Assert.Equal(1, page1.Page);
        Assert.Equal(2, page2.Page);
        Assert.True(page1.HasNextPage);
        Assert.False(page2.HasNextPage);
    }

    [Fact]
    public async Task GetByUserIdPaginatedAsync_ShouldReturnUnreadFirst()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();

        // Create notifications: older unread, newer read
        var oldUnread = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "Old Unread",
            Message = "This is old but unread",
            IsRead = false,
            CreatedAt = DateTime.UtcNow.AddHours(-5)
        };
        var newRead = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = NotificationType.TicketWon,
            Title = "New Read",
            Message = "This is new but read",
            IsRead = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(-1)
        };
        var newestUnread = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = NotificationType.MatchStart,
            Title = "Newest Unread",
            Message = "This is the newest unread",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.AddRange(oldUnread, newRead, newestUnread);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByUserIdPaginatedAsync(userId, page: 1, pageSize: 10);
        var items = result.Items.ToList();

        // Assert
        Assert.Equal(3, items.Count);
        // Unread should come first, ordered by date descending
        Assert.Equal("Newest Unread", items[0].Title);
        Assert.Equal("Old Unread", items[1].Title);
        // Then read notifications
        Assert.Equal("New Read", items[2].Title);
    }

    // --- Tests for MarkOneAsReadAsync (single notification read) ---

    [Fact]
    public async Task MarkOneAsReadAsync_ShouldMarkNotificationAsRead()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        context.Notifications.Add(new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "Test",
            Message = "Test message",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        var result = await service.MarkOneAsReadAsync(userId, notificationId);

        // Assert
        Assert.True(result);
        var notification = await context.Notifications.FindAsync(notificationId);
        Assert.True(notification!.IsRead);
    }

    [Fact]
    public async Task MarkOneAsReadAsync_ShouldReturnFalse_WhenNotificationNotFound()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);

        // Act
        var result = await service.MarkOneAsReadAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task MarkOneAsReadAsync_ShouldReturnFalse_WhenWrongUser()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        context.Notifications.Add(new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "Test",
            Message = "Test message",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        var result = await service.MarkOneAsReadAsync(otherUserId, notificationId);

        // Assert
        Assert.False(result);
        var notification = await context.Notifications.FindAsync(notificationId);
        Assert.False(notification!.IsRead); // Should still be unread
    }

    [Fact]
    public async Task MarkOneAsReadAsync_ShouldReturnTrue_WhenAlreadyRead()
    {
        // Arrange
        using var context = CreateContext();
        var service = CreateService(context);
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        context.Notifications.Add(new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.NewTicket,
            Title = "Test",
            Message = "Test message",
            IsRead = true, // Already read
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        var result = await service.MarkOneAsReadAsync(userId, notificationId);

        // Assert
        Assert.True(result); // Should still return true (notification exists)
    }
}

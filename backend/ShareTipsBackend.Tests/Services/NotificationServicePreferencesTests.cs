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

public class NotificationServicePreferencesTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private NotificationService CreateNotificationService(ApplicationDbContext context, NotificationPreferencesService preferencesService)
    {
        var serviceProvider = new Mock<IServiceProvider>().Object;
        var logger = NullLogger<NotificationService>.Instance;
        return new NotificationService(context, preferencesService, serviceProvider, logger);
    }

    // --- Tests for NotifyUserAsync respecting preferences ---

    [Fact]
    public async Task NotifyUserAsync_ShouldNotCreateNotification_WhenPreferenceDisabled()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);
        var userId = Guid.NewGuid();

        // Disable NewTicket preference
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
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster a publié un nouveau ticket"
        );

        // Assert - no notification should be created
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Empty(notifications);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldCreateNotification_WhenPreferenceEnabled()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);
        var userId = Guid.NewGuid();

        // Enable all preferences (default)
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster a publié un nouveau ticket"
        );

        // Assert - notification should be created
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Single(notifications);
        Assert.Equal(NotificationType.NewTicket, notifications[0].Type);
    }

    [Fact]
    public async Task NotifyUserAsync_ShouldCreateNotification_WhenNoPreferencesExist_DefaultsToEnabled()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);
        var userId = Guid.NewGuid();

        // No preferences created - should default to enabled

        // Act
        await notificationService.NotifyUserAsync(
            userId,
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster a publié un nouveau ticket"
        );

        // Assert - notification should be created (default is enabled)
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Single(notifications);
    }

    [Fact]
    public async Task NotifyUserAsync_DisablingTicketResult_ShouldBlockTicketWon()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);
        var userId = Guid.NewGuid();

        // Disable TicketResult (covers TicketWon and TicketLost)
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = true,
            MatchStart = true,
            TicketResult = false,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyUserAsync(
            userId,
            NotificationType.TicketWon,
            "Ticket gagné",
            "Votre ticket a gagné!"
        );

        // Assert - no notification should be created
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Empty(notifications);
    }

    [Fact]
    public async Task NotifyUserAsync_DisablingTicketResult_ShouldBlockTicketLost()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);
        var userId = Guid.NewGuid();

        // Disable TicketResult
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = true,
            MatchStart = true,
            TicketResult = false,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyUserAsync(
            userId,
            NotificationType.TicketLost,
            "Ticket perdu",
            "Votre ticket a perdu"
        );

        // Assert - no notification should be created
        var notifications = await context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        Assert.Empty(notifications);
    }

    // --- Tests for NotifyManyAsync respecting preferences ---

    [Fact]
    public async Task NotifyManyAsync_ShouldOnlyNotifyUsersWithEnabledPreference()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);

        var userEnabled = Guid.NewGuid();
        var userDisabled = Guid.NewGuid();
        var userNoPrefs = Guid.NewGuid();

        // User with enabled preference
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userEnabled,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        // User with disabled preference
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userDisabled,
            NewTicket = false,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        // userNoPrefs has no preferences (should default to enabled)
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyManyAsync(
            new[] { userEnabled, userDisabled, userNoPrefs },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster a publié un nouveau ticket"
        );

        // Assert - only 2 notifications should be created (userEnabled and userNoPrefs)
        var notifications = await context.Notifications.ToListAsync();
        Assert.Equal(2, notifications.Count);
        Assert.Contains(notifications, n => n.UserId == userEnabled);
        Assert.Contains(notifications, n => n.UserId == userNoPrefs);
        Assert.DoesNotContain(notifications, n => n.UserId == userDisabled);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldCreateNoNotifications_WhenAllUsersDisabled()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        // Both users have disabled NewTicket
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = user1,
            NewTicket = false,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = user2,
            NewTicket = false,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyManyAsync(
            new[] { user1, user2 },
            NotificationType.NewTicket,
            "Nouveau ticket",
            "Un tipster a publié un nouveau ticket"
        );

        // Assert - no notifications
        var notifications = await context.Notifications.ToListAsync();
        Assert.Empty(notifications);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldRespectMatchStartPreference()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);

        var userEnabled = Guid.NewGuid();
        var userDisabled = Guid.NewGuid();

        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userEnabled,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userDisabled,
            NewTicket = true,
            MatchStart = false,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyManyAsync(
            new[] { userEnabled, userDisabled },
            NotificationType.MatchStart,
            "Match commence",
            "Le match va commencer"
        );

        // Assert - only 1 notification
        var notifications = await context.Notifications.ToListAsync();
        Assert.Single(notifications);
        Assert.Equal(userEnabled, notifications[0].UserId);
    }

    [Fact]
    public async Task NotifyManyAsync_ShouldRespectSubscriptionExpirePreference()
    {
        // Arrange
        using var context = CreateContext();
        var preferencesService = new NotificationPreferencesService(context);
        var notificationService = CreateNotificationService(context, preferencesService);

        var userEnabled = Guid.NewGuid();
        var userDisabled = Guid.NewGuid();

        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userEnabled,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userDisabled,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        await notificationService.NotifyManyAsync(
            new[] { userEnabled, userDisabled },
            NotificationType.SubscriptionExpire,
            "Abonnement expire",
            "Votre abonnement expire bientôt"
        );

        // Assert - only 1 notification
        var notifications = await context.Notifications.ToListAsync();
        Assert.Single(notifications);
        Assert.Equal(userEnabled, notifications[0].UserId);
    }
}

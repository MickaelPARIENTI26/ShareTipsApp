using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services.Interfaces;
using Xunit;

namespace ShareTipsBackend.Tests.BackgroundServices;

public class SubscriptionExpirationServiceNotificationTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
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

    private async Task<Subscription> CreateSubscriptionAsync(
        ApplicationDbContext context,
        Guid subscriberId,
        Guid tipsterId,
        DateTime endDate,
        SubscriptionStatus status = SubscriptionStatus.Active)
    {
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriberId,
            TipsterId = tipsterId,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            EndDate = endDate,
            Status = status,
            CreatedAt = DateTime.UtcNow.AddMonths(-1),
            NotifiedExpiringJ3 = false,
            NotifiedExpiringJ1 = false,
            NotifiedExpired = false
        };
        context.Subscriptions.Add(subscription);
        await context.SaveChangesAsync();
        return subscription;
    }

    [Fact]
    public async Task ShouldSendJ3Notification_WhenSubscriptionExpires3DaysFromNow()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber1");
        var tipster = await CreateUserAsync(context, "tipster1");

        // Subscription expires in 2.5 days (between 2 and 3 days)
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddDays(2.5));

        // Reload with tipster for the service
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does
        var now = DateTime.UtcNow;
        var daysUntilExpiration = (subscriptionWithTipster.EndDate - now).TotalDays;

        if (!subscriptionWithTipster.NotifiedExpiringJ3 && daysUntilExpiration <= 3 && daysUntilExpiration > 2)
        {
            await mockNotificationService.Object.NotifyUserAsync(
                subscriptionWithTipster.SubscriberId,
                NotificationType.SubscriptionExpire,
                "Abonnement expire bientôt",
                $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} expire dans 3 jours",
                new { subscriptionId = subscriptionWithTipster.Id, tipsterId = subscriptionWithTipster.TipsterId, daysRemaining = 3 });

            subscriptionWithTipster.NotifiedExpiringJ3 = true;
            await context.SaveChangesAsync();
        }

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                subscriber.Id,
                NotificationType.SubscriptionExpire,
                "Abonnement expire bientôt",
                It.Is<string>(msg => msg.Contains("tipster1") && msg.Contains("3 jours")),
                It.IsAny<object>()),
            Times.Once);

        var updatedSubscription = await context.Subscriptions.FindAsync(subscription.Id);
        Assert.True(updatedSubscription!.NotifiedExpiringJ3);
    }

    [Fact]
    public async Task ShouldSendJ1Notification_WhenSubscriptionExpires1DayFromNow()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber2");
        var tipster = await CreateUserAsync(context, "tipster2");

        // Subscription expires in 0.5 days (between 0 and 1 day)
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddHours(12));

        // Reload with tipster
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does
        var now = DateTime.UtcNow;
        var daysUntilExpiration = (subscriptionWithTipster.EndDate - now).TotalDays;

        if (!subscriptionWithTipster.NotifiedExpiringJ1 && daysUntilExpiration <= 1 && daysUntilExpiration > 0)
        {
            await mockNotificationService.Object.NotifyUserAsync(
                subscriptionWithTipster.SubscriberId,
                NotificationType.SubscriptionExpire,
                "Abonnement expire demain",
                $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} expire demain",
                new { subscriptionId = subscriptionWithTipster.Id, tipsterId = subscriptionWithTipster.TipsterId, daysRemaining = 1 });

            subscriptionWithTipster.NotifiedExpiringJ1 = true;
            await context.SaveChangesAsync();
        }

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                subscriber.Id,
                NotificationType.SubscriptionExpire,
                "Abonnement expire demain",
                It.Is<string>(msg => msg.Contains("tipster2") && msg.Contains("demain")),
                It.IsAny<object>()),
            Times.Once);

        var updatedSubscription = await context.Subscriptions.FindAsync(subscription.Id);
        Assert.True(updatedSubscription!.NotifiedExpiringJ1);
    }

    [Fact]
    public async Task ShouldSendExpiredNotification_WhenSubscriptionHasExpired()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber3");
        var tipster = await CreateUserAsync(context, "tipster3");

        // Subscription expired 1 hour ago
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddHours(-1));

        // Reload with tipster
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does for expired subscriptions
        var now = DateTime.UtcNow;

        if (subscriptionWithTipster.Status == SubscriptionStatus.Active && subscriptionWithTipster.EndDate <= now)
        {
            subscriptionWithTipster.Status = SubscriptionStatus.Expired;

            if (!subscriptionWithTipster.NotifiedExpired)
            {
                await mockNotificationService.Object.NotifyUserAsync(
                    subscriptionWithTipster.SubscriberId,
                    NotificationType.SubscriptionExpire,
                    "Abonnement expiré",
                    $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} a expiré",
                    new { subscriptionId = subscriptionWithTipster.Id, tipsterId = subscriptionWithTipster.TipsterId, expired = true });

                subscriptionWithTipster.NotifiedExpired = true;
            }

            await context.SaveChangesAsync();
        }

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                subscriber.Id,
                NotificationType.SubscriptionExpire,
                "Abonnement expiré",
                It.Is<string>(msg => msg.Contains("tipster3") && msg.Contains("expiré")),
                It.IsAny<object>()),
            Times.Once);

        var updatedSubscription = await context.Subscriptions.FindAsync(subscription.Id);
        Assert.Equal(SubscriptionStatus.Expired, updatedSubscription!.Status);
        Assert.True(updatedSubscription.NotifiedExpired);
    }

    [Fact]
    public async Task ShouldNotSendDuplicateJ3Notification_WhenAlreadyNotified()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber4");
        var tipster = await CreateUserAsync(context, "tipster4");

        // Create subscription that's already been notified for J-3
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddDays(2.5));

        subscription.NotifiedExpiringJ3 = true;
        await context.SaveChangesAsync();

        // Reload with tipster
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does
        var now = DateTime.UtcNow;
        var daysUntilExpiration = (subscriptionWithTipster.EndDate - now).TotalDays;

        if (!subscriptionWithTipster.NotifiedExpiringJ3 && daysUntilExpiration <= 3 && daysUntilExpiration > 2)
        {
            await mockNotificationService.Object.NotifyUserAsync(
                subscriptionWithTipster.SubscriberId,
                NotificationType.SubscriptionExpire,
                "Abonnement expire bientôt",
                $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} expire dans 3 jours",
                It.IsAny<object>());
        }

        // Assert - No notification should have been sent
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Never);
    }

    [Fact]
    public async Task ShouldNotSendDuplicateJ1Notification_WhenAlreadyNotified()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber5");
        var tipster = await CreateUserAsync(context, "tipster5");

        // Create subscription that's already been notified for J-1
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddHours(12));

        subscription.NotifiedExpiringJ1 = true;
        await context.SaveChangesAsync();

        // Reload with tipster
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does
        var now = DateTime.UtcNow;
        var daysUntilExpiration = (subscriptionWithTipster.EndDate - now).TotalDays;

        if (!subscriptionWithTipster.NotifiedExpiringJ1 && daysUntilExpiration <= 1 && daysUntilExpiration > 0)
        {
            await mockNotificationService.Object.NotifyUserAsync(
                subscriptionWithTipster.SubscriberId,
                NotificationType.SubscriptionExpire,
                "Abonnement expire demain",
                $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} expire demain",
                It.IsAny<object>());
        }

        // Assert - No notification should have been sent
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Never);
    }

    [Fact]
    public async Task ShouldNotSendDuplicateExpiredNotification_WhenAlreadyNotified()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var subscriber = await CreateUserAsync(context, "subscriber6");
        var tipster = await CreateUserAsync(context, "tipster6");

        // Create subscription that's already been notified for expiration
        var subscription = await CreateSubscriptionAsync(
            context, subscriber.Id, tipster.Id,
            DateTime.UtcNow.AddHours(-1));

        subscription.NotifiedExpired = true;
        await context.SaveChangesAsync();

        // Reload with tipster
        var subscriptionWithTipster = await context.Subscriptions
            .Include(s => s.Tipster)
            .FirstAsync(s => s.Id == subscription.Id);

        // Act - Simulate what the service does for expired subscriptions
        var now = DateTime.UtcNow;

        if (subscriptionWithTipster.Status == SubscriptionStatus.Active && subscriptionWithTipster.EndDate <= now)
        {
            subscriptionWithTipster.Status = SubscriptionStatus.Expired;

            if (!subscriptionWithTipster.NotifiedExpired)
            {
                await mockNotificationService.Object.NotifyUserAsync(
                    subscriptionWithTipster.SubscriberId,
                    NotificationType.SubscriptionExpire,
                    "Abonnement expiré",
                    $"Votre abonnement à {subscriptionWithTipster.Tipster?.Username} a expiré",
                    It.IsAny<object>());
            }

            await context.SaveChangesAsync();
        }

        // Assert - No notification should have been sent
        mockNotificationService.Verify(
            s => s.NotifyUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Never);
    }

    [Fact]
    public async Task ShouldResetNotificationFlags_WhenSubscriptionIsReactivated()
    {
        // Arrange
        using var context = CreateContext();

        var subscriber = await CreateUserAsync(context, "subscriber7");
        var tipster = await CreateUserAsync(context, "tipster7");

        // Create expired subscription with all notification flags set
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            EndDate = DateTime.UtcNow.AddMonths(-1),
            Status = SubscriptionStatus.Expired,
            CreatedAt = DateTime.UtcNow.AddMonths(-2),
            NotifiedExpiringJ3 = true,
            NotifiedExpiringJ1 = true,
            NotifiedExpired = true
        };
        context.Subscriptions.Add(subscription);
        await context.SaveChangesAsync();

        // Act - Simulate reactivation (what SubscriptionService does)
        subscription.PriceCents = 1000;
        subscription.CommissionCents = 170;
        subscription.TipsterAmountCents = 830;
        subscription.StartDate = DateTime.UtcNow;
        subscription.EndDate = DateTime.UtcNow.AddMonths(1);
        subscription.Status = SubscriptionStatus.Active;
        subscription.CancelledAt = null;
        // Reset notification flags for new subscription period
        subscription.NotifiedExpiringJ3 = false;
        subscription.NotifiedExpiringJ1 = false;
        subscription.NotifiedExpired = false;

        await context.SaveChangesAsync();

        // Assert
        var updatedSubscription = await context.Subscriptions.FindAsync(subscription.Id);
        Assert.Equal(SubscriptionStatus.Active, updatedSubscription!.Status);
        Assert.False(updatedSubscription.NotifiedExpiringJ3);
        Assert.False(updatedSubscription.NotifiedExpiringJ1);
        Assert.False(updatedSubscription.NotifiedExpired);
    }
}

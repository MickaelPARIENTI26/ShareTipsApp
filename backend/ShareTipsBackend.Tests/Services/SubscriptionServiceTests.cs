using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

/// <summary>
/// Unit tests for SubscriptionService.
/// Tests focus on subscription validation, duplicate prevention, and status checking.
/// </summary>
public class SubscriptionServiceTests
{
    private static SubscriptionService CreateService(Data.ApplicationDbContext context)
    {
        var consentService = new Mock<IConsentService>();
        consentService.Setup(x => x.HasConsentAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(true);
        var stripeService = new Mock<IStripeConnectService>();
        var gamificationService = new Mock<IGamificationService>();
        gamificationService.Setup(x => x.AwardXpAsync(It.IsAny<Guid>(), It.IsAny<XpActionType>(), It.IsAny<string?>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new XpGainResultDto(25, 100, 1, false, null, null, null));
        var logger = new Mock<ILogger<SubscriptionService>>();
        return new SubscriptionService(context, consentService.Object, stripeService.Object, gamificationService.Object, logger.Object);
    }

    private async Task<(User subscriber, User tipster)> SetupUsersAsync(Data.ApplicationDbContext context)
    {
        var tipster = new User
        {
            Id = Guid.NewGuid(),
            Email = "tipster@example.com",
            Username = "tipster",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(tipster);

        var subscriber = new User
        {
            Id = Guid.NewGuid(),
            Email = "subscriber@example.com",
            Username = "subscriber",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(subscriber);

        await context.SaveChangesAsync();
        return (subscriber, tipster);
    }

    [Fact]
    public async Task SubscribeAsync_CannotSubscribeToSelf()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Username = "user",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var result = await service.SubscribeAsync(user.Id, user.Id, 0);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("yourself");
    }

    [Fact]
    public async Task SubscribeAsync_CannotSubscribeTwice()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Create existing active subscription
        var existingSubscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 0,
            CommissionCents = 0,
            TipsterAmountCents = 0,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Subscriptions.Add(existingSubscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.SubscribeAsync(subscriber.Id, tipster.Id, 0);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Already subscribed");
    }

    [Fact]
    public async Task SubscribeAsync_TipsterNotFound_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);

        var subscriber = new User
        {
            Id = Guid.NewGuid(),
            Email = "subscriber@example.com",
            Username = "subscriber",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(subscriber);
        await context.SaveChangesAsync();

        // Act
        var result = await service.SubscribeAsync(subscriber.Id, Guid.NewGuid(), 0);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task HasActiveSubscriptionAsync_NoSubscription_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Act
        var result = await service.HasActiveSubscriptionAsync(subscriber.Id, tipster.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasActiveSubscriptionAsync_ExpiredSubscription_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Create expired subscription
        var expiredSubscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 0,
            CommissionCents = 0,
            TipsterAmountCents = 0,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(-1), // Expired yesterday
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };
        context.Subscriptions.Add(expiredSubscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.HasActiveSubscriptionAsync(subscriber.Id, tipster.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasActiveSubscriptionAsync_ActiveSubscription_ReturnsTrue()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Create active subscription
        var activeSubscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 0,
            CommissionCents = 0,
            TipsterAmountCents = 0,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Subscriptions.Add(activeSubscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.HasActiveSubscriptionAsync(subscriber.Id, tipster.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task GetSubscriptionStatusAsync_NoSubscription_ReturnsNotSubscribed()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Act
        var result = await service.GetSubscriptionStatusAsync(subscriber.Id, tipster.Id);

        // Assert
        result.IsSubscribed.Should().BeFalse();
        result.WasSubscribed.Should().BeFalse();
        result.EndDate.Should().BeNull();
    }

    [Fact]
    public async Task GetSubscriptionStatusAsync_ActiveSubscription_ReturnsSubscribed()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        var endDate = DateTime.UtcNow.AddDays(15);
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddDays(-15),
            EndDate = endDate,
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };
        context.Subscriptions.Add(subscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetSubscriptionStatusAsync(subscriber.Id, tipster.Id);

        // Assert
        result.IsSubscribed.Should().BeTrue();
        result.EndDate.Should().BeCloseTo(endDate, TimeSpan.FromSeconds(1));
        result.RemainingDays.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetSubscriptionStatusAsync_ExpiredSubscription_ReturnsWasSubscribed()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        var expiredSubscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddDays(-45),
            EndDate = DateTime.UtcNow.AddDays(-15),
            Status = SubscriptionStatus.Expired,
            CreatedAt = DateTime.UtcNow.AddDays(-45)
        };
        context.Subscriptions.Add(expiredSubscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetSubscriptionStatusAsync(subscriber.Id, tipster.Id);

        // Assert
        result.IsSubscribed.Should().BeFalse();
        result.WasSubscribed.Should().BeTrue();
        result.PreviousEndDate.Should().NotBeNull();
    }

    [Fact]
    public async Task ExpireSubscriptionsAsync_ExpiresOldSubscriptions()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Create subscription that should be expired
        var oldSubscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 0,
            CommissionCents = 0,
            TipsterAmountCents = 0,
            StartDate = DateTime.UtcNow.AddDays(-35),
            EndDate = DateTime.UtcNow.AddDays(-5), // Expired 5 days ago
            Status = SubscriptionStatus.Active, // Still marked as active
            CreatedAt = DateTime.UtcNow.AddDays(-35)
        };
        context.Subscriptions.Add(oldSubscription);
        await context.SaveChangesAsync();

        // Act
        var count = await service.ExpireSubscriptionsAsync();

        // Assert
        count.Should().Be(1);

        var updated = await context.Subscriptions.FindAsync(oldSubscription.Id);
        updated!.Status.Should().Be(SubscriptionStatus.Expired);
    }

    [Fact]
    public async Task UnsubscribeAsync_ActiveSubscription_Cancels()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        context.Subscriptions.Add(subscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.UnsubscribeAsync(subscriber.Id, tipster.Id);

        // Assert
        result.Should().BeTrue();

        var updated = await context.Subscriptions.FindAsync(subscription.Id);
        updated!.Status.Should().Be(SubscriptionStatus.Cancelled);
        updated.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UnsubscribeAsync_NoSubscription_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (subscriber, tipster) = await SetupUsersAsync(context);

        // Act
        var result = await service.UnsubscribeAsync(subscriber.Id, tipster.Id);

        // Assert
        result.Should().BeFalse();
    }
}

using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

/// <summary>
/// Unit tests for AccessControlService.
/// Tests centralized access control logic for subscriptions and purchases.
/// </summary>
public class AccessControlServiceTests
{
    private AccessControlService CreateService(Data.ApplicationDbContext context)
    {
        return new AccessControlService(context, NullLogger<AccessControlService>.Instance);
    }

    private async Task<(User owner, User subscriber, User stranger)> SetupUsersAsync(
        Data.ApplicationDbContext context)
    {
        var owner = new User
        {
            Id = Guid.NewGuid(),
            Email = "owner@example.com",
            Username = "owner",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var subscriber = new User
        {
            Id = Guid.NewGuid(),
            Email = "subscriber@example.com",
            Username = "subscriber",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var stranger = new User
        {
            Id = Guid.NewGuid(),
            Email = "stranger@example.com",
            Username = "stranger",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(owner, subscriber, stranger);
        await context.SaveChangesAsync();

        return (owner, subscriber, stranger);
    }

    #region CanAccessPrivateContentAsync Tests

    [Fact]
    public async Task CanAccessPrivateContentAsync_Owner_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, _) = await SetupUsersAsync(context);

        // Act
        var result = await service.CanAccessPrivateContentAsync(owner.Id, owner.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Owner);
    }

    [Fact]
    public async Task CanAccessPrivateContentAsync_WithSubscription_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, subscriber, _) = await SetupUsersAsync(context);

        // Create active subscription
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = owner.Id,
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
        var result = await service.CanAccessPrivateContentAsync(subscriber.Id, owner.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Subscription);
    }

    [Fact]
    public async Task CanAccessPrivateContentAsync_NoSubscription_NoAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        // Act
        var result = await service.CanAccessPrivateContentAsync(stranger.Id, owner.Id);

        // Assert
        result.HasAccess.Should().BeFalse();
        result.AccessType.Should().Be(AccessType.None);
    }

    [Fact]
    public async Task CanAccessPrivateContentAsync_ExpiredSubscription_NoAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, subscriber, _) = await SetupUsersAsync(context);

        // Create expired subscription
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = owner.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            TipsterAmountCents = 830,
            StartDate = DateTime.UtcNow.AddDays(-40),
            EndDate = DateTime.UtcNow.AddDays(-10), // Expired
            Status = SubscriptionStatus.Active,
            CreatedAt = DateTime.UtcNow.AddDays(-40)
        };
        context.Subscriptions.Add(subscription);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessPrivateContentAsync(subscriber.Id, owner.Id);

        // Assert
        result.HasAccess.Should().BeFalse();
    }

    #endregion

    #region CanAccessTicketAsync Tests

    [Fact]
    public async Task CanAccessTicketAsync_PublicTicket_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Public Ticket",
            IsPublic = true,
            PriceCents = 0,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessTicketAsync(stranger.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Public);
    }

    [Fact]
    public async Task CanAccessTicketAsync_PrivateTicket_Creator_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, _) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Private Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessTicketAsync(owner.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Owner);
    }

    [Fact]
    public async Task CanAccessTicketAsync_PrivateTicket_WithPurchase_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Private Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);

        // Create purchase record
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = stranger.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessTicketAsync(stranger.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Purchase);
    }

    [Fact]
    public async Task CanAccessTicketAsync_PrivateTicket_WithSubscription_HasAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, subscriber, _) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Private Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);

        // Create active subscription
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = owner.Id,
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
        var result = await service.CanAccessTicketAsync(subscriber.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeTrue();
        result.AccessType.Should().Be(AccessType.Subscription);
    }

    [Fact]
    public async Task CanAccessTicketAsync_PrivateTicket_NoAccess_NoAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Private Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessTicketAsync(stranger.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeFalse();
        result.AccessType.Should().Be(AccessType.None);
    }

    [Fact]
    public async Task CanAccessTicketAsync_DeletedTicket_NoAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, _) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Deleted Ticket",
            IsPublic = true,
            PriceCents = 0,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow,
            DeletedAt = DateTime.UtcNow // Soft deleted
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.CanAccessTicketAsync(owner.Id, ticket.Id);

        // Assert
        result.HasAccess.Should().BeFalse();
        result.Reason.Should().Contain("not found");
    }

    [Fact]
    public async Task CanAccessTicketAsync_NonExistentTicket_NoAccess()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (_, _, stranger) = await SetupUsersAsync(context);

        // Act
        var result = await service.CanAccessTicketAsync(stranger.Id, Guid.NewGuid());

        // Assert
        result.HasAccess.Should().BeFalse();
        result.Reason.Should().Contain("not found");
    }

    #endregion

    #region HasActiveSubscriptionAsync Tests

    [Fact]
    public async Task HasActiveSubscriptionAsync_NoSubscription_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, subscriber, _) = await SetupUsersAsync(context);

        // Act
        var result = await service.HasActiveSubscriptionAsync(subscriber.Id, owner.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasActiveSubscriptionAsync_ActiveSubscription_ReturnsTrue()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, subscriber, _) = await SetupUsersAsync(context);

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = owner.Id,
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
        var result = await service.HasActiveSubscriptionAsync(subscriber.Id, owner.Id);

        // Assert
        result.Should().BeTrue();
    }

    #endregion

    #region HasPurchasedTicketAsync Tests

    [Fact]
    public async Task HasPurchasedTicketAsync_NoPurchase_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Test Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.HasPurchasedTicketAsync(stranger.Id, ticket.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task HasPurchasedTicketAsync_WithPurchase_ReturnsTrue()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var service = CreateService(context);
        var (owner, _, stranger) = await SetupUsersAsync(context);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = owner.Id,
            Title = "Test Ticket",
            IsPublic = false,
            PriceCents = 100,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "FOOTBALL" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);

        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = stranger.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = await service.HasPurchasedTicketAsync(stranger.Id, ticket.Id);

        // Assert
        result.Should().BeTrue();
    }

    #endregion
}

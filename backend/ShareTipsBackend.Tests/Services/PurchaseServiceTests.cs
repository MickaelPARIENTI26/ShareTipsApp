using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

/// <summary>
/// Unit tests for PurchaseService validation logic.
/// Note: Full purchase flow tests require PostgreSQL for FOR UPDATE locking.
/// These tests focus on validation paths that can be tested with InMemory DB.
/// </summary>
public class PurchaseServiceTests
{
    private static PurchaseService CreateService(Data.ApplicationDbContext context)
    {
        var consentService = new Mock<IConsentService>();
        consentService.Setup(x => x.HasConsentAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(true);
        var logger = new Mock<ILogger<PurchaseService>>();
        return new PurchaseService(context, consentService.Object, logger.Object);
    }

    private async Task<(User buyer, User seller, Ticket ticket)> SetupBuyerSellerTicketAsync(
        Data.ApplicationDbContext context,
        int ticketPrice = 100,
        TicketStatus status = TicketStatus.Open)
    {
        var seller = new User
        {
            Id = Guid.NewGuid(),
            Email = "seller@example.com",
            Username = "seller",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(seller);

        var buyer = new User
        {
            Id = Guid.NewGuid(),
            Email = "buyer@example.com",
            Username = "buyer",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(buyer);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = seller.Id,
            Title = "Premium Ticket",
            IsPublic = false,
            PriceCredits = ticketPrice,
            ConfidenceIndex = 8,
            AvgOdds = 2.5m,
            Sports = new[] { "soccer" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = status,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);

        await context.SaveChangesAsync();

        return (buyer, seller, ticket);
    }

    [Fact]
    public async Task GetPurchasesByBuyerAsync_NoPurchases_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);

        var buyer = new User
        {
            Id = Guid.NewGuid(),
            Email = "buyer@example.com",
            Username = "buyer",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(buyer);
        await context.SaveChangesAsync();

        // Act
        var result = await purchaseService.GetPurchasesByBuyerAsync(buyer.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPurchasesByBuyerAsync_WithPurchases_ReturnsList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (buyer, seller, ticket) = await SetupBuyerSellerTicketAsync(context);

        // Create purchase record directly
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCredits = 100,
            CommissionCredits = 17,
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = (await purchaseService.GetPurchasesByBuyerAsync(buyer.Id)).ToList();

        // Assert
        result.Should().HaveCount(1);
        result[0].TicketId.Should().Be(ticket.Id);
        result[0].BuyerId.Should().Be(buyer.Id);
        result[0].PriceCredits.Should().Be(100);
    }

    [Fact]
    public async Task GetSalesBySellerAsync_NoSales_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (_, seller, _) = await SetupBuyerSellerTicketAsync(context);

        // Act
        var result = await purchaseService.GetSalesBySellerAsync(seller.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetSalesBySellerAsync_WithSales_ReturnsList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (buyer, seller, ticket) = await SetupBuyerSellerTicketAsync(context, ticketPrice: 200);

        // Create purchase record directly
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCredits = 200,
            CommissionCredits = 34, // 17% of 200
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = (await purchaseService.GetSalesBySellerAsync(seller.Id)).ToList();

        // Assert
        result.Should().HaveCount(1);
        result[0].TicketId.Should().Be(ticket.Id);
        result[0].SellerUsername.Should().Be("seller");
        result[0].PriceCredits.Should().Be(200);
        result[0].CommissionCredits.Should().Be(34);
        result[0].SellerCredits.Should().Be(166); // 200 - 34
    }

    [Fact]
    public async Task GetPurchasesByBuyerAsync_ReturnsOrderedByMostRecent()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (buyer, seller, _) = await SetupBuyerSellerTicketAsync(context);

        // Create multiple tickets and purchases
        var purchases = new List<TicketPurchase>();
        for (int i = 0; i < 3; i++)
        {
            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                CreatorId = seller.Id,
                Title = $"Ticket {i}",
                IsPublic = false,
                PriceCredits = 50 * (i + 1),
                ConfidenceIndex = 5,
                AvgOdds = 2.0m,
                Sports = new[] { "soccer" },
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
                BuyerId = buyer.Id,
                PriceCredits = ticket.PriceCredits,
                CommissionCredits = (int)(ticket.PriceCredits * 0.17m),
                CreatedAt = DateTime.UtcNow.AddHours(-i) // Older purchases first
            };
            purchases.Add(purchase);
            context.TicketPurchases.Add(purchase);
        }
        await context.SaveChangesAsync();

        // Act
        var result = (await purchaseService.GetPurchasesByBuyerAsync(buyer.Id)).ToList();

        // Assert - most recent first
        result.Should().HaveCount(3);
        result[0].PriceCredits.Should().Be(50); // Most recent (i=0)
        result[2].PriceCredits.Should().Be(150); // Oldest (i=2)
    }

    [Fact]
    public async Task PurchaseDto_CalculatesSellerCreditsCorrectly()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (buyer, seller, ticket) = await SetupBuyerSellerTicketAsync(context, ticketPrice: 1000);

        // Create purchase with 17% commission
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCredits = 1000,
            CommissionCredits = 170, // 17%
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = (await purchaseService.GetSalesBySellerAsync(seller.Id)).First();

        // Assert
        result.PriceCredits.Should().Be(1000);
        result.CommissionCredits.Should().Be(170);
        result.SellerCredits.Should().Be(830); // 1000 - 170 = 830 (83%)
    }

    // Note: PurchaseTicketAsync cannot be fully tested with InMemory database
    // because it uses PostgreSQL-specific "FOR UPDATE" locking.
    // Below are integration-style tests that would need PostgreSQL.
    // They are commented out but show the expected behavior.

    /*
    [Fact]
    public async Task PurchaseTicketAsync_TicketNotFound_ReturnsError()
    {
        // Requires PostgreSQL
    }

    [Fact]
    public async Task PurchaseTicketAsync_BuyOwnTicket_ReturnsError()
    {
        // Requires PostgreSQL
    }

    [Fact]
    public async Task PurchaseTicketAsync_TicketNotOpen_ReturnsError()
    {
        // Requires PostgreSQL
    }

    [Fact]
    public async Task PurchaseTicketAsync_AlreadyPurchased_ReturnsError()
    {
        // Requires PostgreSQL
    }

    [Fact]
    public async Task PurchaseTicketAsync_InsufficientBalance_ReturnsError()
    {
        // Requires PostgreSQL
    }

    [Fact]
    public async Task PurchaseTicketAsync_ValidPurchase_TransfersCredits()
    {
        // Requires PostgreSQL
    }
    */
}

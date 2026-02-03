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
        var stripeService = new Mock<IStripeConnectService>();
        var logger = new Mock<ILogger<PurchaseService>>();
        return new PurchaseService(context, consentService.Object, stripeService.Object, logger.Object);
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
            PriceCents = ticketPrice,
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
            PriceCents = 1000,
            CommissionCents = 170, // 17% commission
            SellerAmountCents = 830,
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
        result[0].PriceEur.Should().Be(10.00m);
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
            PriceCents = 2000,
            CommissionCents = 340, // 17% of 2000
            SellerAmountCents = 1660,
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
        result[0].PriceEur.Should().Be(20.00m);
        result[0].CommissionEur.Should().Be(3.40m);
        result[0].SellerEarningsEur.Should().Be(16.60m); // 2000 - 340 cents
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
                PriceCents = 500 * (i + 1),
                ConfidenceIndex = 5,
                AvgOdds = 2.0m,
                Sports = new[] { "soccer" },
                FirstMatchTime = DateTime.UtcNow.AddDays(1),
                Status = TicketStatus.Open,
                Result = TicketResult.Pending,
                CreatedAt = DateTime.UtcNow
            };
            context.Tickets.Add(ticket);

            var commissionCents = (int)(ticket.PriceCents * 0.17m); // 17% commission
            var purchase = new TicketPurchase
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                BuyerId = buyer.Id,
                PriceCents = ticket.PriceCents,
                CommissionCents = commissionCents,
                SellerAmountCents = ticket.PriceCents - commissionCents,
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
        result[0].PriceEur.Should().Be(5.00m); // Most recent (i=0)
        result[2].PriceEur.Should().Be(15.00m); // Oldest (i=2)
    }

    [Fact]
    public async Task PurchaseDto_CalculatesSellerEarningsCorrectly()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var purchaseService = CreateService(context);
        var (buyer, seller, ticket) = await SetupBuyerSellerTicketAsync(context, ticketPrice: 10000);

        // Create purchase with 17% commission
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCents = 10000,
            CommissionCents = 1700, // 17%
            SellerAmountCents = 8300,
            CreatedAt = DateTime.UtcNow
        };
        context.TicketPurchases.Add(purchase);
        await context.SaveChangesAsync();

        // Act
        var result = (await purchaseService.GetSalesBySellerAsync(seller.Id)).First();

        // Assert
        result.PriceEur.Should().Be(100.00m);
        result.CommissionEur.Should().Be(17.00m);
        result.SellerEarningsEur.Should().Be(83.00m); // 10000 - 1700 = 8300 cents (83%)
    }
}

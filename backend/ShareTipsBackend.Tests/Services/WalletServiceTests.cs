using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class WalletServiceTests
{
    [Fact]
    public async Task GetByUserIdAsync_ExistingWallet_ReturnsWalletDto()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var userId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BalanceCredits = 1000,
            LockedCredits = 200,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetByUserIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Credits.Should().Be(1000);
        result.LockedCredits.Should().Be(200);
        result.AvailableCredits.Should().Be(800);
    }

    [Fact]
    public async Task GetByUserIdAsync_NonExistingWallet_ReturnsNull()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetByUserIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetTransactionsAsync_WithTransactions_ReturnsOrderedList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var userId = Guid.NewGuid();
        var walletId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = walletId,
            UserId = userId,
            BalanceCredits = 1000,
            LockedCredits = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);

        var transaction1 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Deposit,
            AmountCredits = 500,
            Status = TransactionStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var transaction2 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Purchase,
            AmountCredits = -100,
            Status = TransactionStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        var transaction3 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Deposit,
            AmountCredits = 600,
            Status = TransactionStatus.Completed,
            CreatedAt = DateTime.UtcNow
        };

        context.WalletTransactions.AddRange(transaction1, transaction2, transaction3);
        await context.SaveChangesAsync();

        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = (await walletService.GetTransactionsAsync(userId)).ToList();

        // Assert
        result.Should().HaveCount(3);
        result[0].AmountCredits.Should().Be(600); // Most recent first
        result[1].AmountCredits.Should().Be(-100);
        result[2].AmountCredits.Should().Be(500);
    }

    [Fact]
    public async Task GetTransactionsAsync_NoWallet_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetTransactionsAsync(Guid.NewGuid());

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTransactionsAsync_NoTransactions_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var userId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BalanceCredits = 0,
            LockedCredits = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetTransactionsAsync(userId);

        // Assert
        result.Should().BeEmpty();
    }

    // Note: CreditAsync and DebitAsync use PostgreSQL-specific FOR UPDATE
    // which requires integration tests with an actual PostgreSQL database.
    // These methods should be tested in ShareTipsBackend.IntegrationTests project.
}

using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class WalletServiceTests
{
    [Fact]
    public async Task GetTipsterWalletAsync_ExistingWallet_ReturnsTipsterWalletDto()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var userId = Guid.NewGuid();

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TipsterBalanceCents = 10000,
            PendingPayoutCents = 2000,
            TotalEarnedCents = 15000,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);
        await context.SaveChangesAsync();

        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetTipsterWalletAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.AvailableBalance.Should().Be(100.00m);
        result.PendingPayout.Should().Be(20.00m);
        result.TotalEarned.Should().Be(150.00m);
    }

    [Fact]
    public async Task GetTipsterWalletAsync_NonExistingWallet_ReturnsNull()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var walletService = new WalletService(context, NullLogger<WalletService>.Instance);

        // Act
        var result = await walletService.GetTipsterWalletAsync(Guid.NewGuid());

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
            TipsterBalanceCents = 10000,
            PendingPayoutCents = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);

        var transaction1 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Deposit,
            AmountCents = 5000,
            Status = TransactionStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var transaction2 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Purchase,
            AmountCents = -1000,
            Status = TransactionStatus.Completed,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        var transaction3 = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Type = TransactionType.Deposit,
            AmountCents = 6000,
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
        result[0].AmountEur.Should().Be(60.00m); // Most recent first
        result[1].AmountEur.Should().Be(-10.00m);
        result[2].AmountEur.Should().Be(50.00m);
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
            TipsterBalanceCents = 0,
            PendingPayoutCents = 0,
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

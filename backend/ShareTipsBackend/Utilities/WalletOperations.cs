using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;

namespace ShareTipsBackend.Utilities;

/// <summary>
/// Shared wallet operations for PurchaseService and SubscriptionService.
/// Handles deadlock-safe wallet locking and commission calculations.
/// </summary>
public static class WalletOperations
{
    public const decimal CommissionRate = 0.10m; // 10% platform commission

    /// <summary>
    /// Locks two wallets in a consistent order to prevent deadlocks.
    /// Always locks by UserId ascending order.
    /// </summary>
    public static async Task<(Wallet? PayerWallet, Wallet? ReceiverWallet)> LockWalletsInOrderAsync(
        ApplicationDbContext context,
        Guid payerUserId,
        Guid receiverUserId)
    {
        // DEADLOCK PREVENTION: Always lock wallets in consistent order (by UserId ascending)
        var firstLockUserId = payerUserId.CompareTo(receiverUserId) < 0 ? payerUserId : receiverUserId;
        var secondLockUserId = payerUserId.CompareTo(receiverUserId) < 0 ? receiverUserId : payerUserId;

        // Lock first wallet
        var firstWallet = await context.Wallets
            .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", firstLockUserId)
            .FirstOrDefaultAsync();

        // Lock second wallet
        var secondWallet = await context.Wallets
            .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", secondLockUserId)
            .FirstOrDefaultAsync();

        // Assign to payer/receiver based on who was locked first
        var payerWallet = firstLockUserId == payerUserId ? firstWallet : secondWallet;
        var receiverWallet = firstLockUserId == receiverUserId ? firstWallet : secondWallet;

        return (payerWallet, receiverWallet);
    }

    /// <summary>
    /// Calculates commission and net amounts in cents.
    /// </summary>
    public static (int CommissionCents, int ReceiverCents) CalculateCommission(int totalPriceCents)
    {
        var commissionCents = (int)Math.Ceiling(totalPriceCents * CommissionRate);
        var receiverCents = totalPriceCents - commissionCents;
        return (commissionCents, receiverCents);
    }

    /// <summary>
    /// Transfers cents between wallets with commission deduction.
    /// Updates wallet balances and creates transaction records.
    /// </summary>
    public static void TransferCentsWithCommission(
        ApplicationDbContext context,
        Wallet payerWallet,
        Wallet receiverWallet,
        int totalPriceCents,
        Guid referenceId,
        TransactionType payerTransactionType,
        TransactionType receiverTransactionType)
    {
        var (commissionCents, receiverCents) = CalculateCommission(totalPriceCents);
        var now = DateTime.UtcNow;

        // 1. Debit payer
        payerWallet.TipsterBalanceCents -= totalPriceCents;
        payerWallet.UpdatedAt = now;

        // 2. Credit receiver (after commission)
        receiverWallet.TipsterBalanceCents += receiverCents;
        receiverWallet.UpdatedAt = now;

        // 3. Create payer transaction
        context.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = payerWallet.Id,
            Type = payerTransactionType,
            AmountCents = -totalPriceCents,
            ReferenceId = referenceId,
            Status = TransactionStatus.Completed,
            CreatedAt = now
        });

        // 4. Create receiver transaction
        context.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = receiverWallet.Id,
            Type = receiverTransactionType,
            AmountCents = receiverCents,
            ReferenceId = referenceId,
            Status = TransactionStatus.Completed,
            CreatedAt = now
        });

        // 5. Create commission transaction (recorded on receiver's wallet for audit)
        context.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = receiverWallet.Id,
            Type = TransactionType.Commission,
            AmountCents = -commissionCents,
            ReferenceId = referenceId,
            Status = TransactionStatus.Completed,
            CreatedAt = now
        });
    }
}

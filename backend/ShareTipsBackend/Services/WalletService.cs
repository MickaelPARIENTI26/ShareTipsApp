using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class WalletService : IWalletService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WalletService> _logger;

    public WalletService(ApplicationDbContext context, ILogger<WalletService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WalletDto?> GetByUserIdAsync(Guid userId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null) return null;

        return new WalletDto(
            wallet.BalanceCredits,
            wallet.LockedCredits,
            wallet.BalanceCredits - wallet.LockedCredits
        );
    }

    public async Task<IEnumerable<WalletTransactionDto>> GetTransactionsAsync(Guid userId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null) return Enumerable.Empty<WalletTransactionDto>();

        var transactions = await _context.WalletTransactions
            .Where(t => t.WalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return transactions.Select(t => new WalletTransactionDto(
            t.Id,
            t.Type.ToString(),
            t.AmountCredits,
            t.Status.ToString(),
            t.CreatedAt
        ));
    }

    public async Task<WalletOperationResponse> CreditAsync(Guid userId, int amount, string? description = null)
    {
        if (amount <= 0)
        {
            return new WalletOperationResponse(false, 0, "Amount must be positive");
        }

        // Use transaction for atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Lock the wallet row for update (pessimistic locking)
            var wallet = await _context.Wallets
                .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", userId)
                .FirstOrDefaultAsync();

            if (wallet == null)
            {
                return new WalletOperationResponse(false, 0, "Wallet not found");
            }

            // Credit the wallet
            wallet.BalanceCredits += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            // Create transaction record
            var walletTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = TransactionType.Deposit,
                AmountCredits = amount,
                Status = TransactionStatus.Completed,
                CreatedAt = DateTime.UtcNow
            };

            _context.WalletTransactions.Add(walletTransaction);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new WalletOperationResponse(true, wallet.BalanceCredits, "Credit successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Wallet operation failed");
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<WalletOperationResponse> DebitAsync(Guid userId, int amount, string? description = null)
    {
        if (amount <= 0)
        {
            return new WalletOperationResponse(false, 0, "Amount must be positive");
        }

        // Use transaction for atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Lock the wallet row for update (pessimistic locking)
            var wallet = await _context.Wallets
                .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", userId)
                .FirstOrDefaultAsync();

            if (wallet == null)
            {
                return new WalletOperationResponse(false, 0, "Wallet not found");
            }

            var availableBalance = wallet.BalanceCredits - wallet.LockedCredits;

            // Check sufficient credits
            if (availableBalance < amount)
            {
                return new WalletOperationResponse(false, wallet.BalanceCredits, "Insufficient credits");
            }

            // Debit the wallet
            wallet.BalanceCredits -= amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            // Create transaction record
            var walletTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = TransactionType.Purchase,
                AmountCredits = -amount,
                Status = TransactionStatus.Completed,
                CreatedAt = DateTime.UtcNow
            };

            _context.WalletTransactions.Add(walletTransaction);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new WalletOperationResponse(true, wallet.BalanceCredits, "Debit successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Wallet operation failed");
            await transaction.RollbackAsync();
            throw;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class WalletService : IWalletService
{
    private const int CreditsPerEuro = 10;

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

    public async Task<DepositResponse> InitiateDepositAsync(Guid userId, decimal amountEur)
    {
        if (amountEur <= 0)
            return new DepositResponse(false, Guid.Empty, 0, null, "Amount must be positive");

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null)
            return new DepositResponse(false, Guid.Empty, 0, null, "Wallet not found");

        var credits = (int)(amountEur * CreditsPerEuro);

        // Create a PENDING transaction
        var walletTransaction = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = TransactionType.Deposit,
            AmountCredits = credits,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.WalletTransactions.Add(walletTransaction);
        await _context.SaveChangesAsync();

        // In production, generate a real MoonPay widget URL with the transactionId as externalTransactionId
        var moonPayUrl = $"https://buy.moonpay.com/?externalTransactionId={walletTransaction.Id}&baseCurrencyAmount={amountEur}";

        _logger.LogInformation(
            "Deposit initiated: User={UserId}, Amount={AmountEur}€, Credits={Credits}, TxId={TxId}",
            userId, amountEur, credits, walletTransaction.Id);

        return new DepositResponse(true, walletTransaction.Id, credits, moonPayUrl);
    }

    public async Task<bool> ConfirmDepositAsync(string moonPayTransactionId)
    {
        // Idempotency: check if already confirmed via ExternalId
        var alreadyConfirmed = await _context.WalletTransactions
            .AnyAsync(t => t.ExternalId == moonPayTransactionId && t.Status == TransactionStatus.Completed);

        if (alreadyConfirmed)
        {
            _logger.LogWarning("Duplicate webhook ignored: MoonPay TxId={MoonPayTxId}", moonPayTransactionId);
            return true; // Already processed, not an error
        }

        // Find the pending transaction matching this MoonPay external ID
        // MoonPay sends back our transactionId as externalTransactionId
        // We stored our Guid as the externalTransactionId in the MoonPay URL
        var pendingTx = await _context.WalletTransactions
            .FirstOrDefaultAsync(t => t.ExternalId == moonPayTransactionId && t.Status == TransactionStatus.Pending);

        // Fallback: try parsing as our internal transaction Guid
        if (pendingTx == null && Guid.TryParse(moonPayTransactionId, out var txGuid))
        {
            pendingTx = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.Id == txGuid && t.Status == TransactionStatus.Pending && t.Type == TransactionType.Deposit);
        }

        if (pendingTx == null)
        {
            _logger.LogWarning("No pending deposit found for MoonPay TxId={MoonPayTxId}", moonPayTransactionId);
            return false;
        }

        // Credit the wallet atomically
        await using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var wallet = await _context.Wallets
                .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"Id\" = {0} FOR UPDATE", pendingTx.WalletId)
                .FirstOrDefaultAsync();

            if (wallet == null)
            {
                _logger.LogError("Wallet not found for pending deposit TxId={TxId}", pendingTx.Id);
                return false;
            }

            wallet.BalanceCredits += pendingTx.AmountCredits;
            wallet.UpdatedAt = DateTime.UtcNow;

            pendingTx.Status = TransactionStatus.Completed;
            pendingTx.ExternalId = moonPayTransactionId;

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation(
                "Deposit confirmed: WalletId={WalletId}, Credits={Credits}, MoonPayTxId={MoonPayTxId}",
                wallet.Id, pendingTx.AmountCredits, moonPayTransactionId);

            return true;
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}

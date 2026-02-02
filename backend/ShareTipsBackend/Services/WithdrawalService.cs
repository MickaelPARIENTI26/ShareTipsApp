using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class WithdrawalService : IWithdrawalService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WithdrawalService> _logger;

    public WithdrawalService(ApplicationDbContext context, ILogger<WithdrawalService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<WithdrawalResultDto> CreateWithdrawalAsync(Guid userId, int amountCredits, string method)
    {
        if (amountCredits <= 0)
        {
            return new WithdrawalResultDto(false, "Amount must be positive", null, 0, 0);
        }

        if (!Enum.TryParse<WithdrawalMethod>(method, ignoreCase: true, out var withdrawalMethod))
        {
            return new WithdrawalResultDto(false, "Invalid withdrawal method", null, 0, 0);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Get wallet with lock
            var wallet = await _context.Wallets
                .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", userId)
                .Include(w => w.User)
                .FirstOrDefaultAsync();

            if (wallet == null)
            {
                return new WithdrawalResultDto(false, "Wallet not found", null, 0, 0);
            }

            // Check available credits
            if (wallet.BalanceCredits < amountCredits)
            {
                return new WithdrawalResultDto(
                    false,
                    "Insufficient credits",
                    null,
                    wallet.BalanceCredits,
                    wallet.LockedCredits
                );
            }

            // Move credits from balance to locked
            wallet.BalanceCredits -= amountCredits;
            wallet.LockedCredits += amountCredits;
            wallet.UpdatedAt = DateTime.UtcNow;

            // Create withdrawal request
            var withdrawal = new WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AmountCredits = amountCredits,
                Method = withdrawalMethod,
                Status = WithdrawalStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.WithdrawalRequests.Add(withdrawal);

            // Create transaction record
            var walletTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = TransactionType.WithdrawRequest,
                AmountCredits = -amountCredits,
                ReferenceId = withdrawal.Id,
                Status = TransactionStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.WalletTransactions.Add(walletTransaction);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var dto = new WithdrawalDto(
                withdrawal.Id,
                userId,
                wallet.User?.Username ?? "Unknown",
                amountCredits,
                withdrawal.Method.ToString(),
                withdrawal.Status.ToString(),
                withdrawal.AdminNotes,
                withdrawal.CreatedAt,
                withdrawal.ProcessedAt
            );

            return new WithdrawalResultDto(
                true,
                "Withdrawal request created",
                dto,
                wallet.BalanceCredits,
                wallet.LockedCredits
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Withdrawal creation failed: UserId={UserId}, Amount={Amount}", userId, amountCredits);
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<WithdrawalDto>> GetUserWithdrawalsAsync(Guid userId)
    {
        return await _context.WithdrawalRequests
            .Include(w => w.User)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WithdrawalDto(
                w.Id,
                w.UserId,
                w.User!.Username,
                w.AmountCredits,
                w.Method.ToString(),
                w.Status.ToString(),
                w.AdminNotes,
                w.CreatedAt,
                w.ProcessedAt
            ))
            .ToListAsync();
    }

    public async Task<IEnumerable<WithdrawalDto>> GetPendingWithdrawalsAsync()
    {
        return await _context.WithdrawalRequests
            .Include(w => w.User)
            .Where(w => w.Status == WithdrawalStatus.Pending)
            .OrderBy(w => w.CreatedAt)
            .Select(w => new WithdrawalDto(
                w.Id,
                w.UserId,
                w.User!.Username,
                w.AmountCredits,
                w.Method.ToString(),
                w.Status.ToString(),
                w.AdminNotes,
                w.CreatedAt,
                w.ProcessedAt
            ))
            .ToListAsync();
    }

    public async Task<WithdrawalResultDto> ProcessWithdrawalAsync(Guid withdrawalId, bool approve, string? adminNotes)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var withdrawal = await _context.WithdrawalRequests
                .Include(w => w.User)
                .FirstOrDefaultAsync(w => w.Id == withdrawalId);

            if (withdrawal == null)
            {
                return new WithdrawalResultDto(false, "Withdrawal request not found", null, 0, 0);
            }

            if (withdrawal.Status != WithdrawalStatus.Pending)
            {
                return new WithdrawalResultDto(false, "Withdrawal already processed", null, 0, 0);
            }

            // Get wallet with lock
            var wallet = await _context.Wallets
                .FromSqlRaw("SELECT * FROM \"Wallets\" WHERE \"UserId\" = {0} FOR UPDATE", withdrawal.UserId)
                .FirstOrDefaultAsync();

            if (wallet == null)
            {
                return new WithdrawalResultDto(false, "Wallet not found", null, 0, 0);
            }

            // Update withdrawal status
            withdrawal.Status = approve ? WithdrawalStatus.Approved : WithdrawalStatus.Rejected;
            withdrawal.AdminNotes = adminNotes;
            withdrawal.ProcessedAt = DateTime.UtcNow;

            // Update wallet transaction status
            var walletTransaction = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.ReferenceId == withdrawalId && t.Type == TransactionType.WithdrawRequest);

            if (walletTransaction != null)
            {
                walletTransaction.Status = approve ? TransactionStatus.Completed : TransactionStatus.Failed;
            }

            if (approve)
            {
                // Approved: Remove from locked credits (money will be sent externally)
                wallet.LockedCredits -= withdrawal.AmountCredits;
            }
            else
            {
                // Rejected: Return from locked to balance
                wallet.LockedCredits -= withdrawal.AmountCredits;
                wallet.BalanceCredits += withdrawal.AmountCredits;
            }
            wallet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var dto = new WithdrawalDto(
                withdrawal.Id,
                withdrawal.UserId,
                withdrawal.User?.Username ?? "Unknown",
                withdrawal.AmountCredits,
                withdrawal.Method.ToString(),
                withdrawal.Status.ToString(),
                withdrawal.AdminNotes,
                withdrawal.CreatedAt,
                withdrawal.ProcessedAt
            );

            return new WithdrawalResultDto(
                true,
                approve ? "Withdrawal approved" : "Withdrawal rejected",
                dto,
                wallet.BalanceCredits,
                wallet.LockedCredits
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Withdrawal processing failed: WithdrawalId={WithdrawalId}, Approve={Approve}", withdrawalId, approve);
            await transaction.RollbackAsync();
            throw;
        }
    }
}

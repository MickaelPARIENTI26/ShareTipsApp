using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
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

    public async Task<TipsterWalletDto?> GetTipsterWalletAsync(Guid userId)
    {
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null) return null;

        return new TipsterWalletDto(
            wallet.TipsterBalanceCents / 100m,
            wallet.PendingPayoutCents / 100m,
            wallet.TotalEarnedCents / 100m
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
            t.AmountCents / 100m,
            t.Status.ToString(),
            t.CreatedAt
        ));
    }
}

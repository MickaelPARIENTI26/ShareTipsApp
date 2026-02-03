using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IWalletService
{
    Task<TipsterWalletDto?> GetTipsterWalletAsync(Guid userId);
    Task<IEnumerable<WalletTransactionDto>> GetTransactionsAsync(Guid userId);
}

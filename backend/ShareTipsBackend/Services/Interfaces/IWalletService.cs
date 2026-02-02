using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IWalletService
{
    Task<WalletDto?> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<WalletTransactionDto>> GetTransactionsAsync(Guid userId);
    Task<WalletOperationResponse> CreditAsync(Guid userId, int amount, string? description = null);
    Task<WalletOperationResponse> DebitAsync(Guid userId, int amount, string? description = null);
    Task<DepositResponse> InitiateDepositAsync(Guid userId, decimal amountEur);
    Task<bool> ConfirmDepositAsync(string moonPayTransactionId);
}

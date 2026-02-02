using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IWithdrawalService
{
    Task<WithdrawalResultDto> CreateWithdrawalAsync(Guid userId, int amountCredits, string method);
    Task<IEnumerable<WithdrawalDto>> GetUserWithdrawalsAsync(Guid userId);
    Task<IEnumerable<WithdrawalDto>> GetPendingWithdrawalsAsync();
    Task<WithdrawalResultDto> ProcessWithdrawalAsync(Guid withdrawalId, bool approve, string? adminNotes);
}

namespace ShareTipsBackend.DTOs;

public record WithdrawalDto(
    Guid Id,
    Guid UserId,
    string Username,
    int AmountCredits,
    string Method,
    string Status,
    string? AdminNotes,
    DateTime CreatedAt,
    DateTime? ProcessedAt
);

public record CreateWithdrawalRequest(
    int AmountCredits,
    string Method
);

public record WithdrawalResultDto(
    bool Success,
    string? Message,
    WithdrawalDto? Withdrawal,
    int NewBalance,
    int NewLockedCredits
);

public record ProcessWithdrawalRequest(
    bool Approve,
    string? AdminNotes
);

namespace ShareTipsBackend.DTOs;

public record WithdrawalDto(
    Guid Id,
    Guid UserId,
    string Username,
    decimal AmountEur,
    string Method,
    string Status,
    string? AdminNotes,
    DateTime CreatedAt,
    DateTime? ProcessedAt
);

public record CreateWithdrawalRequest(
    decimal AmountEur,
    string Method
);

public record WithdrawalResultDto(
    bool Success,
    string? Message,
    WithdrawalDto? Withdrawal,
    decimal NewBalanceEur,
    decimal NewPendingPayoutEur
);

public record ProcessWithdrawalRequest(
    bool Approve,
    string? AdminNotes
);

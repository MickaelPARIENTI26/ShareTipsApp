namespace ShareTipsBackend.DTOs;

// Note: TipsterWalletDto is defined in StripeDto.cs

public record WalletTransactionDto(
    Guid Id,
    string Type,
    decimal AmountEur,
    string Status,
    DateTime CreatedAt
);

public record WalletOperationResponse(
    bool Success,
    decimal NewBalanceEur,
    string? Message = null
);

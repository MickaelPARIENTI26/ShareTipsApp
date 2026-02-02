using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

public record WalletDto(
    int Credits,
    int LockedCredits,
    int AvailableCredits
);

public record WalletTransactionDto(
    Guid Id,
    string Type,
    int AmountCredits,
    string Status,
    DateTime CreatedAt
);

public record CreditWalletRequest(
    [Required][Range(1, int.MaxValue)] int Amount,
    string? Description = null
);

public record DebitWalletRequest(
    [Required][Range(1, int.MaxValue)] int Amount,
    string? Description = null
);

public record WalletOperationResponse(
    bool Success,
    int NewBalance,
    string? Message = null
);

// --- MoonPay Deposit ---
public record DepositRequest(
    [Required][Range(1, 10000)] decimal AmountEur
);

public record DepositResponse(
    bool Success,
    Guid TransactionId,
    int CreditsToReceive,
    string? MoonPayUrl,
    string? Message = null
);

public record MoonPayWebhookPayload(
    string Type,
    MoonPayWebhookData Data
);

public record MoonPayWebhookData(
    string Id,
    string Status,
    string? ExternalTransactionId,
    decimal? BaseCurrencyAmount
);

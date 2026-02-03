namespace ShareTipsBackend.DTOs;

public record PurchaseDto(
    Guid Id,
    Guid TicketId,
    string TicketTitle,
    Guid SellerId,
    string SellerUsername,
    Guid BuyerId,
    string BuyerUsername,
    decimal PriceEur,
    decimal CommissionEur,
    decimal SellerEarningsEur,
    DateTime CreatedAt
);

public record PurchaseResultDto(
    bool Success,
    string? Message,
    PurchaseDto? Purchase,
    decimal NewBuyerBalanceEur
);

namespace ShareTipsBackend.DTOs;

public record PurchaseDto(
    Guid Id,
    Guid TicketId,
    string TicketTitle,
    Guid SellerId,
    string SellerUsername,
    Guid BuyerId,
    string BuyerUsername,
    int PriceCredits,
    int CommissionCredits,
    int SellerCredits,
    DateTime CreatedAt
);

public record PurchaseResultDto(
    bool Success,
    string? Message,
    PurchaseDto? Purchase,
    int NewBuyerBalance
);

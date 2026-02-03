using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IPurchaseService
{
    // Stripe-based purchase
    Task<PaymentIntentResultDto> InitiatePurchaseAsync(Guid buyerId, Guid ticketId);
    Task<PurchaseResultDto> ConfirmPurchaseAsync(Guid purchaseId);

    // Query methods
    Task<IEnumerable<PurchaseDto>> GetPurchasesByBuyerAsync(Guid buyerId);
    Task<PaginatedResult<PurchaseDto>> GetPurchasesByBuyerPaginatedAsync(Guid buyerId, int page, int pageSize);
    Task<IEnumerable<PurchaseDto>> GetSalesBySellerAsync(Guid sellerId);
}

using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IPurchaseService
{
    Task<PurchaseResultDto> PurchaseTicketAsync(Guid buyerId, Guid ticketId);
    Task<IEnumerable<PurchaseDto>> GetPurchasesByBuyerAsync(Guid buyerId);
    Task<PaginatedResult<PurchaseDto>> GetPurchasesByBuyerPaginatedAsync(Guid buyerId, int page, int pageSize);
    Task<IEnumerable<PurchaseDto>> GetSalesBySellerAsync(Guid sellerId);
}

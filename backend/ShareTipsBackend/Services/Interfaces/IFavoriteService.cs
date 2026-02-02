using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IFavoriteService
{
    Task<FavoriteResultDto> ToggleFavoriteAsync(Guid userId, Guid ticketId);
    Task<IEnumerable<FavoriteTicketDto>> GetMyFavoritesAsync(Guid userId);
    Task<PaginatedResult<FavoriteTicketDto>> GetMyFavoritesPaginatedAsync(Guid userId, int page, int pageSize);
    Task<bool> IsFavoritedAsync(Guid userId, Guid ticketId);
}

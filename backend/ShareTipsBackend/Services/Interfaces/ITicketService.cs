using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface ITicketService
{
    Task<TicketDto?> GetByIdAsync(Guid ticketId);
    Task<PaginatedResult<TicketDto>> GetByUserIdPaginatedAsync(Guid userId, int page, int pageSize);
    Task<PaginatedResult<TicketDto>> GetPublicTicketsPaginatedAsync(
        int page, int pageSize, string? sports, decimal? minOdds, decimal? maxOdds,
        int? minConfidence = null, int? maxConfidence = null,
        int? minSelections = null, int? maxSelections = null,
        Guid? followedByUserId = null, Guid? creatorId = null, string? sortBy = null,
        Guid? excludeUserId = null, Guid? currentUserId = null, string? ticketType = null);
    Task<TicketFilterMetaDto> GetFilterMetaAsync(Guid? excludeUserId = null);
    Task<TicketDto> CreateAsync(Guid creatorId, CreateTicketDto dto);
    Task<TicketDto?> UpdateAsync(Guid ticketId, Guid userId, UpdateTicketDto dto);
    Task<bool> DeleteAsync(Guid ticketId, Guid userId);
    Task LockTicketsBeforeMatchAsync();
    decimal CalculateAverageOdds(IEnumerable<decimal> odds);
}

using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class FavoriteService : IFavoriteService
{
    private readonly ApplicationDbContext _context;
    private readonly IGamificationService _gamificationService;

    public FavoriteService(ApplicationDbContext context, IGamificationService gamificationService)
    {
        _context = context;
        _gamificationService = gamificationService;
    }

    public async Task<FavoriteResultDto> ToggleFavoriteAsync(Guid userId, Guid ticketId)
    {
        var ticketExists = await _context.Tickets
            .AnyAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (!ticketExists)
            return new FavoriteResultDto(false, "Ticket not found");

        // Prevent favoriting own tickets
        var isOwnTicket = await _context.Tickets
            .AnyAsync(t => t.Id == ticketId && t.CreatorId == userId && t.DeletedAt == null);

        if (isOwnTicket)
            return new FavoriteResultDto(false, "Cannot favorite your own ticket");

        var existing = await _context.FavoriteTickets
            .FirstOrDefaultAsync(f => f.UserId == userId && f.TicketId == ticketId);

        if (existing != null)
        {
            _context.FavoriteTickets.Remove(existing);
            await _context.SaveChangesAsync();

            // Award negative XP for removing from favorites
            await _gamificationService.AwardXpAsync(
                userId,
                XpActionType.UnfavoriteTicket,
                "Retrait des favoris",
                ticketId);

            return new FavoriteResultDto(false, "Removed from favorites");
        }

        var favorite = new FavoriteTicket
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TicketId = ticketId,
            CreatedAt = DateTime.UtcNow
        };

        _context.FavoriteTickets.Add(favorite);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Race condition: another request already created the favorite
            // Re-fetch to check current state
            var nowExists = await _context.FavoriteTickets
                .AnyAsync(f => f.UserId == userId && f.TicketId == ticketId);
            return new FavoriteResultDto(nowExists, nowExists ? "Already in favorites" : "Failed to add");
        }

        // Award XP for adding to favorites
        await _gamificationService.AwardXpAsync(
            userId,
            XpActionType.FavoriteTicket,
            "Ticket ajouté aux favoris",
            ticketId);

        return new FavoriteResultDto(true, "Added to favorites");
    }

    public async Task<IEnumerable<FavoriteTicketDto>> GetMyFavoritesAsync(Guid userId)
    {
        var favorites = await _context.FavoriteTickets
            .Include(f => f.Ticket)
                .ThenInclude(t => t!.Creator)
            .Where(f => f.UserId == userId && f.Ticket!.DeletedAt == null)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return favorites.Select(MapToDto);
    }

    public async Task<PaginatedResult<FavoriteTicketDto>> GetMyFavoritesPaginatedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.FavoriteTickets
            .Include(f => f.Ticket)
                .ThenInclude(t => t!.Creator)
            .Where(f => f.UserId == userId && f.Ticket!.DeletedAt == null)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();

        var favorites = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = favorites.Select(MapToDto);

        return PaginatedResult<FavoriteTicketDto>.Create(dtos, page, pageSize, totalCount);
    }

    private static FavoriteTicketDto MapToDto(FavoriteTicket f)
    {
        return new FavoriteTicketDto(
            f.Id,
            f.TicketId,
            f.Ticket?.Title ?? "Unknown",
            f.Ticket?.CreatorId ?? Guid.Empty,
            f.Ticket?.Creator?.Username ?? "Unknown",
            f.Ticket?.IsPublic ?? true,
            (f.Ticket?.PriceCents ?? 0) / 100m, // Convert cents to EUR for DTO
            f.Ticket?.ConfidenceIndex ?? 0,
            f.Ticket?.AvgOdds ?? 0,
            f.Ticket?.Sports ?? Array.Empty<string>(),
            f.Ticket?.FirstMatchTime ?? DateTime.MinValue,
            f.Ticket?.LastMatchTime ?? f.Ticket?.FirstMatchTime ?? DateTime.MinValue,
            f.Ticket?.Status.ToString() ?? "Unknown",
            f.Ticket?.Result.ToString() ?? "Unknown",
            f.CreatedAt
        );
    }

    public async Task<bool> IsFavoritedAsync(Guid userId, Guid ticketId)
    {
        return await _context.FavoriteTickets
            .AnyAsync(f => f.UserId == userId && f.TicketId == ticketId);
    }
}

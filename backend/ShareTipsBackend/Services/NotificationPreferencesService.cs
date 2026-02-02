using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class NotificationPreferencesService : INotificationPreferencesService
{
    private readonly ApplicationDbContext _context;

    public NotificationPreferencesService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationPreferencesDto> GetByUserIdAsync(Guid userId)
    {
        var prefs = await GetOrCreateAsync(userId);
        return MapToDto(prefs);
    }

    public async Task<NotificationPreferencesDto> UpdateAsync(Guid userId, UpdateNotificationPreferencesDto dto)
    {
        var prefs = await GetOrCreateAsync(userId);

        prefs.NewTicket = dto.NewTicket;
        prefs.MatchStart = dto.MatchStart;
        prefs.TicketResult = dto.TicketResult;
        prefs.SubscriptionExpire = dto.SubscriptionExpire;
        prefs.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(prefs);
    }

    public async Task<NotificationPreferences> GetOrCreateAsync(Guid userId)
    {
        var prefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (prefs == null)
        {
            prefs = new NotificationPreferences
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                NewTicket = true,
                MatchStart = true,
                TicketResult = true,
                SubscriptionExpire = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.NotificationPreferences.Add(prefs);
            await _context.SaveChangesAsync();
        }

        return prefs;
    }

    public async Task<bool> IsEnabledAsync(Guid userId, NotificationType type)
    {
        var prefs = await _context.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        // Default to true if no preferences exist
        if (prefs == null)
            return true;

        return type switch
        {
            NotificationType.NewTicket => prefs.NewTicket,
            NotificationType.FollowNewTicket => prefs.NewTicket, // Same preference as NewTicket
            NotificationType.MatchStart => prefs.MatchStart,
            NotificationType.TicketWon => prefs.TicketResult,
            NotificationType.TicketLost => prefs.TicketResult,
            NotificationType.SubscriptionExpire => prefs.SubscriptionExpire,
            _ => true // Default enabled for unknown types
        };
    }

    private static NotificationPreferencesDto MapToDto(NotificationPreferences prefs) => new(
        prefs.NewTicket,
        prefs.MatchStart,
        prefs.TicketResult,
        prefs.SubscriptionExpire
    );
}

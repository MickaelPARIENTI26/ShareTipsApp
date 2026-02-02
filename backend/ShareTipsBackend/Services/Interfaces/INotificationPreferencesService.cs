using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface INotificationPreferencesService
{
    Task<NotificationPreferencesDto> GetByUserIdAsync(Guid userId);
    Task<NotificationPreferencesDto> UpdateAsync(Guid userId, UpdateNotificationPreferencesDto dto);
    Task<NotificationPreferences> GetOrCreateAsync(Guid userId);
    Task<bool> IsEnabledAsync(Guid userId, NotificationType type);
}

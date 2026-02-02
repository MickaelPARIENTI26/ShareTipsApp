using ShareTipsBackend.Common;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface INotificationService
{
    // --- Helper methods for easy notification creation ---
    Task NotifyUserAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        object? data = null);

    Task NotifyManyAsync(
        IEnumerable<Guid> userIds,
        NotificationType type,
        string title,
        string message,
        object? data = null);

    // --- CRUD operations ---
    Task<PaginatedResult<NotificationDto>> GetByUserIdPaginatedAsync(Guid userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<bool> MarkOneAsReadAsync(Guid userId, Guid notificationId);
    Task MarkAsReadAsync(Guid userId, Guid[] notificationIds);
    Task MarkAllAsReadAsync(Guid userId);
    Task<bool> DeleteAsync(Guid notificationId, Guid userId);
}

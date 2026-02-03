using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationPreferencesService _preferencesService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationService> _logger;

    // Configuration constants
    private const int BatchSize = 100;
    private static readonly TimeSpan DuplicateWindow = TimeSpan.FromMinutes(5);

    public NotificationService(
        ApplicationDbContext context,
        INotificationPreferencesService preferencesService,
        IServiceProvider serviceProvider,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _preferencesService = preferencesService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    // --- Helper methods ---

    public async Task NotifyUserAsync(
        Guid userId,
        NotificationType type,
        string title,
        string message,
        object? data = null)
    {
        var sw = Stopwatch.StartNew();

        // Check if user has enabled this notification type
        var isEnabled = await _preferencesService.IsEnabledAsync(userId, type);
        if (!isEnabled)
        {
            _logger.LogDebug("Notification {Type} skipped for user {UserId} - preference disabled", type, userId);
            return;
        }

        var dataJson = data != null ? JsonSerializer.Serialize(data) : null;

        // Anti-duplicate check
        if (await IsDuplicateAsync(userId, type, dataJson))
        {
            _logger.LogDebug("Duplicate notification {Type} skipped for user {UserId}", type, userId);
            return;
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            DataJson = dataJson,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send push notification (fire and forget with its own scope to avoid DbContext issues)
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var pushService = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();

                var pushData = new Dictionary<string, string>
                {
                    { "notificationId", notification.Id.ToString() },
                    { "type", type.ToString() }
                };
                if (data != null)
                {
                    pushData["data"] = JsonSerializer.Serialize(data);
                }
                await pushService.SendToUserAsync(userId, title, message, pushData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push notification for user {UserId}", userId);
            }
        });

        sw.Stop();
        _logger.LogInformation(
            "Notification {Type} created for user {UserId} in {ElapsedMs}ms",
            type, userId, sw.ElapsedMilliseconds);
    }

    public async Task NotifyManyAsync(
        IEnumerable<Guid> userIds,
        NotificationType type,
        string title,
        string message,
        object? data = null)
    {
        var sw = Stopwatch.StartNew();
        var dataJson = data != null ? JsonSerializer.Serialize(data) : null;
        var now = DateTime.UtcNow;

        var userIdList = userIds.ToList();
        var totalUsers = userIdList.Count;

        _logger.LogInformation(
            "NotifyManyAsync started: {Type} to {TotalUsers} users",
            type, totalUsers);

        // Filter users with enabled preferences (batched for efficiency)
        var enabledUserIds = await FilterEnabledUsersAsync(userIdList, type);

        _logger.LogDebug(
            "After preference filter: {EnabledCount}/{TotalCount} users",
            enabledUserIds.Count, totalUsers);

        // Anti-duplicate: Filter out users who already received this notification
        var nonDuplicateUserIds = await FilterNonDuplicatesAsync(enabledUserIds, type, dataJson);

        _logger.LogDebug(
            "After duplicate filter: {NonDuplicateCount}/{EnabledCount} users",
            nonDuplicateUserIds.Count, enabledUserIds.Count);

        if (nonDuplicateUserIds.Count == 0)
        {
            _logger.LogInformation("NotifyManyAsync completed: no notifications to send");
            return;
        }

        // Batch processing for large user sets
        var totalCreated = 0;
        var batches = nonDuplicateUserIds
            .Select((id, index) => new { id, index })
            .GroupBy(x => x.index / BatchSize)
            .Select(g => g.Select(x => x.id).ToList())
            .ToList();

        _logger.LogDebug("Processing {BatchCount} batches of up to {BatchSize} users", batches.Count, BatchSize);

        var allUserIdsToNotify = new List<Guid>();

        foreach (var batch in batches)
        {
            var notifications = batch.Select(userId => new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                DataJson = dataJson,
                IsRead = false,
                CreatedAt = now
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
            totalCreated += notifications.Count;
            allUserIdsToNotify.AddRange(batch);

            _logger.LogDebug("Batch saved: {BatchCount} notifications", notifications.Count);
        }

        // Send push notifications to all users (fire and forget with its own scope)
        if (allUserIdsToNotify.Count > 0)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var pushService = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();

                    var pushData = new Dictionary<string, string>
                    {
                        { "type", type.ToString() }
                    };
                    if (data != null)
                    {
                        pushData["data"] = JsonSerializer.Serialize(data);
                    }
                    await pushService.SendToUsersAsync(allUserIdsToNotify, title, message, pushData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send batch push notifications");
                }
            });
        }

        sw.Stop();
        _logger.LogInformation(
            "NotifyManyAsync completed: {TotalCreated} notifications created for {Type} in {ElapsedMs}ms",
            totalCreated, type, sw.ElapsedMilliseconds);
    }

    /// <summary>
    /// Check if a similar notification was sent to this user recently (within DuplicateWindow)
    /// </summary>
    private async Task<bool> IsDuplicateAsync(Guid userId, NotificationType type, string? dataJson)
    {
        var cutoff = DateTime.UtcNow.Subtract(DuplicateWindow);

        return await _context.Notifications.AnyAsync(n =>
            n.UserId == userId &&
            n.Type == type &&
            n.DataJson == dataJson &&
            n.CreatedAt >= cutoff);
    }

    /// <summary>
    /// Filter users who have enabled the notification type (single batch query - fixes N+1)
    /// </summary>
    private async Task<List<Guid>> FilterEnabledUsersAsync(List<Guid> userIds, NotificationType type)
    {
        if (userIds.Count == 0)
            return userIds;

        // Single query to get all preferences for these users (fixes N+1 issue)
        var preferences = await _context.NotificationPreferences
            .Where(p => userIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, p => p);

        var enabledUserIds = new List<Guid>();

        foreach (var userId in userIds)
        {
            // If no preference exists, default to enabled
            if (!preferences.TryGetValue(userId, out var prefs))
            {
                enabledUserIds.Add(userId);
                continue;
            }

            // Check if this notification type is enabled based on preference
            var isEnabled = type switch
            {
                NotificationType.NewTicket => prefs.NewTicket,
                NotificationType.FollowNewTicket => prefs.NewTicket,
                NotificationType.MatchStart => prefs.MatchStart,
                NotificationType.TicketWon => prefs.TicketResult,
                NotificationType.TicketLost => prefs.TicketResult,
                NotificationType.SubscriptionExpire => prefs.SubscriptionExpire,
                _ => true
            };

            if (isEnabled)
                enabledUserIds.Add(userId);
        }

        return enabledUserIds;
    }

    /// <summary>
    /// Filter out users who already received this notification (anti-duplicate)
    /// </summary>
    private async Task<List<Guid>> FilterNonDuplicatesAsync(List<Guid> userIds, NotificationType type, string? dataJson)
    {
        if (userIds.Count == 0)
            return userIds;

        var cutoff = DateTime.UtcNow.Subtract(DuplicateWindow);

        // Find users who already have this notification
        var usersWithDuplicate = await _context.Notifications
            .Where(n =>
                userIds.Contains(n.UserId) &&
                n.Type == type &&
                n.DataJson == dataJson &&
                n.CreatedAt >= cutoff)
            .Select(n => n.UserId)
            .Distinct()
            .ToListAsync();

        var duplicateSet = usersWithDuplicate.ToHashSet();

        return userIds.Where(id => !duplicateSet.Contains(id)).ToList();
    }

    // --- CRUD operations ---

    public async Task<PaginatedResult<NotificationDto>> GetByUserIdPaginatedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        var totalCount = await query.CountAsync();

        // Order by: unread first, then by date descending
        var notifications = await query
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        _logger.LogDebug(
            "Retrieved page {Page} of notifications for user {UserId}: {Count}/{Total}",
            page, userId, notifications.Count, totalCount);

        var dtos = notifications.Select(MapToDto);
        return PaginatedResult<NotificationDto>.Create(dtos, page, pageSize, totalCount);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        _logger.LogDebug("Unread count for user {UserId}: {Count}", userId, count);
        return count;
    }

    public async Task<bool> MarkOneAsReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
        {
            _logger.LogDebug("Notification {NotificationId} not found for user {UserId}", notificationId, userId);
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
            _logger.LogDebug("Notification {NotificationId} marked as read", notificationId);
        }

        return true;
    }

    public async Task MarkAsReadAsync(Guid userId, Guid[] notificationIds)
    {
        var count = await _context.Notifications
            .Where(n => n.UserId == userId && notificationIds.Contains(n.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

        _logger.LogDebug("Marked {Count} notifications as read for user {UserId}", count, userId);
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var count = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

        _logger.LogInformation("Marked all {Count} notifications as read for user {UserId}", count, userId);
    }

    public async Task<bool> DeleteAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
        {
            _logger.LogDebug("Delete failed: notification {NotificationId} not found for user {UserId}", notificationId, userId);
            return false;
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Notification {NotificationId} deleted by user {UserId}", notificationId, userId);
        return true;
    }

    private static NotificationDto MapToDto(Notification n) => new(
        n.Id,
        n.UserId,
        n.Type.ToString(),
        n.Title,
        n.Message,
        n.DataJson,
        n.IsRead,
        n.CreatedAt
    );
}

using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.BackgroundServices;

public class SubscriptionExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionExpirationService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public SubscriptionExpirationService(IServiceProvider serviceProvider, ILogger<SubscriptionExpirationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Subscription Expiration Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendExpirationNotificationsAsync();
                await ExpireSubscriptionsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing subscription expirations");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Subscription Expiration Service stopped");
    }

    private async Task SendExpirationNotificationsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        // Get active subscriptions with their tipster and subscriber info
        var activeSubscriptions = await context.Subscriptions
            .Include(s => s.Tipster)
            .Include(s => s.Subscriber)
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate > now)
            .ToListAsync();

        foreach (var subscription in activeSubscriptions)
        {
            var tipsterName = subscription.Tipster?.Username ?? "un tipster";
            var subscriberEmail = subscription.Subscriber?.Email;
            var subscriberName = subscription.Subscriber?.Username ?? "Utilisateur";
            var daysUntilExpiration = (subscription.EndDate - now).TotalDays;

            // J-3 notification (between 2 and 3 days before expiration)
            if (!subscription.NotifiedExpiringJ3 && daysUntilExpiration <= 3 && daysUntilExpiration > 2)
            {
                await notificationService.NotifyUserAsync(
                    subscription.SubscriberId,
                    NotificationType.SubscriptionExpire,
                    "Abonnement expire bientôt",
                    $"Votre abonnement à {tipsterName} expire dans 3 jours",
                    new { subscriptionId = subscription.Id, tipsterId = subscription.TipsterId, daysRemaining = 3 });

                // Send email notification
                if (!string.IsNullOrEmpty(subscriberEmail))
                {
                    try
                    {
                        await emailService.SendSubscriptionExpiringEmailAsync(subscriberEmail, subscriberName, tipsterName, 3);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send J-3 expiration email for subscription {SubscriptionId}", subscription.Id);
                    }
                }

                subscription.NotifiedExpiringJ3 = true;
                _logger.LogInformation("Sent J-3 expiration notification for subscription {SubscriptionId}", subscription.Id);
            }

            // J-1 notification (between 0 and 1 day before expiration)
            if (!subscription.NotifiedExpiringJ1 && daysUntilExpiration <= 1 && daysUntilExpiration > 0)
            {
                await notificationService.NotifyUserAsync(
                    subscription.SubscriberId,
                    NotificationType.SubscriptionExpire,
                    "Abonnement expire demain",
                    $"Votre abonnement à {tipsterName} expire demain",
                    new { subscriptionId = subscription.Id, tipsterId = subscription.TipsterId, daysRemaining = 1 });

                // Send email notification
                if (!string.IsNullOrEmpty(subscriberEmail))
                {
                    try
                    {
                        await emailService.SendSubscriptionExpiringEmailAsync(subscriberEmail, subscriberName, tipsterName, 1);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send J-1 expiration email for subscription {SubscriptionId}", subscription.Id);
                    }
                }

                subscription.NotifiedExpiringJ1 = true;
                _logger.LogInformation("Sent J-1 expiration notification for subscription {SubscriptionId}", subscription.Id);
            }
        }

        await context.SaveChangesAsync();
    }

    private async Task ExpireSubscriptionsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;

        // Get subscriptions that need to be expired
        var subscriptionsToExpire = await context.Subscriptions
            .Include(s => s.Tipster)
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate <= now)
            .ToListAsync();

        foreach (var subscription in subscriptionsToExpire)
        {
            // Mark as expired
            subscription.Status = SubscriptionStatus.Expired;

            // Send expired notification if not already sent
            if (!subscription.NotifiedExpired)
            {
                var tipsterName = subscription.Tipster?.Username ?? "un tipster";

                await notificationService.NotifyUserAsync(
                    subscription.SubscriberId,
                    NotificationType.SubscriptionExpire,
                    "Abonnement expiré",
                    $"Votre abonnement à {tipsterName} a expiré",
                    new { subscriptionId = subscription.Id, tipsterId = subscription.TipsterId, expired = true });

                subscription.NotifiedExpired = true;
                _logger.LogInformation("Sent expiration notification for subscription {SubscriptionId}", subscription.Id);
            }
        }

        if (subscriptionsToExpire.Count > 0)
        {
            await context.SaveChangesAsync();
            _logger.LogInformation("Expired {Count} subscriptions", subscriptionsToExpire.Count);
        }
    }
}

using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface ISubscriptionService
{
    Task<SubscriptionResultDto> SubscribeAsync(Guid subscriberId, Guid tipsterId, int priceCredits);
    Task<SubscriptionResultDto> SubscribeWithPlanAsync(Guid subscriberId, Guid planId);
    Task<bool> UnsubscribeAsync(Guid subscriberId, Guid tipsterId);
    Task<IEnumerable<SubscriptionDto>> GetMySubscriptionsAsync(Guid userId);
    Task<IEnumerable<SubscriptionDto>> GetMySubscribersAsync(Guid tipsterId);
    Task<bool> HasActiveSubscriptionAsync(Guid subscriberId, Guid tipsterId);
    Task<SubscriptionStatusDto> GetSubscriptionStatusAsync(Guid subscriberId, Guid tipsterId);
    Task<int> ExpireSubscriptionsAsync();
}

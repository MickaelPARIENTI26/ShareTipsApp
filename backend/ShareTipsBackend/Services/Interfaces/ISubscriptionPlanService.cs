using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface ISubscriptionPlanService
{
    Task<IEnumerable<SubscriptionPlanDto>> GetByTipsterIdAsync(Guid tipsterUserId);
    Task<IEnumerable<SubscriptionPlanDto>> GetActiveByTipsterIdAsync(Guid tipsterUserId);
    Task<SubscriptionPlanDto?> GetByIdAsync(Guid id);
    Task<SubscriptionPlanDto> CreateAsync(Guid tipsterUserId, CreateSubscriptionPlanRequest request);
    Task<SubscriptionPlanDto?> UpdateAsync(Guid id, Guid tipsterUserId, UpdateSubscriptionPlanRequest request);
    Task<bool> DeleteAsync(Guid id, Guid tipsterUserId);
}

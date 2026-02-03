using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class SubscriptionPlanService : ISubscriptionPlanService
{
    private readonly ApplicationDbContext _context;

    public SubscriptionPlanService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SubscriptionPlanDto>> GetByTipsterIdAsync(Guid tipsterUserId)
    {
        var plans = await _context.SubscriptionPlans
            .Where(p => p.TipsterUserId == tipsterUserId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return plans.Select(MapToDto);
    }

    public async Task<IEnumerable<SubscriptionPlanDto>> GetActiveByTipsterIdAsync(Guid tipsterUserId)
    {
        var plans = await _context.SubscriptionPlans
            .Where(p => p.TipsterUserId == tipsterUserId && p.IsActive)
            .OrderBy(p => p.PriceCents)
            .ToListAsync();

        return plans.Select(MapToDto);
    }

    public async Task<SubscriptionPlanDto?> GetByIdAsync(Guid id)
    {
        var plan = await _context.SubscriptionPlans.FindAsync(id);
        return plan == null ? null : MapToDto(plan);
    }

    public async Task<SubscriptionPlanDto> CreateAsync(Guid tipsterUserId, CreateSubscriptionPlanRequest request)
    {
        var plan = new SubscriptionPlan
        {
            Id = Guid.NewGuid(),
            TipsterUserId = tipsterUserId,
            Title = request.Title,
            Description = request.Description,
            DurationInDays = request.DurationInDays,
            PriceCents = (int)(request.PriceEur * 100),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.SubscriptionPlans.Add(plan);
        await _context.SaveChangesAsync();

        return MapToDto(plan);
    }

    public async Task<SubscriptionPlanDto?> UpdateAsync(Guid id, Guid tipsterUserId, UpdateSubscriptionPlanRequest request)
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.TipsterUserId == tipsterUserId);

        if (plan == null)
            return null;

        if (request.Title != null)
            plan.Title = request.Title;

        if (request.Description != null)
            plan.Description = request.Description;

        if (request.DurationInDays.HasValue)
            plan.DurationInDays = request.DurationInDays.Value;

        if (request.PriceEur.HasValue)
            plan.PriceCents = (int)(request.PriceEur.Value * 100);

        if (request.IsActive.HasValue)
            plan.IsActive = request.IsActive.Value;

        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(plan);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tipsterUserId)
    {
        var plan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(p => p.Id == id && p.TipsterUserId == tipsterUserId);

        if (plan == null)
            return false;

        _context.SubscriptionPlans.Remove(plan);
        await _context.SaveChangesAsync();

        return true;
    }

    private static SubscriptionPlanDto MapToDto(SubscriptionPlan plan)
    {
        return new SubscriptionPlanDto(
            plan.Id,
            plan.TipsterUserId,
            plan.Title,
            plan.Description,
            plan.DurationInDays,
            plan.PriceCents / 100m, // Convert cents to EUR for DTO
            plan.IsActive,
            plan.CreatedAt,
            plan.UpdatedAt
        );
    }
}

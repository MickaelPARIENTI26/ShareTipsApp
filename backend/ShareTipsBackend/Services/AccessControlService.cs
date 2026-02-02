using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

/// <summary>
/// Centralized service for checking user access to protected resources.
/// All access checks go through this service for consistent security enforcement.
/// </summary>
public class AccessControlService : IAccessControlService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AccessControlService> _logger;

    public AccessControlService(
        ApplicationDbContext context,
        ILogger<AccessControlService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AccessCheckResult> CanAccessPrivateContentAsync(Guid userId, Guid tipsterId)
    {
        // Owner always has access
        if (userId == tipsterId)
        {
            return new AccessCheckResult(true, AccessType.Owner);
        }

        // Check for active subscription
        var hasSubscription = await HasActiveSubscriptionAsync(userId, tipsterId);
        if (hasSubscription)
        {
            return new AccessCheckResult(true, AccessType.Subscription);
        }

        _logger.LogDebug(
            "Access denied for user {UserId} to tipster {TipsterId} private content - no subscription",
            userId, tipsterId);

        return new AccessCheckResult(false, AccessType.None, "No active subscription");
    }

    public async Task<AccessCheckResult> CanAccessTicketAsync(Guid userId, Guid ticketId)
    {
        var ticket = await _context.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (ticket == null)
        {
            return new AccessCheckResult(false, AccessType.None, "Ticket not found");
        }

        // Public tickets are accessible to everyone
        if (ticket.IsPublic)
        {
            return new AccessCheckResult(true, AccessType.Public);
        }

        // Creator always has access
        if (ticket.CreatorId == userId)
        {
            return new AccessCheckResult(true, AccessType.Owner);
        }

        // Check if user has purchased this specific ticket
        var hasPurchased = await HasPurchasedTicketAsync(userId, ticketId);
        if (hasPurchased)
        {
            return new AccessCheckResult(true, AccessType.Purchase);
        }

        // Check if user has active subscription to the ticket creator
        var hasSubscription = await HasActiveSubscriptionAsync(userId, ticket.CreatorId);
        if (hasSubscription)
        {
            return new AccessCheckResult(true, AccessType.Subscription);
        }

        _logger.LogDebug(
            "Access denied for user {UserId} to ticket {TicketId} - no purchase or subscription",
            userId, ticketId);

        return new AccessCheckResult(false, AccessType.None, "No access to this private ticket");
    }

    public async Task<bool> HasActiveSubscriptionAsync(Guid userId, Guid tipsterId)
    {
        var now = DateTime.UtcNow;

        return await _context.Subscriptions
            .AsNoTracking()
            .AnyAsync(s =>
                s.SubscriberId == userId &&
                s.TipsterId == tipsterId &&
                s.Status == SubscriptionStatus.Active &&
                s.EndDate > now);
    }

    public async Task<bool> HasPurchasedTicketAsync(Guid userId, Guid ticketId)
    {
        return await _context.TicketPurchases
            .AsNoTracking()
            .AnyAsync(p => p.BuyerId == userId && p.TicketId == ticketId);
    }
}

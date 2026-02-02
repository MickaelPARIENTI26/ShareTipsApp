namespace ShareTipsBackend.Services.Interfaces;

/// <summary>
/// Centralized service for checking user access to protected resources.
/// Designed to be extended for Stripe and other payment providers.
/// </summary>
public interface IAccessControlService
{
    /// <summary>
    /// Check if a user can access a tipster's private content.
    /// Returns true if: user is the tipster, has active subscription, or has purchased the specific ticket.
    /// </summary>
    Task<AccessCheckResult> CanAccessPrivateContentAsync(Guid userId, Guid tipsterId);

    /// <summary>
    /// Check if a user can access a specific ticket.
    /// Returns true if: ticket is public, user is creator, user has subscription, or user has purchased it.
    /// </summary>
    Task<AccessCheckResult> CanAccessTicketAsync(Guid userId, Guid ticketId);

    /// <summary>
    /// Check if a user has an active subscription to a tipster.
    /// </summary>
    Task<bool> HasActiveSubscriptionAsync(Guid userId, Guid tipsterId);

    /// <summary>
    /// Check if a user has purchased a specific ticket.
    /// </summary>
    Task<bool> HasPurchasedTicketAsync(Guid userId, Guid ticketId);
}

/// <summary>
/// Result of an access check with detailed information.
/// </summary>
public record AccessCheckResult(
    bool HasAccess,
    AccessType AccessType,
    string? Reason = null
);

/// <summary>
/// Type of access granted.
/// </summary>
public enum AccessType
{
    None,
    Owner,
    Subscription,
    Purchase,
    Public
}

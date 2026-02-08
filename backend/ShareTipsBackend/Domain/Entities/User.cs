using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsVerified { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Password reset (token is stored as SHA256 hash)
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    // Stripe Connect
    public string? StripeAccountId { get; set; }
    public StripeOnboardingStatus StripeOnboardingStatus { get; set; } = StripeOnboardingStatus.None;

    // Navigation
    public Wallet? Wallet { get; set; }
    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public ICollection<TicketPurchase> Purchases { get; set; } = new List<TicketPurchase>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Subscription> Subscribers { get; set; } = new List<Subscription>();
    public ICollection<WithdrawalRequest> WithdrawalRequests { get; set; } = new List<WithdrawalRequest>();
    public ICollection<FavoriteTicket> FavoriteTickets { get; set; } = new List<FavoriteTicket>();
    public ICollection<UserFollow> Following { get; set; } = new List<UserFollow>();
    public ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public NotificationPreferences? NotificationPreferences { get; set; }
    public ICollection<SubscriptionPlan> SubscriptionPlans { get; set; } = new List<SubscriptionPlan>();
    public ICollection<UserConsent> Consents { get; set; } = new List<UserConsent>();
    public ICollection<DeviceToken> DeviceTokens { get; set; } = new List<DeviceToken>();
    public UserGamification? Gamification { get; set; }
}

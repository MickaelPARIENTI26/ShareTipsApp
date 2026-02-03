namespace ShareTipsBackend.Domain.Entities;

public class Wallet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // EUR cents for tipster earnings (Stripe Connect)
    public int TipsterBalanceCents { get; set; }
    public int PendingPayoutCents { get; set; }
    public int TotalEarnedCents { get; set; }

    // Legacy credits system (kept for backward compatibility during migration)
    public int BalanceCredits { get; set; }
    public int LockedCredits { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}

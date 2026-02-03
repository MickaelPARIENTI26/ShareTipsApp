namespace ShareTipsBackend.Domain.Entities;

public class WalletTransaction
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public TransactionType Type { get; set; }
    public int AmountCents { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ExternalId { get; set; }
    public TransactionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Wallet? Wallet { get; set; }
}

namespace ShareTipsBackend.Domain.Entities;

public class WithdrawalRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int AmountCents { get; set; }
    public WithdrawalMethod Method { get; set; }
    public WithdrawalStatus Status { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }

    // Navigation
    public User? User { get; set; }
}

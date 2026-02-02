namespace ShareTipsBackend.Domain.Entities;

public class Market
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public MarketType Type { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal? Line { get; set; } // For Over/Under markets (e.g., 2.5)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Match? Match { get; set; }
    public ICollection<MarketSelection> Selections { get; set; } = new List<MarketSelection>();
}

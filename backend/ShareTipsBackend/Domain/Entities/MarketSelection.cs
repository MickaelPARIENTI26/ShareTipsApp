namespace ShareTipsBackend.Domain.Entities;

public class MarketSelection
{
    public Guid Id { get; set; }
    public Guid MarketId { get; set; }
    public string Code { get; set; } = string.Empty; // HOME_WIN, DRAW, AWAY_WIN, OVER, UNDER
    public string Label { get; set; } = string.Empty; // "Victoire domicile", "Match nul", etc.
    public decimal Odds { get; set; }
    public Guid? PlayerId { get; set; } // For player-specific markets (goalscorer, etc.)
    public bool IsActive { get; set; } = true;

    // Navigation
    public Market? Market { get; set; }
    public Player? Player { get; set; }
}

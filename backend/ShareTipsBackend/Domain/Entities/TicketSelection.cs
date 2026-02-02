namespace ShareTipsBackend.Domain.Entities;

public class TicketSelection
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid MatchId { get; set; }
    public string MarketType { get; set; } = string.Empty;
    public string SelectionLabel { get; set; } = string.Empty;
    public decimal Odds { get; set; }
    public string? PlayerName { get; set; }
    public string? MatchLabel { get; set; }
    public string? LeagueName { get; set; }

    // Navigation
    public Ticket? Ticket { get; set; }
}

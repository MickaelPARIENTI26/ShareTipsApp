namespace ShareTipsBackend.Domain.Entities;

public class League
{
    public Guid Id { get; set; }
    public string SportCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? ExternalKey { get; set; } // The Odds API sport_key (e.g., soccer_france_ligue_one)
    public bool IsActive { get; set; } = true;

    // Navigation
    public Sport? Sport { get; set; }
    public ICollection<Match> Matches { get; set; } = new List<Match>();
}

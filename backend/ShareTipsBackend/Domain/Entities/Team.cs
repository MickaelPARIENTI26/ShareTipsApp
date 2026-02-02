namespace ShareTipsBackend.Domain.Entities;

public class Team
{
    public Guid Id { get; set; }
    public string SportCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string? LogoUrl { get; set; }
    public string? Country { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Sport? Sport { get; set; }
    public ICollection<Player> Players { get; set; } = new List<Player>();
}

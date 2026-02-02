namespace ShareTipsBackend.Domain.Entities;

public class Sport
{
    public string Code { get; set; } = string.Empty; // PK: FOOTBALL, BASKETBALL, TENNIS, ESPORT
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<League> Leagues { get; set; } = new List<League>();
    public ICollection<Team> Teams { get; set; } = new List<Team>();
}

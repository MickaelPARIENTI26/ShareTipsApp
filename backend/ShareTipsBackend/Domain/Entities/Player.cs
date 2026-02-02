namespace ShareTipsBackend.Domain.Entities;

public class Player
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Position { get; set; }
    public int? JerseyNumber { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Team? Team { get; set; }
}

namespace ShareTipsBackend.Domain.Entities;

public class Match
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; } // ID from external API
    public string SportCode { get; set; } = string.Empty;
    public Guid LeagueId { get; set; }
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }
    public DateTime StartTime { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Scheduled;
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public League? League { get; set; }
    public Team? HomeTeam { get; set; }
    public Team? AwayTeam { get; set; }
    public ICollection<Market> Markets { get; set; } = new List<Market>();
}

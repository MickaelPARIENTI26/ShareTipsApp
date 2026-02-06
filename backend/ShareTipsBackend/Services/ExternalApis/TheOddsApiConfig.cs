namespace ShareTipsBackend.Services.ExternalApis;

public class TheOddsApiConfig
{
    public const string SectionName = "TheOddsApi";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.the-odds-api.com";
    public string Region { get; set; } = "eu";
    /// <summary>
    /// Primary bookmaker to use. Example: "winamax_fr"
    /// </summary>
    public string? Bookmakers { get; set; }
    /// <summary>
    /// Fallback bookmaker if primary has no odds. Example: "parionssport_fr"
    /// </summary>
    public string? FallbackBookmaker { get; set; }
    public string OddsFormat { get; set; } = "decimal";
    public string DateFormat { get; set; } = "iso";

    /// <summary>
    /// Leagues to sync (The Odds API sport_key)
    /// </summary>
    public List<string> EnabledSportKeys { get; set; } = new();

    /// <summary>
    /// Football/Soccer markets (btts, draw_no_bet, double_chance are football-only)
    /// </summary>
    public List<string> FootballMarkets { get; set; } = new();

    /// <summary>
    /// Basketball markets (no draws, no BTTS)
    /// </summary>
    public List<string> BasketballMarkets { get; set; } = new();

    /// <summary>
    /// Football player props (goalscorers, shots, cards)
    /// </summary>
    public List<string> FootballPlayerProps { get; set; } = new();

    /// <summary>
    /// Basketball player props (points, rebounds, threes)
    /// </summary>
    public List<string> BasketballPlayerProps { get; set; } = new();

    /// <summary>
    /// Get markets for a specific sport key
    /// </summary>
    public List<string> GetMarketsForSport(string sportKey)
    {
        if (sportKey.StartsWith("basketball"))
            return BasketballMarkets;
        if (sportKey.StartsWith("soccer"))
            return FootballMarkets;
        // Default to football markets for unknown sports
        return FootballMarkets;
    }

    /// <summary>
    /// Get player props for a specific sport key
    /// </summary>
    public List<string> GetPlayerPropsForSport(string sportKey)
    {
        if (sportKey.StartsWith("basketball"))
            return BasketballPlayerProps;
        if (sportKey.StartsWith("soccer"))
            return FootballPlayerProps;
        return FootballPlayerProps;
    }

    /// <summary>
    /// Whether to sync player props for a sport
    /// </summary>
    public bool SyncPlayerPropsForSport(string sportKey)
    {
        return GetPlayerPropsForSport(sportKey).Count > 0;
    }

    // Backwards compatibility - returns all unique markets
    public List<string> EnabledMarkets => FootballMarkets.Union(BasketballMarkets).ToList();
    public List<string> EnabledPlayerProps => FootballPlayerProps.Union(BasketballPlayerProps).ToList();
}

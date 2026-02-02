namespace ShareTipsBackend.Services.ExternalApis;

public class TheOddsApiConfig
{
    public const string SectionName = "TheOddsApi";

    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.the-odds-api.com";
    public string Region { get; set; } = "eu";
    public string OddsFormat { get; set; } = "decimal";
    public string DateFormat { get; set; } = "iso";

    /// <summary>
    /// European leagues to sync (The Odds API sport_key)
    /// </summary>
    public List<string> EnabledSportKeys { get; set; } = new();

    /// <summary>
    /// Markets to fetch (each market costs 1 API credit per region)
    /// </summary>
    public List<string> EnabledMarkets { get; set; } = new();
}

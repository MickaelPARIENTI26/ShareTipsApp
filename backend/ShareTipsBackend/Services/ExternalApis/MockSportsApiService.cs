namespace ShareTipsBackend.Services.ExternalApis;

/// <summary>
/// Mock implementation of ISportsApiService for development/testing
/// Replace with actual API provider (TheOddsAPI, API-Football, etc.) when ready
/// </summary>
public class MockSportsApiService : ISportsApiService
{
    public Task<IEnumerable<ExternalMatchData>> GetUpcomingMatchesAsync(string sportCode, int days = 7)
    {
        // Mock data - replace with actual API call
        var matches = new List<ExternalMatchData>();

        if (sportCode == "FOOTBALL")
        {
            var baseDate = DateTime.UtcNow.AddDays(1);
            matches.Add(new ExternalMatchData(
                ExternalId: "ext_001",
                SportCode: "FOOTBALL",
                LeagueName: "Ligue 1",
                HomeTeamName: "Paris Saint-Germain",
                AwayTeamName: "Olympique de Marseille",
                StartTime: baseDate.AddHours(20)
            ));
            matches.Add(new ExternalMatchData(
                ExternalId: "ext_002",
                SportCode: "FOOTBALL",
                LeagueName: "Ligue 1",
                HomeTeamName: "Olympique Lyonnais",
                AwayTeamName: "AS Monaco",
                StartTime: baseDate.AddDays(1).AddHours(15)
            ));
        }

        return Task.FromResult<IEnumerable<ExternalMatchData>>(matches);
    }

    public Task<IEnumerable<ExternalMarketData>> GetMatchOddsAsync(string externalMatchId)
    {
        // Mock odds data
        var markets = new List<ExternalMarketData>
        {
            new ExternalMarketData(
                MarketType: "MatchResult",
                Label: "Résultat du match",
                Line: null,
                Selections: new List<ExternalSelectionData>
                {
                    new("1", "Victoire domicile", 1.85m),
                    new("X", "Match nul", 3.40m),
                    new("2", "Victoire extérieur", 4.20m)
                }
            ),
            new ExternalMarketData(
                MarketType: "OverUnder",
                Label: "Plus/Moins de buts",
                Line: 2.5m,
                Selections: new List<ExternalSelectionData>
                {
                    new("OVER", "Plus de 2.5", 1.90m),
                    new("UNDER", "Moins de 2.5", 1.95m)
                }
            )
        };

        return Task.FromResult<IEnumerable<ExternalMarketData>>(markets);
    }

    public Task<IEnumerable<ExternalScoreData>> GetLiveScoresAsync(string sportCode)
    {
        // Return empty for mock - no live matches
        return Task.FromResult<IEnumerable<ExternalScoreData>>(new List<ExternalScoreData>());
    }
}

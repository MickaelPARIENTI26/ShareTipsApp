namespace ShareTipsBackend.Domain.Entities;

public enum MarketType
{
    MatchResult,      // 1X2
    OverUnder,        // Over/Under goals
    BothTeamsScore,   // Both Teams to Score
    CorrectScore,     // Exact score
    FirstGoalscorer,  // First player to score
    AnytimeGoalscorer,// Any goalscorer
    HalfTimeResult,   // Half-time result
    DoubleChance,     // 1X, X2, 12
    DrawNoBet,        // Draw No Bet
    Handicap          // Asian Handicap
}

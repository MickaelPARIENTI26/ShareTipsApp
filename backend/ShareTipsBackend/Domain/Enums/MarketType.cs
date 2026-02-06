namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// All market types supported by The Odds API
/// </summary>
public enum MarketType
{
    // ═══════════════════════════════════════════════════════════════
    // STANDARD MARKETS (Football/Soccer)
    // ═══════════════════════════════════════════════════════════════

    // Match Result (1X2) - h2h, h2h_3_way
    MatchResult,

    // Over/Under Goals - totals, totals_alternate
    OverUnder,
    OverUnderAlternate,     // Alternate lines (0.5, 1.5, 2.5, 3.5, 4.5, etc.)

    // Handicap/Spreads - spreads, spreads_alternate
    Handicap,
    HandicapAlternate,      // Alternate handicap lines

    // Both Teams to Score - btts
    BothTeamsScore,

    // Draw No Bet - draw_no_bet
    DrawNoBet,

    // Double Chance - double_chance (1X, X2, 12)
    DoubleChance,

    // ═══════════════════════════════════════════════════════════════
    // CORRECT SCORE & SPECIAL MARKETS
    // ═══════════════════════════════════════════════════════════════

    CorrectScore,           // Exact final score
    HalfTimeResult,         // 1X2 at half-time
    HalfTimeFullTime,       // Combined HT/FT result

    // ═══════════════════════════════════════════════════════════════
    // PLAYER PROPS - GOALSCORERS (player_props)
    // ═══════════════════════════════════════════════════════════════

    FirstGoalscorer,        // player_goal_scorer_first
    LastGoalscorer,         // player_goal_scorer_last
    AnytimeGoalscorer,      // player_goal_scorer_anytime
    PlayerToScore2Plus,     // Player to score 2+ goals
    PlayerToScore3Plus,     // Player to score 3+ (hat-trick)

    // ═══════════════════════════════════════════════════════════════
    // PLAYER PROPS - SHOTS (player_props)
    // ═══════════════════════════════════════════════════════════════

    PlayerShotsOnTarget,    // player_shots_on_target
    PlayerTotalShots,       // player_total_shots

    // ═══════════════════════════════════════════════════════════════
    // PLAYER PROPS - CARDS & FOULS (player_props)
    // ═══════════════════════════════════════════════════════════════

    PlayerToBeBooked,       // Player to receive yellow card
    PlayerToBeRedCarded,    // Player to receive red card
    PlayerFoulsCommitted,   // Over/under fouls

    // ═══════════════════════════════════════════════════════════════
    // PLAYER PROPS - ASSISTS (player_props)
    // ═══════════════════════════════════════════════════════════════

    PlayerAssists,          // player_assists
    PlayerToAssist,         // Player to make an assist

    // ═══════════════════════════════════════════════════════════════
    // TEAM PROPS
    // ═══════════════════════════════════════════════════════════════

    TeamTotalGoals,         // Team over/under goals
    TeamCleanSheet,         // Team to keep clean sheet
    TeamToScoreFirst,       // Which team scores first
    TeamToScoreLast,        // Which team scores last
    TeamToScoreBothHalves,  // Team to score in both halves

    // ═══════════════════════════════════════════════════════════════
    // CORNERS MARKETS
    // ═══════════════════════════════════════════════════════════════

    TotalCorners,           // Over/under corners
    TeamCorners,            // Team over/under corners
    CornerHandicap,         // Corner handicap/spread
    FirstCorner,            // Team to win first corner

    // ═══════════════════════════════════════════════════════════════
    // CARDS MARKETS
    // ═══════════════════════════════════════════════════════════════

    TotalCards,             // Over/under total cards
    TeamCards,              // Team over/under cards
    FirstCard,              // Team to receive first card

    // ═══════════════════════════════════════════════════════════════
    // BASKETBALL SPECIFIC
    // ═══════════════════════════════════════════════════════════════

    // Standard
    MoneyLine,              // h2h (no draw) - equivalent to MatchResult for 2-way
    PointSpread,            // spreads (basketball spreads)
    TotalPoints,            // totals (over/under total points)

    // Player Props - Points
    PlayerPoints,           // player_points
    PlayerPointsAlternate,  // player_points_alternate

    // Player Props - Rebounds
    PlayerRebounds,         // player_rebounds
    PlayerReboundsAlternate,

    // Player Props - Assists
    PlayerAssistsBasketball,// player_assists (basketball)
    PlayerAssistsAlternate,

    // Player Props - Combined
    PlayerPointsReboundsAssists, // PRA combined
    PlayerPointsRebounds,   // Points + Rebounds
    PlayerPointsAssists,    // Points + Assists
    PlayerReboundsAssists,  // Rebounds + Assists

    // Player Props - Other
    PlayerThrees,           // player_threes (3-pointers made)
    PlayerSteals,           // player_steals
    PlayerBlocks,           // player_blocks
    PlayerTurnovers,        // player_turnovers
    PlayerDoubleDouble,     // Double-double
    PlayerTripleDouble,     // Triple-double

    // Team Props
    TeamTotalPoints,        // Team over/under points
    FirstTeamToScore,       // Which team scores first (basketball)

    // Quarter/Half Markets
    FirstQuarterSpread,
    FirstQuarterTotal,
    FirstHalfSpread,
    FirstHalfTotal,
    SecondHalfSpread,
    SecondHalfTotal,

    // ═══════════════════════════════════════════════════════════════
    // OUTRIGHTS / FUTURES
    // ═══════════════════════════════════════════════════════════════

    Outright,               // Tournament/league winner
    TopScorer,              // Top goalscorer
    Relegation,             // Team to be relegated

    // ═══════════════════════════════════════════════════════════════
    // LAY MARKETS (Betting Exchanges)
    // ═══════════════════════════════════════════════════════════════

    MatchResultLay,         // h2h_lay - Lay bet on match result

    // ═══════════════════════════════════════════════════════════════
    // FALLBACK
    // ═══════════════════════════════════════════════════════════════

    Other                   // Any unrecognized market type
}

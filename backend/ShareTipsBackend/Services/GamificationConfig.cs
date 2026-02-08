using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Services;

/// <summary>
/// Configuration for gamification system (XP values, level thresholds)
/// 50 levels with exponential progression curve
/// </summary>
public static class GamificationConfig
{
    /// <summary>
    /// XP required to reach each level (index = level - 1)
    /// Exponential curve: each level requires progressively more XP
    /// </summary>
    public static readonly int[] LevelThresholds = new[]
    {
        0,        // Level 1: 0 XP (starting point)
        50,       // Level 2: 50 XP
        120,      // Level 3: 120 XP
        200,      // Level 4: 200 XP
        300,      // Level 5: 300 XP
        420,      // Level 6: 420 XP
        560,      // Level 7: 560 XP
        720,      // Level 8: 720 XP
        900,      // Level 9: 900 XP
        1100,     // Level 10: 1100 XP
        1350,     // Level 11: 1350 XP
        1650,     // Level 12: 1650 XP
        2000,     // Level 13: 2000 XP
        2400,     // Level 14: 2400 XP
        2900,     // Level 15: 2900 XP
        3500,     // Level 16: 3500 XP
        4200,     // Level 17: 4200 XP
        5000,     // Level 18: 5000 XP
        6000,     // Level 19: 6000 XP
        7200,     // Level 20: 7200 XP
        8600,     // Level 21: 8600 XP
        10200,    // Level 22: 10200 XP
        12000,    // Level 23: 12000 XP
        14000,    // Level 24: 14000 XP
        16500,    // Level 25: 16500 XP
        19500,    // Level 26: 19500 XP
        23000,    // Level 27: 23000 XP
        27000,    // Level 28: 27000 XP
        32000,    // Level 29: 32000 XP
        38000,    // Level 30: 38000 XP
        45000,    // Level 31: 45000 XP
        53000,    // Level 32: 53000 XP
        62000,    // Level 33: 62000 XP
        73000,    // Level 34: 73000 XP
        86000,    // Level 35: 86000 XP
        100000,   // Level 36: 100000 XP
        120000,   // Level 37: 120000 XP
        145000,   // Level 38: 145000 XP
        175000,   // Level 39: 175000 XP
        210000,   // Level 40: 210000 XP
        255000,   // Level 41: 255000 XP
        310000,   // Level 42: 310000 XP
        380000,   // Level 43: 380000 XP
        460000,   // Level 44: 460000 XP
        560000,   // Level 45: 560000 XP
        680000,   // Level 46: 680000 XP
        830000,   // Level 47: 830000 XP
        1000000,  // Level 48: 1000000 XP (1M!)
        1250000,  // Level 49: 1250000 XP
        1600000,  // Level 50: 1600000 XP (max level - legendary)
    };

    public const int MaxLevel = 50;

    /// <summary>
    /// Level names/titles - 50 unique names with progression
    /// </summary>
    public static readonly string[] LevelNames = new[]
    {
        "Débutant",           // Level 1
        "Novice",             // Level 2
        "Initié",             // Level 3
        "Apprenti",           // Level 4
        "Amateur",            // Level 5
        "Régulier",           // Level 6
        "Confirmé",           // Level 7
        "Compétent",          // Level 8
        "Expérimenté",        // Level 9
        "Avancé",             // Level 10
        "Expert",             // Level 11
        "Spécialiste",        // Level 12
        "Maître",             // Level 13
        "Grand Maître",       // Level 14
        "Stratège",           // Level 15
        "Tacticien",          // Level 16
        "Visionnaire",        // Level 17
        "Champion",           // Level 18
        "Super Champion",     // Level 19
        "Élite",              // Level 20
        "Virtuose",           // Level 21
        "Prodige",            // Level 22
        "Génie",              // Level 23
        "Phénomène",          // Level 24
        "Titan",              // Level 25
        "Colosse",            // Level 26
        "Héros",              // Level 27
        "Super Héros",        // Level 28
        "Demi-Dieu",          // Level 29
        "Dieu",               // Level 30
        "Mythique",           // Level 31
        "Épique",             // Level 32
        "Légendaire",         // Level 33
        "Immortel",           // Level 34
        "Éternel",            // Level 35
        "Transcendant",       // Level 36
        "Cosmique",           // Level 37
        "Galactique",         // Level 38
        "Universel",          // Level 39
        "Omniscient",         // Level 40
        "Suprême",            // Level 41
        "Divin",              // Level 42
        "Céleste",            // Level 43
        "Astral",             // Level 44
        "Primordial",         // Level 45
        "Alpha",              // Level 46
        "Omega",              // Level 47
        "Absolu",             // Level 48
        "Ultime",             // Level 49
        "GOAT",               // Level 50 (Greatest Of All Time)
    };

    /// <summary>
    /// XP awarded for each action type
    /// </summary>
    public static readonly Dictionary<XpActionType, int> XpPerAction = new()
    {
        // ═══════════════════════════════════════════════════════════════
        // DAILY ACTIONS
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.DailyLogin, 10 },              // +10 XP par jour
        { XpActionType.DailyLoginStreak, 2 },         // +2 XP par jour de streak (bonus)

        // ═══════════════════════════════════════════════════════════════
        // TIPSTER ACTIONS
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.CreateTicket, 15 },            // +15 XP
        { XpActionType.SellTicket, 30 },              // +30 XP par vente
        { XpActionType.TicketWin, 25 },               // +25 XP par win
        { XpActionType.TicketLose, -10 },             // -10 XP par lose
        { XpActionType.TicketWinStreak, 10 },         // +10 XP bonus par win streak
        { XpActionType.GainSubscriber, 40 },          // +40 XP
        { XpActionType.LoseSubscriber, -15 },         // -15 XP
        { XpActionType.EarnMoney, 1 },                // +1 XP par euro gagné

        // ═══════════════════════════════════════════════════════════════
        // BUYER ACTIONS
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.PurchaseTicket, 15 },          // +15 XP
        { XpActionType.Subscribe, 25 },               // +25 XP par abonnement
        { XpActionType.Unsubscribe, -5 },             // -5 XP
        { XpActionType.WinPurchasedTicket, 20 },      // +20 XP (ticket acheté qui gagne)

        // ═══════════════════════════════════════════════════════════════
        // ENGAGEMENT ACTIONS
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.FollowUser, 8 },               // +8 XP
        { XpActionType.UnfollowUser, -3 },            // -3 XP
        { XpActionType.FavoriteTicket, 5 },           // +5 XP
        { XpActionType.UnfavoriteTicket, -2 },        // -2 XP
        { XpActionType.ShareTicket, 10 },             // +10 XP
        { XpActionType.ViewTicket, 1 },               // +1 XP (max 10/jour)
        { XpActionType.ViewProfile, 1 },              // +1 XP (max 5/jour)

        // ═══════════════════════════════════════════════════════════════
        // ACHIEVEMENTS
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.EarnBadge, 0 },                // Valeur définie par le badge
        { XpActionType.LevelUp, 50 },                 // +50 XP bonus par level up
        { XpActionType.CompleteProfile, 100 },        // +100 XP (one-time)
        { XpActionType.FirstAction, 30 },             // +30 XP (première action)

        // ═══════════════════════════════════════════════════════════════
        // BONUSES
        // ═══════════════════════════════════════════════════════════════
        { XpActionType.WeeklyBonus, 75 },             // +75 XP bonus hebdo
        { XpActionType.MonthlyBonus, 200 },           // +200 XP bonus mensuel
        { XpActionType.ReferralBonus, 150 },          // +150 XP par parrainage
    };

    /// <summary>
    /// Badge XP rewards by rarity/category
    /// </summary>
    public static readonly Dictionary<BadgeType, int> BadgeXpRewards = new()
    {
        // Tipster badges - Ventes (progressive)
        { BadgeType.FirstTicketSold, 25 },
        { BadgeType.TenTicketsSold, 50 },
        { BadgeType.TwentyFiveTicketsSold, 100 },
        { BadgeType.FiftyTicketsSold, 200 },
        { BadgeType.HundredTicketsSold, 400 },
        { BadgeType.TwoHundredFiftyTicketsSold, 750 },
        { BadgeType.FiveHundredTicketsSold, 1200 },
        { BadgeType.ThousandTicketsSold, 2000 },

        // Tipster badges - Création
        { BadgeType.FirstTicketCreated, 20 },
        { BadgeType.TenTicketsCreated, 40 },
        { BadgeType.FiftyTicketsCreated, 100 },
        { BadgeType.HundredTicketsCreated, 250 },
        { BadgeType.FiveHundredTicketsCreated, 800 },

        // Wins
        { BadgeType.FirstWin, 30 },
        { BadgeType.TenWins, 60 },
        { BadgeType.FiftyWins, 150 },
        { BadgeType.HundredWins, 350 },

        // Win Streaks (very valuable)
        { BadgeType.WinStreak3, 50 },
        { BadgeType.WinStreak5, 100 },
        { BadgeType.WinStreak7, 200 },
        { BadgeType.WinStreak10, 400 },
        { BadgeType.WinStreak15, 750 },
        { BadgeType.WinStreak20, 1500 },

        // Win Rates
        { BadgeType.WinRate50, 75 },
        { BadgeType.WinRate60, 150 },
        { BadgeType.WinRate70, 300 },
        { BadgeType.WinRate80, 600 },
        { BadgeType.WinRate90, 1200 },

        // ROI
        { BadgeType.RoiPositive, 50 },
        { BadgeType.Roi5Percent, 100 },
        { BadgeType.Roi10Percent, 200 },
        { BadgeType.Roi20Percent, 400 },
        { BadgeType.Roi50Percent, 1000 },

        // Abonnés
        { BadgeType.FirstSubscriber, 30 },
        { BadgeType.FiveSubscribers, 60 },
        { BadgeType.TenSubscribers, 100 },
        { BadgeType.TwentyFiveSubscribers, 200 },
        { BadgeType.FiftySubscribers, 400 },
        { BadgeType.HundredSubscribers, 750 },
        { BadgeType.TwoHundredFiftySubscribers, 1200 },
        { BadgeType.FiveHundredSubscribers, 2000 },
        { BadgeType.ThousandSubscribers, 3500 },

        // Gains
        { BadgeType.FirstEuroEarned, 25 },
        { BadgeType.TenEurosEarned, 50 },
        { BadgeType.FiftyEurosEarned, 100 },
        { BadgeType.HundredEurosEarned, 200 },
        { BadgeType.FiveHundredEurosEarned, 500 },
        { BadgeType.ThousandEurosEarned, 1000 },

        // Buyer - Achats
        { BadgeType.FirstPurchase, 20 },
        { BadgeType.FivePurchases, 40 },
        { BadgeType.TenPurchases, 75 },
        { BadgeType.TwentyFivePurchases, 150 },
        { BadgeType.FiftyPurchases, 300 },
        { BadgeType.HundredPurchases, 600 },

        // Buyer - Abonnements
        { BadgeType.FirstSubscription, 25 },
        { BadgeType.ThreeSubscriptions, 50 },
        { BadgeType.FiveSubscriptions, 100 },
        { BadgeType.TenSubscriptions, 250 },

        // Engagement - Follows
        { BadgeType.FirstFollow, 15 },
        { BadgeType.FiveFollows, 30 },
        { BadgeType.TenFollows, 50 },
        { BadgeType.TwentyFiveFollows, 100 },
        { BadgeType.FiftyFollows, 200 },

        // Engagement - Favoris
        { BadgeType.FirstFavorite, 10 },
        { BadgeType.FiveFavorites, 25 },
        { BadgeType.TenFavorites, 50 },
        { BadgeType.TwentyFiveFavorites, 100 },
        { BadgeType.FiftyFavorites, 200 },

        // Daily Streaks (very valuable!)
        { BadgeType.DailyStreak3, 30 },
        { BadgeType.DailyStreak7, 75 },
        { BadgeType.DailyStreak14, 150 },
        { BadgeType.DailyStreak30, 350 },
        { BadgeType.DailyStreak60, 700 },
        { BadgeType.DailyStreak100, 1200 },
        { BadgeType.DailyStreak365, 5000 },

        // Level badges
        { BadgeType.Level5, 50 },
        { BadgeType.Level10, 100 },
        { BadgeType.Level15, 200 },
        { BadgeType.Level20, 400 },
        { BadgeType.Level25, 600 },
        { BadgeType.Level30, 1000 },
        { BadgeType.Level40, 2000 },
        { BadgeType.Level50, 5000 },

        // XP badges
        { BadgeType.Xp1000, 50 },
        { BadgeType.Xp5000, 100 },
        { BadgeType.Xp10000, 200 },
        { BadgeType.Xp25000, 400 },
        { BadgeType.Xp50000, 750 },
        { BadgeType.Xp100000, 1500 },

        // Sports experts
        { BadgeType.FootballExpert, 300 },
        { BadgeType.BasketballExpert, 300 },
        { BadgeType.TennisExpert, 300 },
        { BadgeType.EsportExpert, 300 },
        { BadgeType.MultiSportMaster, 500 },

        // Special badges
        { BadgeType.EarlyAdopter, 200 },
        { BadgeType.BetaTester, 300 },
        { BadgeType.TopTipsterDaily, 100 },
        { BadgeType.TopTipsterWeekly, 250 },
        { BadgeType.TopTipsterMonthly, 500 },
        { BadgeType.TopTipsterAllTime, 2000 },
        { BadgeType.Verified, 150 },
        { BadgeType.Premium, 200 },
        { BadgeType.Ambassador, 500 },
        { BadgeType.Influencer, 750 },
        { BadgeType.Legend, 3000 },

        // Seasonal/Event
        { BadgeType.NewYear2024, 100 },
        { BadgeType.NewYear2025, 100 },
        { BadgeType.WorldCup2026, 250 },
        { BadgeType.ChampionsLeague, 150 },
        { BadgeType.SuperBowl, 150 },

        // Fun/Rare badges
        { BadgeType.NightOwl, 75 },
        { BadgeType.EarlyBird, 75 },
        { BadgeType.WeekendWarrior, 100 },
        { BadgeType.Perfectionist, 500 },
        { BadgeType.Comeback, 100 },
        { BadgeType.Generous, 200 },
        { BadgeType.HighRoller, 150 },
        { BadgeType.LuckyNumber7, 77 },
        { BadgeType.Centurion, 200 },
    };

    /// <summary>
    /// Get XP amount for an action
    /// </summary>
    public static int GetXpForAction(XpActionType action)
    {
        return XpPerAction.TryGetValue(action, out var xp) ? xp : 0;
    }

    /// <summary>
    /// Get XP reward for earning a badge
    /// </summary>
    public static int GetBadgeXpReward(BadgeType badge)
    {
        return BadgeXpRewards.TryGetValue(badge, out var xp) ? xp : 25; // Default 25 XP
    }

    /// <summary>
    /// Get level for given total XP
    /// </summary>
    public static int GetLevelForXp(int totalXp)
    {
        for (int i = LevelThresholds.Length - 1; i >= 0; i--)
        {
            if (totalXp >= LevelThresholds[i])
            {
                return i + 1;
            }
        }
        return 1;
    }

    /// <summary>
    /// Get XP required for next level
    /// </summary>
    public static int GetXpForNextLevel(int currentLevel)
    {
        if (currentLevel >= MaxLevel)
            return LevelThresholds[MaxLevel - 1];

        return LevelThresholds[currentLevel]; // currentLevel is 1-indexed, array is 0-indexed
    }

    /// <summary>
    /// Get level name
    /// </summary>
    public static string GetLevelName(int level)
    {
        var index = Math.Clamp(level - 1, 0, LevelNames.Length - 1);
        return LevelNames[index];
    }

    /// <summary>
    /// Calculate progress percentage to next level
    /// </summary>
    public static int GetProgressPercentage(int totalXp, int currentLevel)
    {
        if (currentLevel >= MaxLevel)
            return 100;

        var currentThreshold = LevelThresholds[currentLevel - 1];
        var nextThreshold = LevelThresholds[currentLevel];
        var xpInCurrentLevel = totalXp - currentThreshold;
        var xpNeededForLevel = nextThreshold - currentThreshold;

        if (xpNeededForLevel <= 0) return 100;

        return Math.Clamp((int)((xpInCurrentLevel * 100.0) / xpNeededForLevel), 0, 100);
    }
}

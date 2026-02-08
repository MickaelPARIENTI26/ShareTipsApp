namespace ShareTipsBackend.Domain.Enums;

/// <summary>
/// Types of badges available in the system (60+ badges)
/// </summary>
public enum BadgeType
{
    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - Ventes
    // ═══════════════════════════════════════════════════════════════
    FirstTicketSold,        // 1 vente
    TenTicketsSold,         // 10 ventes
    TwentyFiveTicketsSold,  // 25 ventes
    FiftyTicketsSold,       // 50 ventes
    HundredTicketsSold,     // 100 ventes
    TwoHundredFiftyTicketsSold, // 250 ventes
    FiveHundredTicketsSold, // 500 ventes
    ThousandTicketsSold,    // 1000 ventes

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - Création de tickets
    // ═══════════════════════════════════════════════════════════════
    FirstTicketCreated,     // 1 ticket créé
    TenTicketsCreated,      // 10 tickets
    FiftyTicketsCreated,    // 50 tickets
    HundredTicketsCreated,  // 100 tickets
    FiveHundredTicketsCreated, // 500 tickets

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - Wins & Performance
    // ═══════════════════════════════════════════════════════════════
    FirstWin,               // 1er win
    TenWins,                // 10 wins
    FiftyWins,              // 50 wins
    HundredWins,            // 100 wins
    WinStreak3,             // 3 wins consécutifs
    WinStreak5,             // 5 wins consécutifs
    WinStreak7,             // 7 wins consécutifs
    WinStreak10,            // 10 wins consécutifs
    WinStreak15,            // 15 wins consécutifs
    WinStreak20,            // 20 wins consécutifs
    WinRate50,              // 50% winrate (min 10 tickets)
    WinRate60,              // 60% winrate (min 20 tickets)
    WinRate70,              // 70% winrate (min 30 tickets)
    WinRate80,              // 80% winrate (min 50 tickets)
    WinRate90,              // 90% winrate (min 100 tickets)

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - ROI
    // ═══════════════════════════════════════════════════════════════
    RoiPositive,            // ROI > 0%
    Roi5Percent,            // ROI > 5%
    Roi10Percent,           // ROI > 10%
    Roi20Percent,           // ROI > 20%
    Roi50Percent,           // ROI > 50%

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - Abonnés
    // ═══════════════════════════════════════════════════════════════
    FirstSubscriber,        // 1 abonné
    FiveSubscribers,        // 5 abonnés
    TenSubscribers,         // 10 abonnés
    TwentyFiveSubscribers,  // 25 abonnés
    FiftySubscribers,       // 50 abonnés
    HundredSubscribers,     // 100 abonnés
    TwoHundredFiftySubscribers, // 250 abonnés
    FiveHundredSubscribers, // 500 abonnés
    ThousandSubscribers,    // 1000 abonnés

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER BADGES - Gains
    // ═══════════════════════════════════════════════════════════════
    FirstEuroEarned,        // 1€ gagné
    TenEurosEarned,         // 10€ gagnés
    FiftyEurosEarned,       // 50€ gagnés
    HundredEurosEarned,     // 100€ gagnés
    FiveHundredEurosEarned, // 500€ gagnés
    ThousandEurosEarned,    // 1000€ gagnés

    // ═══════════════════════════════════════════════════════════════
    // BUYER BADGES - Achats
    // ═══════════════════════════════════════════════════════════════
    FirstPurchase,          // 1 achat
    FivePurchases,          // 5 achats
    TenPurchases,           // 10 achats
    TwentyFivePurchases,    // 25 achats
    FiftyPurchases,         // 50 achats
    HundredPurchases,       // 100 achats

    // ═══════════════════════════════════════════════════════════════
    // BUYER BADGES - Abonnements
    // ═══════════════════════════════════════════════════════════════
    FirstSubscription,      // 1 abonnement
    ThreeSubscriptions,     // 3 abonnements
    FiveSubscriptions,      // 5 abonnements
    TenSubscriptions,       // 10 abonnements

    // ═══════════════════════════════════════════════════════════════
    // ENGAGEMENT BADGES - Follows
    // ═══════════════════════════════════════════════════════════════
    FirstFollow,            // 1 follow
    FiveFollows,            // 5 follows
    TenFollows,             // 10 follows
    TwentyFiveFollows,      // 25 follows
    FiftyFollows,           // 50 follows

    // ═══════════════════════════════════════════════════════════════
    // ENGAGEMENT BADGES - Favoris
    // ═══════════════════════════════════════════════════════════════
    FirstFavorite,          // 1 favori
    FiveFavorites,          // 5 favoris
    TenFavorites,           // 10 favoris
    TwentyFiveFavorites,    // 25 favoris
    FiftyFavorites,         // 50 favoris

    // ═══════════════════════════════════════════════════════════════
    // ENGAGEMENT BADGES - Streaks quotidiennes
    // ═══════════════════════════════════════════════════════════════
    DailyStreak3,           // 3 jours
    DailyStreak7,           // 7 jours
    DailyStreak14,          // 14 jours
    DailyStreak30,          // 30 jours
    DailyStreak60,          // 60 jours
    DailyStreak100,         // 100 jours
    DailyStreak365,         // 365 jours (1 an!)

    // ═══════════════════════════════════════════════════════════════
    // LEVEL BADGES
    // ═══════════════════════════════════════════════════════════════
    Level5,                 // Niveau 5
    Level10,                // Niveau 10
    Level15,                // Niveau 15
    Level20,                // Niveau 20
    Level25,                // Niveau 25
    Level30,                // Niveau 30
    Level40,                // Niveau 40
    Level50,                // Niveau 50 (max)

    // ═══════════════════════════════════════════════════════════════
    // XP BADGES
    // ═══════════════════════════════════════════════════════════════
    Xp1000,                 // 1000 XP total
    Xp5000,                 // 5000 XP
    Xp10000,                // 10 000 XP
    Xp25000,                // 25 000 XP
    Xp50000,                // 50 000 XP
    Xp100000,               // 100 000 XP

    // ═══════════════════════════════════════════════════════════════
    // SPORTS BADGES
    // ═══════════════════════════════════════════════════════════════
    FootballExpert,         // 50+ tickets football gagnants
    BasketballExpert,       // 50+ tickets basketball gagnants
    TennisExpert,           // 50+ tickets tennis gagnants
    EsportExpert,           // 50+ tickets esport gagnants
    MultiSportMaster,       // Wins dans 4+ sports différents

    // ═══════════════════════════════════════════════════════════════
    // SPECIAL BADGES
    // ═══════════════════════════════════════════════════════════════
    EarlyAdopter,           // Parmi les premiers utilisateurs
    BetaTester,             // Testeur beta
    TopTipsterDaily,        // Top 10 du jour
    TopTipsterWeekly,       // Top 10 de la semaine
    TopTipsterMonthly,      // Top 10 du mois
    TopTipsterAllTime,      // Top 10 all-time
    Verified,               // Compte vérifié
    Premium,                // Utilisateur premium
    Ambassador,             // Ambassadeur
    Influencer,             // 1000+ followers
    Legend,                 // Badge légendaire (attribution manuelle)

    // ═══════════════════════════════════════════════════════════════
    // SEASONAL / EVENT BADGES
    // ═══════════════════════════════════════════════════════════════
    NewYear2024,            // Nouvel an 2024
    NewYear2025,            // Nouvel an 2025
    WorldCup2026,           // Coupe du monde 2026
    ChampionsLeague,        // Event Champions League
    SuperBowl,              // Event Super Bowl

    // ═══════════════════════════════════════════════════════════════
    // FUN / RARE BADGES
    // ═══════════════════════════════════════════════════════════════
    NightOwl,               // Actif entre minuit et 5h
    EarlyBird,              // Actif entre 5h et 7h
    WeekendWarrior,         // Très actif le weekend
    Perfectionist,          // 100% winrate sur 10+ tickets
    Comeback,               // Revenu après 30+ jours d'absence
    Generous,               // Partagé 50+ tickets
    HighRoller,             // Ticket à 50€+
    LuckyNumber7,           // 7 wins à la suite
    Centurion,              // 100 de quelque chose (niveau, wins, etc.)
}

/// <summary>
/// Actions that award XP
/// </summary>
public enum XpActionType
{
    // ═══════════════════════════════════════════════════════════════
    // DAILY ACTIONS
    // ═══════════════════════════════════════════════════════════════
    DailyLogin,             // +5 XP par jour
    DailyLoginStreak,       // Bonus streak (+1 XP par jour de streak)

    // ═══════════════════════════════════════════════════════════════
    // TIPSTER ACTIONS
    // ═══════════════════════════════════════════════════════════════
    CreateTicket,           // +10 XP
    SellTicket,             // +20 XP
    TicketWin,              // +15 XP
    TicketLose,             // -5 XP
    TicketWinStreak,        // Bonus win streak
    GainSubscriber,         // +25 XP
    LoseSubscriber,         // -10 XP
    EarnMoney,              // +1 XP par euro gagné

    // ═══════════════════════════════════════════════════════════════
    // BUYER ACTIONS
    // ═══════════════════════════════════════════════════════════════
    PurchaseTicket,         // +10 XP
    Subscribe,              // +15 XP
    Unsubscribe,            // -5 XP
    WinPurchasedTicket,     // +10 XP (ticket acheté qui gagne)

    // ═══════════════════════════════════════════════════════════════
    // ENGAGEMENT ACTIONS
    // ═══════════════════════════════════════════════════════════════
    FollowUser,             // +5 XP
    UnfollowUser,           // -2 XP
    FavoriteTicket,         // +3 XP
    UnfavoriteTicket,       // -1 XP
    ShareTicket,            // +5 XP
    ViewTicket,             // +1 XP (max 10/jour)
    ViewProfile,            // +1 XP (max 5/jour)

    // ═══════════════════════════════════════════════════════════════
    // ACHIEVEMENTS
    // ═══════════════════════════════════════════════════════════════
    EarnBadge,              // XP selon le badge
    LevelUp,                // +25 XP bonus
    CompleteProfile,        // +50 XP (one-time)
    FirstAction,            // +20 XP (première action)

    // ═══════════════════════════════════════════════════════════════
    // BONUSES
    // ═══════════════════════════════════════════════════════════════
    WeeklyBonus,            // Bonus hebdomadaire
    MonthlyBonus,           // Bonus mensuel
    ReferralBonus,          // Parrainage
}

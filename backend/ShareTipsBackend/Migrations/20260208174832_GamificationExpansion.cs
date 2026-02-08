using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShareTipsBackend.Migrations
{
    /// <inheritdoc />
    public partial class GamificationExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Badges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    XpReward = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Badges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserGamifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    CurrentXp = table.Column<int>(type: "integer", nullable: false),
                    TotalXpEarned = table.Column<int>(type: "integer", nullable: false),
                    CurrentDailyStreak = table.Column<int>(type: "integer", nullable: false),
                    LongestDailyStreak = table.Column<int>(type: "integer", nullable: false),
                    LastLoginDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentWinStreak = table.Column<int>(type: "integer", nullable: false),
                    LongestWinStreak = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserGamifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserGamifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserBadges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserGamificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    BadgeId = table.Column<Guid>(type: "uuid", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBadges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBadges_Badges_BadgeId",
                        column: x => x.BadgeId,
                        principalTable: "Badges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserBadges_UserGamifications_UserGamificationId",
                        column: x => x.UserGamificationId,
                        principalTable: "UserGamifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "XpTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserGamificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionType = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XpTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_XpTransactions_UserGamifications_UserGamificationId",
                        column: x => x.UserGamificationId,
                        principalTable: "UserGamifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Badges",
                columns: new[] { "Id", "Color", "Description", "Icon", "IsActive", "Name", "Type", "XpReward" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0001-000000000001"), "#34C759", "Vendre votre premier ticket", "cart", true, "Première Vente", "FirstTicketSold", 25 },
                    { new Guid("10000000-0000-0000-0001-000000000002"), "#CD7F32", "Vendre 10 tickets", "trending-up", true, "Vendeur Bronze", "TenTicketsSold", 50 },
                    { new Guid("10000000-0000-0000-0001-000000000003"), "#C0C0C0", "Vendre 25 tickets", "trending-up", true, "Vendeur Confirmé", "TwentyFiveTicketsSold", 100 },
                    { new Guid("10000000-0000-0000-0001-000000000004"), "#A8A8A8", "Vendre 50 tickets", "trending-up", true, "Vendeur Argent", "FiftyTicketsSold", 200 },
                    { new Guid("10000000-0000-0000-0001-000000000005"), "#FFD700", "Vendre 100 tickets", "trending-up", true, "Vendeur Or", "HundredTicketsSold", 400 },
                    { new Guid("10000000-0000-0000-0001-000000000006"), "#E5E4E2", "Vendre 250 tickets", "star", true, "Vendeur Platine", "TwoHundredFiftyTicketsSold", 750 },
                    { new Guid("10000000-0000-0000-0001-000000000007"), "#B9F2FF", "Vendre 500 tickets", "diamond", true, "Vendeur Diamant", "FiveHundredTicketsSold", 1200 },
                    { new Guid("10000000-0000-0000-0001-000000000008"), "#FF4500", "Vendre 1000 tickets", "trophy", true, "Vendeur Légendaire", "ThousandTicketsSold", 2000 },
                    { new Guid("10000000-0000-0000-0002-000000000001"), "#34C759", "Créer votre premier ticket", "create", true, "Créateur", "FirstTicketCreated", 20 },
                    { new Guid("10000000-0000-0000-0002-000000000002"), "#5856D6", "Créer 10 tickets", "layers", true, "Productif", "TenTicketsCreated", 40 },
                    { new Guid("10000000-0000-0000-0002-000000000003"), "#FF9500", "Créer 50 tickets", "copy", true, "Prolifique", "FiftyTicketsCreated", 100 },
                    { new Guid("10000000-0000-0000-0002-000000000004"), "#FFD700", "Créer 100 tickets", "documents", true, "Machine à Tickets", "HundredTicketsCreated", 250 },
                    { new Guid("10000000-0000-0000-0002-000000000005"), "#FF4500", "Créer 500 tickets", "rocket", true, "Usine à Pronos", "FiveHundredTicketsCreated", 800 },
                    { new Guid("10000000-0000-0000-0003-000000000001"), "#34C759", "Gagner votre premier ticket", "checkmark-circle", true, "Premier Win", "FirstWin", 30 },
                    { new Guid("10000000-0000-0000-0003-000000000002"), "#5856D6", "10 tickets gagnants", "checkmark-done", true, "Gagnant", "TenWins", 60 },
                    { new Guid("10000000-0000-0000-0003-000000000003"), "#FF9500", "50 tickets gagnants", "medal", true, "Victorieux", "FiftyWins", 150 },
                    { new Guid("10000000-0000-0000-0003-000000000004"), "#FFD700", "100 tickets gagnants", "trophy", true, "Invincible", "HundredWins", 350 },
                    { new Guid("10000000-0000-0000-0004-000000000001"), "#FF9500", "3 wins consécutifs", "flame", true, "Série Débutante", "WinStreak3", 50 },
                    { new Guid("10000000-0000-0000-0004-000000000002"), "#FF6B00", "5 wins consécutifs", "flame", true, "En Feu", "WinStreak5", 100 },
                    { new Guid("10000000-0000-0000-0004-000000000003"), "#FF4500", "7 wins consécutifs", "flame", true, "Brûlant", "WinStreak7", 200 },
                    { new Guid("10000000-0000-0000-0004-000000000004"), "#FF3B30", "10 wins consécutifs", "flame", true, "Imbattable", "WinStreak10", 400 },
                    { new Guid("10000000-0000-0000-0004-000000000005"), "#FF2D55", "15 wins consécutifs", "flash", true, "Phénomène", "WinStreak15", 750 },
                    { new Guid("10000000-0000-0000-0004-000000000006"), "#DC143C", "20 wins consécutifs", "flash", true, "Légende Vivante", "WinStreak20", 1500 },
                    { new Guid("10000000-0000-0000-0005-000000000001"), "#5856D6", "50% de winrate (min 10 tickets)", "analytics", true, "Équilibré", "WinRate50", 75 },
                    { new Guid("10000000-0000-0000-0005-000000000002"), "#AF52DE", "60% de winrate (min 20 tickets)", "analytics", true, "Efficace", "WinRate60", 150 },
                    { new Guid("10000000-0000-0000-0005-000000000003"), "#007AFF", "70% de winrate (min 30 tickets)", "analytics", true, "Précis", "WinRate70", 300 },
                    { new Guid("10000000-0000-0000-0005-000000000004"), "#34C759", "80% de winrate (min 50 tickets)", "analytics", true, "Expert", "WinRate80", 600 },
                    { new Guid("10000000-0000-0000-0005-000000000005"), "#FFD700", "90% de winrate (min 100 tickets)", "analytics", true, "Génie", "WinRate90", 1200 },
                    { new Guid("10000000-0000-0000-0006-000000000001"), "#00B4AA", "ROI positif", "stats-chart", true, "Rentable", "RoiPositive", 50 },
                    { new Guid("10000000-0000-0000-0006-000000000002"), "#34C759", "ROI > 5%", "stats-chart", true, "Profitable", "Roi5Percent", 100 },
                    { new Guid("10000000-0000-0000-0006-000000000003"), "#007AFF", "ROI > 10%", "stats-chart", true, "Investisseur", "Roi10Percent", 200 },
                    { new Guid("10000000-0000-0000-0006-000000000004"), "#FFD700", "ROI > 20%", "stats-chart", true, "Golden Touch", "Roi20Percent", 400 },
                    { new Guid("10000000-0000-0000-0006-000000000005"), "#FF4500", "ROI > 50%", "stats-chart", true, "Roi Midas", "Roi50Percent", 1000 },
                    { new Guid("10000000-0000-0000-0007-000000000001"), "#34C759", "Avoir 1 abonné", "person", true, "Premier Fan", "FirstSubscriber", 30 },
                    { new Guid("10000000-0000-0000-0007-000000000002"), "#5856D6", "Avoir 5 abonnés", "people", true, "Petit Groupe", "FiveSubscribers", 60 },
                    { new Guid("10000000-0000-0000-0007-000000000003"), "#007AFF", "Avoir 10 abonnés", "people", true, "Communauté", "TenSubscribers", 100 },
                    { new Guid("10000000-0000-0000-0007-000000000004"), "#FF9500", "Avoir 25 abonnés", "megaphone", true, "Influenceur", "TwentyFiveSubscribers", 200 },
                    { new Guid("10000000-0000-0000-0007-000000000005"), "#FFD700", "Avoir 50 abonnés", "star", true, "Star Montante", "FiftySubscribers", 400 },
                    { new Guid("10000000-0000-0000-0007-000000000006"), "#FF9500", "Avoir 100 abonnés", "star", true, "Star", "HundredSubscribers", 750 },
                    { new Guid("10000000-0000-0000-0007-000000000007"), "#FF4500", "Avoir 250 abonnés", "star-half", true, "Superstar", "TwoHundredFiftySubscribers", 1200 },
                    { new Guid("10000000-0000-0000-0007-000000000008"), "#DC143C", "Avoir 500 abonnés", "sparkles", true, "Célébrité", "FiveHundredSubscribers", 2000 },
                    { new Guid("10000000-0000-0000-0007-000000000009"), "#8B0000", "Avoir 1000 abonnés", "trophy", true, "Légende", "ThousandSubscribers", 3500 },
                    { new Guid("10000000-0000-0000-0008-000000000001"), "#34C759", "Gagner votre premier euro", "cash", true, "Premier Euro", "FirstEuroEarned", 25 },
                    { new Guid("10000000-0000-0000-0008-000000000002"), "#5856D6", "Gagner 10€", "cash", true, "Premiers Revenus", "TenEurosEarned", 50 },
                    { new Guid("10000000-0000-0000-0008-000000000003"), "#007AFF", "Gagner 50€", "wallet", true, "Revenu Stable", "FiftyEurosEarned", 100 },
                    { new Guid("10000000-0000-0000-0008-000000000004"), "#FF9500", "Gagner 100€", "wallet", true, "Rentier", "HundredEurosEarned", 200 },
                    { new Guid("10000000-0000-0000-0008-000000000005"), "#FFD700", "Gagner 500€", "business", true, "Business Man", "FiveHundredEurosEarned", 500 },
                    { new Guid("10000000-0000-0000-0008-000000000006"), "#FF4500", "Gagner 1000€", "diamond", true, "Millionnaire", "ThousandEurosEarned", 1000 },
                    { new Guid("10000000-0000-0000-0009-000000000001"), "#34C759", "Acheter votre premier ticket", "bag", true, "Premier Achat", "FirstPurchase", 20 },
                    { new Guid("10000000-0000-0000-0009-000000000002"), "#5856D6", "Acheter 5 tickets", "bag-add", true, "Client Régulier", "FivePurchases", 40 },
                    { new Guid("10000000-0000-0000-0009-000000000003"), "#007AFF", "Acheter 10 tickets", "albums", true, "Collectionneur", "TenPurchases", 75 },
                    { new Guid("10000000-0000-0000-0009-000000000004"), "#FF9500", "Acheter 25 tickets", "briefcase", true, "Acheteur Pro", "TwentyFivePurchases", 150 },
                    { new Guid("10000000-0000-0000-0009-000000000005"), "#FF2D55", "Acheter 50 tickets", "heart", true, "Fan Absolu", "FiftyPurchases", 300 },
                    { new Guid("10000000-0000-0000-0009-000000000006"), "#FFD700", "Acheter 100 tickets", "gift", true, "Mécène", "HundredPurchases", 600 },
                    { new Guid("10000000-0000-0000-0010-000000000001"), "#AF52DE", "S'abonner à un tipster", "ribbon", true, "Premier Abo", "FirstSubscription", 25 },
                    { new Guid("10000000-0000-0000-0010-000000000002"), "#5856D6", "3 abonnements", "ribbon", true, "Multi-Supporter", "ThreeSubscriptions", 50 },
                    { new Guid("10000000-0000-0000-0010-000000000003"), "#007AFF", "5 abonnements", "diamond", true, "Supporter VIP", "FiveSubscriptions", 100 },
                    { new Guid("10000000-0000-0000-0010-000000000004"), "#FFD700", "10 abonnements", "ribbon", true, "Patron des Tipsters", "TenSubscriptions", 250 },
                    { new Guid("10000000-0000-0000-0011-000000000001"), "#00B4AA", "Suivre un tipster", "person-add", true, "Social", "FirstFollow", 15 },
                    { new Guid("10000000-0000-0000-0011-000000000002"), "#5856D6", "Suivre 5 tipsters", "people", true, "Curieux", "FiveFollows", 30 },
                    { new Guid("10000000-0000-0000-0011-000000000003"), "#007AFF", "Suivre 10 tipsters", "people-circle", true, "Connecté", "TenFollows", 50 },
                    { new Guid("10000000-0000-0000-0011-000000000004"), "#FF9500", "Suivre 25 tipsters", "globe", true, "Réseau Pro", "TwentyFiveFollows", 100 },
                    { new Guid("10000000-0000-0000-0011-000000000005"), "#FFD700", "Suivre 50 tipsters", "globe", true, "Hub Social", "FiftyFollows", 200 },
                    { new Guid("10000000-0000-0000-0012-000000000001"), "#FF9500", "Ajouter un ticket en favoris", "bookmark", true, "Favori", "FirstFavorite", 10 },
                    { new Guid("10000000-0000-0000-0012-000000000002"), "#5856D6", "5 tickets en favoris", "bookmark", true, "Curateur Débutant", "FiveFavorites", 25 },
                    { new Guid("10000000-0000-0000-0012-000000000003"), "#007AFF", "10 tickets en favoris", "bookmarks", true, "Curateur", "TenFavorites", 50 },
                    { new Guid("10000000-0000-0000-0012-000000000004"), "#FF9500", "25 tickets en favoris", "library", true, "Archiviste", "TwentyFiveFavorites", 100 },
                    { new Guid("10000000-0000-0000-0012-000000000005"), "#FFD700", "50 tickets en favoris", "library", true, "Bibliothécaire", "FiftyFavorites", 200 },
                    { new Guid("10000000-0000-0000-0013-000000000001"), "#34C759", "3 jours consécutifs", "calendar", true, "Habitué", "DailyStreak3", 30 },
                    { new Guid("10000000-0000-0000-0013-000000000002"), "#5856D6", "7 jours consécutifs", "calendar", true, "Régulier", "DailyStreak7", 75 },
                    { new Guid("10000000-0000-0000-0013-000000000003"), "#007AFF", "14 jours consécutifs", "calendar", true, "Dévoué", "DailyStreak14", 150 },
                    { new Guid("10000000-0000-0000-0013-000000000004"), "#FF9500", "30 jours consécutifs", "flame", true, "Inconditionnel", "DailyStreak30", 350 },
                    { new Guid("10000000-0000-0000-0013-000000000005"), "#FF4500", "60 jours consécutifs", "flame", true, "Marathonien", "DailyStreak60", 700 },
                    { new Guid("10000000-0000-0000-0013-000000000006"), "#FFD700", "100 jours consécutifs", "medal", true, "Centurion", "DailyStreak100", 1200 },
                    { new Guid("10000000-0000-0000-0013-000000000007"), "#FF4500", "365 jours consécutifs!", "trophy", true, "Légende Annuelle", "DailyStreak365", 5000 },
                    { new Guid("10000000-0000-0000-0014-000000000001"), "#34C759", "Atteindre le niveau 5", "arrow-up-circle", true, "Niveau 5", "Level5", 50 },
                    { new Guid("10000000-0000-0000-0014-000000000002"), "#5856D6", "Atteindre le niveau 10", "arrow-up-circle", true, "Niveau 10", "Level10", 100 },
                    { new Guid("10000000-0000-0000-0014-000000000003"), "#007AFF", "Atteindre le niveau 15", "arrow-up-circle", true, "Niveau 15", "Level15", 200 },
                    { new Guid("10000000-0000-0000-0014-000000000004"), "#FF9500", "Atteindre le niveau 20", "arrow-up-circle", true, "Niveau 20", "Level20", 400 },
                    { new Guid("10000000-0000-0000-0014-000000000005"), "#FFD700", "Atteindre le niveau 25", "podium", true, "Niveau 25", "Level25", 600 },
                    { new Guid("10000000-0000-0000-0014-000000000006"), "#FF4500", "Atteindre le niveau 30", "podium", true, "Niveau 30", "Level30", 1000 },
                    { new Guid("10000000-0000-0000-0014-000000000007"), "#DC143C", "Atteindre le niveau 40", "star", true, "Niveau 40", "Level40", 2000 },
                    { new Guid("10000000-0000-0000-0014-000000000008"), "#8B0000", "Atteindre le niveau maximum!", "trophy", true, "GOAT", "Level50", 5000 },
                    { new Guid("10000000-0000-0000-0015-000000000001"), "#34C759", "Accumuler 1000 XP", "sparkles", true, "1K XP", "Xp1000", 50 },
                    { new Guid("10000000-0000-0000-0015-000000000002"), "#5856D6", "Accumuler 5000 XP", "sparkles", true, "5K XP", "Xp5000", 100 },
                    { new Guid("10000000-0000-0000-0015-000000000003"), "#007AFF", "Accumuler 10000 XP", "sparkles", true, "10K XP", "Xp10000", 200 },
                    { new Guid("10000000-0000-0000-0015-000000000004"), "#FF9500", "Accumuler 25000 XP", "flash", true, "25K XP", "Xp25000", 400 },
                    { new Guid("10000000-0000-0000-0015-000000000005"), "#FFD700", "Accumuler 50000 XP", "flash", true, "50K XP", "Xp50000", 750 },
                    { new Guid("10000000-0000-0000-0015-000000000006"), "#FF4500", "Accumuler 100000 XP", "flash", true, "100K XP", "Xp100000", 1500 },
                    { new Guid("10000000-0000-0000-0016-000000000001"), "#34C759", "50+ tickets football gagnants", "football", true, "Expert Football", "FootballExpert", 300 },
                    { new Guid("10000000-0000-0000-0016-000000000002"), "#FF9500", "50+ tickets basketball gagnants", "basketball", true, "Expert Basketball", "BasketballExpert", 300 },
                    { new Guid("10000000-0000-0000-0016-000000000003"), "#FFCC00", "50+ tickets tennis gagnants", "tennisball", true, "Expert Tennis", "TennisExpert", 300 },
                    { new Guid("10000000-0000-0000-0016-000000000004"), "#5856D6", "50+ tickets esport gagnants", "game-controller", true, "Expert E-Sport", "EsportExpert", 300 },
                    { new Guid("10000000-0000-0000-0016-000000000005"), "#FF4500", "Wins dans 4+ sports différents", "medal", true, "Multi-Sport Master", "MultiSportMaster", 500 },
                    { new Guid("10000000-0000-0000-0017-000000000001"), "#5856D6", "Parmi les premiers utilisateurs", "rocket", true, "Early Adopter", "EarlyAdopter", 200 },
                    { new Guid("10000000-0000-0000-0017-000000000002"), "#00B4AA", "Testeur de la version beta", "bug", true, "Beta Tester", "BetaTester", 300 },
                    { new Guid("10000000-0000-0000-0017-000000000003"), "#CD7F32", "Top 10 du jour", "podium", true, "Top Jour", "TopTipsterDaily", 100 },
                    { new Guid("10000000-0000-0000-0017-000000000004"), "#C0C0C0", "Top 10 de la semaine", "podium", true, "Top Semaine", "TopTipsterWeekly", 250 },
                    { new Guid("10000000-0000-0000-0017-000000000005"), "#FFD700", "Top 10 du mois", "podium", true, "Top Mois", "TopTipsterMonthly", 500 },
                    { new Guid("10000000-0000-0000-0017-000000000006"), "#FF4500", "Top 10 all-time", "trophy", true, "Top All-Time", "TopTipsterAllTime", 2000 },
                    { new Guid("10000000-0000-0000-0017-000000000007"), "#007AFF", "Compte vérifié", "checkmark-done-circle", true, "Vérifié", "Verified", 150 },
                    { new Guid("10000000-0000-0000-0017-000000000008"), "#AF52DE", "Utilisateur premium", "diamond", true, "Premium", "Premium", 200 },
                    { new Guid("10000000-0000-0000-0017-000000000009"), "#FFD700", "Ambassadeur officiel", "shield-checkmark", true, "Ambassadeur", "Ambassador", 500 },
                    { new Guid("10000000-0000-0000-0017-000000000010"), "#FF2D55", "1000+ followers", "megaphone", true, "Influenceur", "Influencer", 750 },
                    { new Guid("10000000-0000-0000-0017-000000000011"), "#8B0000", "Badge légendaire (attribution manuelle)", "star", true, "Légende", "Legend", 3000 },
                    { new Guid("10000000-0000-0000-0018-000000000001"), "#FFD700", "Actif pendant le Nouvel An 2024", "sparkles", true, "Nouvel An 2024", "NewYear2024", 100 },
                    { new Guid("10000000-0000-0000-0018-000000000002"), "#FF4500", "Actif pendant le Nouvel An 2025", "sparkles", true, "Nouvel An 2025", "NewYear2025", 100 },
                    { new Guid("10000000-0000-0000-0018-000000000003"), "#FFD700", "Participant à la Coupe du Monde 2026", "trophy", true, "Coupe du Monde 2026", "WorldCup2026", 250 },
                    { new Guid("10000000-0000-0000-0018-000000000004"), "#1E3A8A", "Event Champions League", "trophy", true, "Champions League", "ChampionsLeague", 150 },
                    { new Guid("10000000-0000-0000-0018-000000000005"), "#8B4513", "Event Super Bowl", "american-football", true, "Super Bowl", "SuperBowl", 150 },
                    { new Guid("10000000-0000-0000-0019-000000000001"), "#1C1C1E", "Actif entre minuit et 5h", "moon", true, "Noctambule", "NightOwl", 75 },
                    { new Guid("10000000-0000-0000-0019-000000000002"), "#FF9500", "Actif entre 5h et 7h", "sunny", true, "Lève-Tôt", "EarlyBird", 75 },
                    { new Guid("10000000-0000-0000-0019-000000000003"), "#5856D6", "Très actif le weekend", "game-controller", true, "Weekend Warrior", "WeekendWarrior", 100 },
                    { new Guid("10000000-0000-0000-0019-000000000004"), "#34C759", "100% winrate sur 10+ tickets", "checkmark-circle", true, "Perfectionniste", "Perfectionist", 500 },
                    { new Guid("10000000-0000-0000-0019-000000000005"), "#00B4AA", "Revenu après 30+ jours d'absence", "refresh", true, "Comeback Kid", "Comeback", 100 },
                    { new Guid("10000000-0000-0000-0019-000000000006"), "#FF2D55", "Partagé 50+ tickets", "share-social", true, "Généreux", "Generous", 200 },
                    { new Guid("10000000-0000-0000-0019-000000000007"), "#FFD700", "Ticket à 50€+", "cash", true, "High Roller", "HighRoller", 150 },
                    { new Guid("10000000-0000-0000-0019-000000000008"), "#34C759", "7 wins à la suite", "dice", true, "Lucky 7", "LuckyNumber7", 77 },
                    { new Guid("10000000-0000-0000-0019-000000000009"), "#CD7F32", "100 de quelque chose", "shield", true, "Centurion", "Centurion", 200 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Badges_Type",
                table: "Badges",
                column: "Type",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserBadges_BadgeId",
                table: "UserBadges",
                column: "BadgeId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBadges_UserGamificationId",
                table: "UserBadges",
                column: "UserGamificationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBadges_UserGamificationId_BadgeId",
                table: "UserBadges",
                columns: new[] { "UserGamificationId", "BadgeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserGamifications_UserId",
                table: "UserGamifications",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_CreatedAt",
                table: "XpTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_UserGamificationId",
                table: "XpTransactions",
                column: "UserGamificationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserBadges");

            migrationBuilder.DropTable(
                name: "XpTransactions");

            migrationBuilder.DropTable(
                name: "Badges");

            migrationBuilder.DropTable(
                name: "UserGamifications");
        }
    }
}

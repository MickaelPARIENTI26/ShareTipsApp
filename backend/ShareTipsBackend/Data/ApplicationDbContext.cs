using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketSelection> TicketSelections => Set<TicketSelection>();
    public DbSet<TicketPurchase> TicketPurchases => Set<TicketPurchase>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Sport> Sports => Set<Sport>();
    public DbSet<League> Leagues => Set<League>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Market> Markets => Set<Market>();
    public DbSet<MarketSelection> MarketSelections => Set<MarketSelection>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();
    public DbSet<FavoriteTicket> FavoriteTickets => Set<FavoriteTicket>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreferences> NotificationPreferences => Set<NotificationPreferences>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<UserConsent> UserConsents => Set<UserConsent>();
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();
    public DbSet<StripePayment> StripePayments => Set<StripePayment>();
    public DbSet<StripePayout> StripePayouts => Set<StripePayout>();

    // Gamification
    public DbSet<UserGamification> UserGamifications => Set<UserGamification>();
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<XpTransaction> XpTransactions => Set<XpTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Role).HasConversion<string>();
        });

        // Wallet
        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne(u => u.Wallet)
                .HasForeignKey<Wallet>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WalletTransaction
        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.WalletId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.ExternalId).IsUnique().HasFilter("\"ExternalId\" IS NOT NULL");
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Wallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(e => e.WalletId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Ticket
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CreatorId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.FirstMatchTime);
            // Composite indexes for marketplace queries (critical for performance)
            entity.HasIndex(e => new { e.Status, e.CreatorId, e.DeletedAt, e.FirstMatchTime })
                .HasDatabaseName("IX_Tickets_Status_Creator_Deleted_FirstMatch");
            entity.HasIndex(e => new { e.IsPublic, e.Status, e.DeletedAt, e.CreatedAt })
                .HasDatabaseName("IX_Tickets_Public_Status_Deleted_Created");
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Result).HasConversion<string>();
            entity.Property(e => e.AvgOdds).HasPrecision(5, 2);
            entity.HasOne(e => e.Creator)
                .WithMany(u => u.CreatedTickets)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TicketSelection
        modelBuilder.Entity<TicketSelection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MatchId);
            entity.Property(e => e.Odds).HasPrecision(5, 2);
            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Selections)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Match)
                .WithMany()
                .HasForeignKey(e => e.MatchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TicketPurchase
        modelBuilder.Entity<TicketPurchase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TicketId, e.BuyerId }).IsUnique();
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.BuyerId);
            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Purchases)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Buyer)
                .WithMany(u => u.Purchases)
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Sport
        modelBuilder.Entity<Sport>(entity =>
        {
            entity.HasKey(e => e.Code);
            entity.Property(e => e.Code).HasMaxLength(50);
        });

        // League
        modelBuilder.Entity<League>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SportCode);
            entity.HasIndex(e => e.ExternalKey).IsUnique();
            entity.HasOne(e => e.Sport)
                .WithMany(s => s.Leagues)
                .HasForeignKey(e => e.SportCode)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Team
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SportCode);
            entity.HasOne(e => e.Sport)
                .WithMany(s => s.Teams)
                .HasForeignKey(e => e.SportCode)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Player
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TeamId);
            entity.HasOne(e => e.Team)
                .WithMany(t => t.Players)
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Match
        modelBuilder.Entity<Match>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.StartTime);
            entity.HasIndex(e => e.LeagueId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.League)
                .WithMany(l => l.Matches)
                .HasForeignKey(e => e.LeagueId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.HomeTeam)
                .WithMany()
                .HasForeignKey(e => e.HomeTeamId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.AwayTeam)
                .WithMany()
                .HasForeignKey(e => e.AwayTeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Market
        modelBuilder.Entity<Market>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MatchId);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Line).HasPrecision(5, 2);
            entity.HasOne(e => e.Match)
                .WithMany(m => m.Markets)
                .HasForeignKey(e => e.MatchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MarketSelection
        modelBuilder.Entity<MarketSelection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MarketId);
            entity.Property(e => e.Odds).HasPrecision(6, 2);
            entity.HasOne(e => e.Market)
                .WithMany(m => m.Selections)
                .HasForeignKey(e => e.MarketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Player)
                .WithMany()
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Subscription
        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SubscriberId, e.TipsterId }).IsUnique();
            entity.HasIndex(e => e.SubscriberId);
            entity.HasIndex(e => e.TipsterId);
            entity.HasIndex(e => e.SubscriptionPlanId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Subscriber)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(e => e.SubscriberId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Tipster)
                .WithMany(u => u.Subscribers)
                .HasForeignKey(e => e.TipsterId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.SubscriptionPlan)
                .WithMany()
                .HasForeignKey(e => e.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WithdrawalRequest
        modelBuilder.Entity<WithdrawalRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.User)
                .WithMany(u => u.WithdrawalRequests)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // FavoriteTicket
        modelBuilder.Entity<FavoriteTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.TicketId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TicketId);
            entity.HasOne(e => e.User)
                .WithMany(u => u.FavoriteTickets)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.FavoriteTickets)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserFollow
        modelBuilder.Entity<UserFollow>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.FollowerUserId, e.FollowedUserId }).IsUnique();
            entity.HasIndex(e => e.FollowerUserId);
            entity.HasIndex(e => e.FollowedUserId);
            entity.HasOne(e => e.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(e => e.FollowerUserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Followed)
                .WithMany(u => u.Followers)
                .HasForeignKey(e => e.FollowedUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NotificationPreferences
        modelBuilder.Entity<NotificationPreferences>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne(u => u.NotificationPreferences)
                .HasForeignKey<NotificationPreferences>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SubscriptionPlan
        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TipsterUserId);
            entity.HasIndex(e => e.IsActive);
            entity.Property(e => e.Title).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasOne(e => e.Tipster)
                .WithMany(u => u.SubscriptionPlans)
                .HasForeignKey(e => e.TipsterUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserConsent
        modelBuilder.Entity<UserConsent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.ConsentType }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.ConsentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Consents)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DeviceToken (Push notifications)
        modelBuilder.Entity<DeviceToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => new { e.UserId, e.DeviceId });
            entity.Property(e => e.Token).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Platform).HasMaxLength(20).IsRequired();
            entity.Property(e => e.DeviceId).HasMaxLength(100);
            entity.Property(e => e.DeviceName).HasMaxLength(100);
            entity.HasOne(e => e.User)
                .WithMany(u => u.DeviceTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StripePayment
        modelBuilder.Entity<StripePayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.StripePaymentIntentId).IsUnique();
            entity.HasIndex(e => e.BuyerId);
            entity.HasIndex(e => e.SellerId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Buyer)
                .WithMany()
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Seller)
                .WithMany()
                .HasForeignKey(e => e.SellerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StripePayout
        modelBuilder.Entity<StripePayout>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.StripePayoutId).IsUnique();
            entity.HasIndex(e => e.TipsterId);
            entity.HasIndex(e => e.Status);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasOne(e => e.Tipster)
                .WithMany()
                .HasForeignKey(e => e.TipsterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TicketPurchase - Add StripePayment navigation
        modelBuilder.Entity<TicketPurchase>(entity =>
        {
            entity.HasOne(e => e.StripePayment)
                .WithMany()
                .HasForeignKey(e => e.StripePaymentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Subscription - Add StripePayment navigation
        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasOne(e => e.StripePayment)
                .WithMany()
                .HasForeignKey(e => e.StripePaymentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // UserGamification
        modelBuilder.Entity<UserGamification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne(u => u.Gamification)
                .HasForeignKey<UserGamification>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Badge
        modelBuilder.Entity<Badge>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Type).IsUnique();
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(20);
        });

        // UserBadge
        modelBuilder.Entity<UserBadge>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserGamificationId, e.BadgeId }).IsUnique();
            entity.HasIndex(e => e.UserGamificationId);
            entity.HasIndex(e => e.BadgeId);
            entity.HasOne(e => e.UserGamification)
                .WithMany(ug => ug.Badges)
                .HasForeignKey(e => e.UserGamificationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Badge)
                .WithMany(b => b.UserBadges)
                .HasForeignKey(e => e.BadgeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // XpTransaction
        modelBuilder.Entity<XpTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserGamificationId);
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.ActionType).HasConversion<string>();
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.HasOne(e => e.UserGamification)
                .WithMany(ug => ug.XpTransactions)
                .HasForeignKey(e => e.UserGamificationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed Sports Data
        modelBuilder.Entity<Sport>().HasData(
            new Sport { Code = "FOOTBALL", Name = "Football", IsActive = true },
            new Sport { Code = "BASKETBALL", Name = "Basketball", IsActive = true },
            new Sport { Code = "TENNIS", Name = "Tennis", IsActive = true },
            new Sport { Code = "ESPORT", Name = "E-Sport", IsActive = true }
        );

        // Seed all 80+ Badges
        SeedAllBadges(modelBuilder);
    }

    private static void SeedAllBadges(ModelBuilder modelBuilder)
    {
        var badges = new List<Badge>
        {
            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Ventes (8 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000001"), Type = BadgeType.FirstTicketSold, Name = "Première Vente", Description = "Vendre votre premier ticket", Icon = "cart", Color = "#34C759", XpReward = 25 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000002"), Type = BadgeType.TenTicketsSold, Name = "Vendeur Bronze", Description = "Vendre 10 tickets", Icon = "trending-up", Color = "#CD7F32", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000003"), Type = BadgeType.TwentyFiveTicketsSold, Name = "Vendeur Confirmé", Description = "Vendre 25 tickets", Icon = "trending-up", Color = "#C0C0C0", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000004"), Type = BadgeType.FiftyTicketsSold, Name = "Vendeur Argent", Description = "Vendre 50 tickets", Icon = "trending-up", Color = "#A8A8A8", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000005"), Type = BadgeType.HundredTicketsSold, Name = "Vendeur Or", Description = "Vendre 100 tickets", Icon = "trending-up", Color = "#FFD700", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000006"), Type = BadgeType.TwoHundredFiftyTicketsSold, Name = "Vendeur Platine", Description = "Vendre 250 tickets", Icon = "star", Color = "#E5E4E2", XpReward = 750 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000007"), Type = BadgeType.FiveHundredTicketsSold, Name = "Vendeur Diamant", Description = "Vendre 500 tickets", Icon = "diamond", Color = "#B9F2FF", XpReward = 1200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0001-000000000008"), Type = BadgeType.ThousandTicketsSold, Name = "Vendeur Légendaire", Description = "Vendre 1000 tickets", Icon = "trophy", Color = "#FF4500", XpReward = 2000 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Création (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0002-000000000001"), Type = BadgeType.FirstTicketCreated, Name = "Créateur", Description = "Créer votre premier ticket", Icon = "create", Color = "#34C759", XpReward = 20 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0002-000000000002"), Type = BadgeType.TenTicketsCreated, Name = "Productif", Description = "Créer 10 tickets", Icon = "layers", Color = "#5856D6", XpReward = 40 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0002-000000000003"), Type = BadgeType.FiftyTicketsCreated, Name = "Prolifique", Description = "Créer 50 tickets", Icon = "copy", Color = "#FF9500", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0002-000000000004"), Type = BadgeType.HundredTicketsCreated, Name = "Machine à Tickets", Description = "Créer 100 tickets", Icon = "documents", Color = "#FFD700", XpReward = 250 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0002-000000000005"), Type = BadgeType.FiveHundredTicketsCreated, Name = "Usine à Pronos", Description = "Créer 500 tickets", Icon = "rocket", Color = "#FF4500", XpReward = 800 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Wins (4 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0003-000000000001"), Type = BadgeType.FirstWin, Name = "Premier Win", Description = "Gagner votre premier ticket", Icon = "checkmark-circle", Color = "#34C759", XpReward = 30 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0003-000000000002"), Type = BadgeType.TenWins, Name = "Gagnant", Description = "10 tickets gagnants", Icon = "checkmark-done", Color = "#5856D6", XpReward = 60 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0003-000000000003"), Type = BadgeType.FiftyWins, Name = "Victorieux", Description = "50 tickets gagnants", Icon = "medal", Color = "#FF9500", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0003-000000000004"), Type = BadgeType.HundredWins, Name = "Invincible", Description = "100 tickets gagnants", Icon = "trophy", Color = "#FFD700", XpReward = 350 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Win Streaks (6 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000001"), Type = BadgeType.WinStreak3, Name = "Série Débutante", Description = "3 wins consécutifs", Icon = "flame", Color = "#FF9500", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000002"), Type = BadgeType.WinStreak5, Name = "En Feu", Description = "5 wins consécutifs", Icon = "flame", Color = "#FF6B00", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000003"), Type = BadgeType.WinStreak7, Name = "Brûlant", Description = "7 wins consécutifs", Icon = "flame", Color = "#FF4500", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000004"), Type = BadgeType.WinStreak10, Name = "Imbattable", Description = "10 wins consécutifs", Icon = "flame", Color = "#FF3B30", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000005"), Type = BadgeType.WinStreak15, Name = "Phénomène", Description = "15 wins consécutifs", Icon = "flash", Color = "#FF2D55", XpReward = 750 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0004-000000000006"), Type = BadgeType.WinStreak20, Name = "Légende Vivante", Description = "20 wins consécutifs", Icon = "flash", Color = "#DC143C", XpReward = 1500 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Win Rates (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0005-000000000001"), Type = BadgeType.WinRate50, Name = "Équilibré", Description = "50% de winrate (min 10 tickets)", Icon = "analytics", Color = "#5856D6", XpReward = 75 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0005-000000000002"), Type = BadgeType.WinRate60, Name = "Efficace", Description = "60% de winrate (min 20 tickets)", Icon = "analytics", Color = "#AF52DE", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0005-000000000003"), Type = BadgeType.WinRate70, Name = "Précis", Description = "70% de winrate (min 30 tickets)", Icon = "analytics", Color = "#007AFF", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0005-000000000004"), Type = BadgeType.WinRate80, Name = "Expert", Description = "80% de winrate (min 50 tickets)", Icon = "analytics", Color = "#34C759", XpReward = 600 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0005-000000000005"), Type = BadgeType.WinRate90, Name = "Génie", Description = "90% de winrate (min 100 tickets)", Icon = "analytics", Color = "#FFD700", XpReward = 1200 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - ROI (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0006-000000000001"), Type = BadgeType.RoiPositive, Name = "Rentable", Description = "ROI positif", Icon = "stats-chart", Color = "#00B4AA", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0006-000000000002"), Type = BadgeType.Roi5Percent, Name = "Profitable", Description = "ROI > 5%", Icon = "stats-chart", Color = "#34C759", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0006-000000000003"), Type = BadgeType.Roi10Percent, Name = "Investisseur", Description = "ROI > 10%", Icon = "stats-chart", Color = "#007AFF", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0006-000000000004"), Type = BadgeType.Roi20Percent, Name = "Golden Touch", Description = "ROI > 20%", Icon = "stats-chart", Color = "#FFD700", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0006-000000000005"), Type = BadgeType.Roi50Percent, Name = "Roi Midas", Description = "ROI > 50%", Icon = "stats-chart", Color = "#FF4500", XpReward = 1000 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Abonnés (9 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000001"), Type = BadgeType.FirstSubscriber, Name = "Premier Fan", Description = "Avoir 1 abonné", Icon = "person", Color = "#34C759", XpReward = 30 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000002"), Type = BadgeType.FiveSubscribers, Name = "Petit Groupe", Description = "Avoir 5 abonnés", Icon = "people", Color = "#5856D6", XpReward = 60 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000003"), Type = BadgeType.TenSubscribers, Name = "Communauté", Description = "Avoir 10 abonnés", Icon = "people", Color = "#007AFF", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000004"), Type = BadgeType.TwentyFiveSubscribers, Name = "Influenceur", Description = "Avoir 25 abonnés", Icon = "megaphone", Color = "#FF9500", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000005"), Type = BadgeType.FiftySubscribers, Name = "Star Montante", Description = "Avoir 50 abonnés", Icon = "star", Color = "#FFD700", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000006"), Type = BadgeType.HundredSubscribers, Name = "Star", Description = "Avoir 100 abonnés", Icon = "star", Color = "#FF9500", XpReward = 750 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000007"), Type = BadgeType.TwoHundredFiftySubscribers, Name = "Superstar", Description = "Avoir 250 abonnés", Icon = "star-half", Color = "#FF4500", XpReward = 1200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000008"), Type = BadgeType.FiveHundredSubscribers, Name = "Célébrité", Description = "Avoir 500 abonnés", Icon = "sparkles", Color = "#DC143C", XpReward = 2000 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0007-000000000009"), Type = BadgeType.ThousandSubscribers, Name = "Légende", Description = "Avoir 1000 abonnés", Icon = "trophy", Color = "#8B0000", XpReward = 3500 },

            // ═══════════════════════════════════════════════════════════════
            // TIPSTER BADGES - Gains (6 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000001"), Type = BadgeType.FirstEuroEarned, Name = "Premier Euro", Description = "Gagner votre premier euro", Icon = "cash", Color = "#34C759", XpReward = 25 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000002"), Type = BadgeType.TenEurosEarned, Name = "Premiers Revenus", Description = "Gagner 10€", Icon = "cash", Color = "#5856D6", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000003"), Type = BadgeType.FiftyEurosEarned, Name = "Revenu Stable", Description = "Gagner 50€", Icon = "wallet", Color = "#007AFF", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000004"), Type = BadgeType.HundredEurosEarned, Name = "Rentier", Description = "Gagner 100€", Icon = "wallet", Color = "#FF9500", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000005"), Type = BadgeType.FiveHundredEurosEarned, Name = "Business Man", Description = "Gagner 500€", Icon = "business", Color = "#FFD700", XpReward = 500 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0008-000000000006"), Type = BadgeType.ThousandEurosEarned, Name = "Millionnaire", Description = "Gagner 1000€", Icon = "diamond", Color = "#FF4500", XpReward = 1000 },

            // ═══════════════════════════════════════════════════════════════
            // BUYER BADGES - Achats (6 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000001"), Type = BadgeType.FirstPurchase, Name = "Premier Achat", Description = "Acheter votre premier ticket", Icon = "bag", Color = "#34C759", XpReward = 20 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000002"), Type = BadgeType.FivePurchases, Name = "Client Régulier", Description = "Acheter 5 tickets", Icon = "bag-add", Color = "#5856D6", XpReward = 40 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000003"), Type = BadgeType.TenPurchases, Name = "Collectionneur", Description = "Acheter 10 tickets", Icon = "albums", Color = "#007AFF", XpReward = 75 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000004"), Type = BadgeType.TwentyFivePurchases, Name = "Acheteur Pro", Description = "Acheter 25 tickets", Icon = "briefcase", Color = "#FF9500", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000005"), Type = BadgeType.FiftyPurchases, Name = "Fan Absolu", Description = "Acheter 50 tickets", Icon = "heart", Color = "#FF2D55", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0009-000000000006"), Type = BadgeType.HundredPurchases, Name = "Mécène", Description = "Acheter 100 tickets", Icon = "gift", Color = "#FFD700", XpReward = 600 },

            // ═══════════════════════════════════════════════════════════════
            // BUYER BADGES - Abonnements (4 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0010-000000000001"), Type = BadgeType.FirstSubscription, Name = "Premier Abo", Description = "S'abonner à un tipster", Icon = "ribbon", Color = "#AF52DE", XpReward = 25 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0010-000000000002"), Type = BadgeType.ThreeSubscriptions, Name = "Multi-Supporter", Description = "3 abonnements", Icon = "ribbon", Color = "#5856D6", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0010-000000000003"), Type = BadgeType.FiveSubscriptions, Name = "Supporter VIP", Description = "5 abonnements", Icon = "diamond", Color = "#007AFF", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0010-000000000004"), Type = BadgeType.TenSubscriptions, Name = "Patron des Tipsters", Description = "10 abonnements", Icon = "ribbon", Color = "#FFD700", XpReward = 250 },

            // ═══════════════════════════════════════════════════════════════
            // ENGAGEMENT BADGES - Follows (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0011-000000000001"), Type = BadgeType.FirstFollow, Name = "Social", Description = "Suivre un tipster", Icon = "person-add", Color = "#00B4AA", XpReward = 15 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0011-000000000002"), Type = BadgeType.FiveFollows, Name = "Curieux", Description = "Suivre 5 tipsters", Icon = "people", Color = "#5856D6", XpReward = 30 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0011-000000000003"), Type = BadgeType.TenFollows, Name = "Connecté", Description = "Suivre 10 tipsters", Icon = "people-circle", Color = "#007AFF", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0011-000000000004"), Type = BadgeType.TwentyFiveFollows, Name = "Réseau Pro", Description = "Suivre 25 tipsters", Icon = "globe", Color = "#FF9500", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0011-000000000005"), Type = BadgeType.FiftyFollows, Name = "Hub Social", Description = "Suivre 50 tipsters", Icon = "globe", Color = "#FFD700", XpReward = 200 },

            // ═══════════════════════════════════════════════════════════════
            // ENGAGEMENT BADGES - Favoris (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0012-000000000001"), Type = BadgeType.FirstFavorite, Name = "Favori", Description = "Ajouter un ticket en favoris", Icon = "bookmark", Color = "#FF9500", XpReward = 10 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0012-000000000002"), Type = BadgeType.FiveFavorites, Name = "Curateur Débutant", Description = "5 tickets en favoris", Icon = "bookmark", Color = "#5856D6", XpReward = 25 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0012-000000000003"), Type = BadgeType.TenFavorites, Name = "Curateur", Description = "10 tickets en favoris", Icon = "bookmarks", Color = "#007AFF", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0012-000000000004"), Type = BadgeType.TwentyFiveFavorites, Name = "Archiviste", Description = "25 tickets en favoris", Icon = "library", Color = "#FF9500", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0012-000000000005"), Type = BadgeType.FiftyFavorites, Name = "Bibliothécaire", Description = "50 tickets en favoris", Icon = "library", Color = "#FFD700", XpReward = 200 },

            // ═══════════════════════════════════════════════════════════════
            // ENGAGEMENT BADGES - Daily Streaks (7 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000001"), Type = BadgeType.DailyStreak3, Name = "Habitué", Description = "3 jours consécutifs", Icon = "calendar", Color = "#34C759", XpReward = 30 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000002"), Type = BadgeType.DailyStreak7, Name = "Régulier", Description = "7 jours consécutifs", Icon = "calendar", Color = "#5856D6", XpReward = 75 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000003"), Type = BadgeType.DailyStreak14, Name = "Dévoué", Description = "14 jours consécutifs", Icon = "calendar", Color = "#007AFF", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000004"), Type = BadgeType.DailyStreak30, Name = "Inconditionnel", Description = "30 jours consécutifs", Icon = "flame", Color = "#FF9500", XpReward = 350 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000005"), Type = BadgeType.DailyStreak60, Name = "Marathonien", Description = "60 jours consécutifs", Icon = "flame", Color = "#FF4500", XpReward = 700 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000006"), Type = BadgeType.DailyStreak100, Name = "Centurion", Description = "100 jours consécutifs", Icon = "medal", Color = "#FFD700", XpReward = 1200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0013-000000000007"), Type = BadgeType.DailyStreak365, Name = "Légende Annuelle", Description = "365 jours consécutifs!", Icon = "trophy", Color = "#FF4500", XpReward = 5000 },

            // ═══════════════════════════════════════════════════════════════
            // LEVEL BADGES (8 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000001"), Type = BadgeType.Level5, Name = "Niveau 5", Description = "Atteindre le niveau 5", Icon = "arrow-up-circle", Color = "#34C759", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000002"), Type = BadgeType.Level10, Name = "Niveau 10", Description = "Atteindre le niveau 10", Icon = "arrow-up-circle", Color = "#5856D6", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000003"), Type = BadgeType.Level15, Name = "Niveau 15", Description = "Atteindre le niveau 15", Icon = "arrow-up-circle", Color = "#007AFF", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000004"), Type = BadgeType.Level20, Name = "Niveau 20", Description = "Atteindre le niveau 20", Icon = "arrow-up-circle", Color = "#FF9500", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000005"), Type = BadgeType.Level25, Name = "Niveau 25", Description = "Atteindre le niveau 25", Icon = "podium", Color = "#FFD700", XpReward = 600 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000006"), Type = BadgeType.Level30, Name = "Niveau 30", Description = "Atteindre le niveau 30", Icon = "podium", Color = "#FF4500", XpReward = 1000 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000007"), Type = BadgeType.Level40, Name = "Niveau 40", Description = "Atteindre le niveau 40", Icon = "star", Color = "#DC143C", XpReward = 2000 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0014-000000000008"), Type = BadgeType.Level50, Name = "GOAT", Description = "Atteindre le niveau maximum!", Icon = "trophy", Color = "#8B0000", XpReward = 5000 },

            // ═══════════════════════════════════════════════════════════════
            // XP BADGES (6 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000001"), Type = BadgeType.Xp1000, Name = "1K XP", Description = "Accumuler 1000 XP", Icon = "sparkles", Color = "#34C759", XpReward = 50 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000002"), Type = BadgeType.Xp5000, Name = "5K XP", Description = "Accumuler 5000 XP", Icon = "sparkles", Color = "#5856D6", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000003"), Type = BadgeType.Xp10000, Name = "10K XP", Description = "Accumuler 10000 XP", Icon = "sparkles", Color = "#007AFF", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000004"), Type = BadgeType.Xp25000, Name = "25K XP", Description = "Accumuler 25000 XP", Icon = "flash", Color = "#FF9500", XpReward = 400 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000005"), Type = BadgeType.Xp50000, Name = "50K XP", Description = "Accumuler 50000 XP", Icon = "flash", Color = "#FFD700", XpReward = 750 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0015-000000000006"), Type = BadgeType.Xp100000, Name = "100K XP", Description = "Accumuler 100000 XP", Icon = "flash", Color = "#FF4500", XpReward = 1500 },

            // ═══════════════════════════════════════════════════════════════
            // SPORTS EXPERT BADGES (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0016-000000000001"), Type = BadgeType.FootballExpert, Name = "Expert Football", Description = "50+ tickets football gagnants", Icon = "football", Color = "#34C759", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0016-000000000002"), Type = BadgeType.BasketballExpert, Name = "Expert Basketball", Description = "50+ tickets basketball gagnants", Icon = "basketball", Color = "#FF9500", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0016-000000000003"), Type = BadgeType.TennisExpert, Name = "Expert Tennis", Description = "50+ tickets tennis gagnants", Icon = "tennisball", Color = "#FFCC00", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0016-000000000004"), Type = BadgeType.EsportExpert, Name = "Expert E-Sport", Description = "50+ tickets esport gagnants", Icon = "game-controller", Color = "#5856D6", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0016-000000000005"), Type = BadgeType.MultiSportMaster, Name = "Multi-Sport Master", Description = "Wins dans 4+ sports différents", Icon = "medal", Color = "#FF4500", XpReward = 500 },

            // ═══════════════════════════════════════════════════════════════
            // SPECIAL BADGES (11 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000001"), Type = BadgeType.EarlyAdopter, Name = "Early Adopter", Description = "Parmi les premiers utilisateurs", Icon = "rocket", Color = "#5856D6", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000002"), Type = BadgeType.BetaTester, Name = "Beta Tester", Description = "Testeur de la version beta", Icon = "bug", Color = "#00B4AA", XpReward = 300 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000003"), Type = BadgeType.TopTipsterDaily, Name = "Top Jour", Description = "Top 10 du jour", Icon = "podium", Color = "#CD7F32", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000004"), Type = BadgeType.TopTipsterWeekly, Name = "Top Semaine", Description = "Top 10 de la semaine", Icon = "podium", Color = "#C0C0C0", XpReward = 250 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000005"), Type = BadgeType.TopTipsterMonthly, Name = "Top Mois", Description = "Top 10 du mois", Icon = "podium", Color = "#FFD700", XpReward = 500 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000006"), Type = BadgeType.TopTipsterAllTime, Name = "Top All-Time", Description = "Top 10 all-time", Icon = "trophy", Color = "#FF4500", XpReward = 2000 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000007"), Type = BadgeType.Verified, Name = "Vérifié", Description = "Compte vérifié", Icon = "checkmark-done-circle", Color = "#007AFF", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000008"), Type = BadgeType.Premium, Name = "Premium", Description = "Utilisateur premium", Icon = "diamond", Color = "#AF52DE", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000009"), Type = BadgeType.Ambassador, Name = "Ambassadeur", Description = "Ambassadeur officiel", Icon = "shield-checkmark", Color = "#FFD700", XpReward = 500 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000010"), Type = BadgeType.Influencer, Name = "Influenceur", Description = "1000+ followers", Icon = "megaphone", Color = "#FF2D55", XpReward = 750 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0017-000000000011"), Type = BadgeType.Legend, Name = "Légende", Description = "Badge légendaire (attribution manuelle)", Icon = "star", Color = "#8B0000", XpReward = 3000 },

            // ═══════════════════════════════════════════════════════════════
            // SEASONAL / EVENT BADGES (5 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0018-000000000001"), Type = BadgeType.NewYear2024, Name = "Nouvel An 2024", Description = "Actif pendant le Nouvel An 2024", Icon = "sparkles", Color = "#FFD700", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0018-000000000002"), Type = BadgeType.NewYear2025, Name = "Nouvel An 2025", Description = "Actif pendant le Nouvel An 2025", Icon = "sparkles", Color = "#FF4500", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0018-000000000003"), Type = BadgeType.WorldCup2026, Name = "Coupe du Monde 2026", Description = "Participant à la Coupe du Monde 2026", Icon = "trophy", Color = "#FFD700", XpReward = 250 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0018-000000000004"), Type = BadgeType.ChampionsLeague, Name = "Champions League", Description = "Event Champions League", Icon = "trophy", Color = "#1E3A8A", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0018-000000000005"), Type = BadgeType.SuperBowl, Name = "Super Bowl", Description = "Event Super Bowl", Icon = "american-football", Color = "#8B4513", XpReward = 150 },

            // ═══════════════════════════════════════════════════════════════
            // FUN / RARE BADGES (9 badges)
            // ═══════════════════════════════════════════════════════════════
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000001"), Type = BadgeType.NightOwl, Name = "Noctambule", Description = "Actif entre minuit et 5h", Icon = "moon", Color = "#1C1C1E", XpReward = 75 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000002"), Type = BadgeType.EarlyBird, Name = "Lève-Tôt", Description = "Actif entre 5h et 7h", Icon = "sunny", Color = "#FF9500", XpReward = 75 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000003"), Type = BadgeType.WeekendWarrior, Name = "Weekend Warrior", Description = "Très actif le weekend", Icon = "game-controller", Color = "#5856D6", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000004"), Type = BadgeType.Perfectionist, Name = "Perfectionniste", Description = "100% winrate sur 10+ tickets", Icon = "checkmark-circle", Color = "#34C759", XpReward = 500 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000005"), Type = BadgeType.Comeback, Name = "Comeback Kid", Description = "Revenu après 30+ jours d'absence", Icon = "refresh", Color = "#00B4AA", XpReward = 100 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000006"), Type = BadgeType.Generous, Name = "Généreux", Description = "Partagé 50+ tickets", Icon = "share-social", Color = "#FF2D55", XpReward = 200 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000007"), Type = BadgeType.HighRoller, Name = "High Roller", Description = "Ticket à 50€+", Icon = "cash", Color = "#FFD700", XpReward = 150 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000008"), Type = BadgeType.LuckyNumber7, Name = "Lucky 7", Description = "7 wins à la suite", Icon = "dice", Color = "#34C759", XpReward = 77 },
            new Badge { Id = Guid.Parse("10000000-0000-0000-0019-000000000009"), Type = BadgeType.Centurion, Name = "Centurion", Description = "100 de quelque chose", Icon = "shield", Color = "#CD7F32", XpReward = 200 },
        };

        modelBuilder.Entity<Badge>().HasData(badges);
    }
}

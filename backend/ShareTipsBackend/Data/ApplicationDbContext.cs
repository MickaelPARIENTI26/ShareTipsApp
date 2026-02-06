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

        // Seed Sports Data
        modelBuilder.Entity<Sport>().HasData(
            new Sport { Code = "FOOTBALL", Name = "Football", IsActive = true },
            new Sport { Code = "BASKETBALL", Name = "Basketball", IsActive = true },
            new Sport { Code = "TENNIS", Name = "Tennis", IsActive = true },
            new Sport { Code = "ESPORT", Name = "E-Sport", IsActive = true }
        );
    }
}

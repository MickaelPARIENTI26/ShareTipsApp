using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class GamificationService : IGamificationService
{
    private readonly ApplicationDbContext _context;

    public GamificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserGamificationDto> GetUserGamificationAsync(Guid userId)
    {
        var gamification = await GetOrCreateGamificationAsync(userId);
        return MapToDto(gamification);
    }

    public async Task<UserGamificationDto?> GetPublicGamificationAsync(Guid userId)
    {
        var gamification = await _context.UserGamifications
            .Include(g => g.Badges)
            .FirstOrDefaultAsync(g => g.UserId == userId);

        return gamification != null ? MapToDto(gamification) : null;
    }

    public async Task<XpGainResultDto> AwardXpAsync(
        Guid userId,
        XpActionType action,
        string? description = null,
        Guid? referenceId = null)
    {
        var gamification = await GetOrCreateGamificationAsync(userId);
        var xpAmount = GamificationConfig.GetXpForAction(action);

        // Record the transaction
        var transaction = new XpTransaction
        {
            Id = Guid.NewGuid(),
            UserGamificationId = gamification.Id,
            ActionType = action,
            Amount = xpAmount,
            Description = description ?? GetDefaultDescription(action),
            ReferenceId = referenceId,
            CreatedAt = DateTime.UtcNow
        };
        _context.XpTransactions.Add(transaction);

        // Update XP
        var oldLevel = gamification.Level;
        gamification.CurrentXp += xpAmount;
        gamification.TotalXpEarned += Math.Max(0, xpAmount);
        gamification.UpdatedAt = DateTime.UtcNow;

        // Check for level up
        var newLevel = GamificationConfig.GetLevelForXp(gamification.TotalXpEarned);
        var leveledUp = newLevel > oldLevel;

        if (leveledUp)
        {
            gamification.Level = newLevel;

            // Award bonus XP for level up
            if (action != XpActionType.LevelUp)
            {
                var levelUpXp = GamificationConfig.GetXpForAction(XpActionType.LevelUp);
                gamification.TotalXpEarned += levelUpXp;

                var levelUpTransaction = new XpTransaction
                {
                    Id = Guid.NewGuid(),
                    UserGamificationId = gamification.Id,
                    ActionType = XpActionType.LevelUp,
                    Amount = levelUpXp,
                    Description = $"Passage au niveau {newLevel}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.XpTransactions.Add(levelUpTransaction);
            }
        }

        await _context.SaveChangesAsync();

        // Check for new badges
        var newBadges = await CheckAndAwardBadgesAsync(userId);

        return new XpGainResultDto(
            xpAmount,
            gamification.TotalXpEarned,
            gamification.Level,
            leveledUp,
            leveledUp ? newLevel : null,
            leveledUp ? GamificationConfig.GetLevelName(newLevel) : null,
            newBadges.Count > 0 ? newBadges : null
        );
    }

    public async Task<List<BadgeDto>> CheckAndAwardBadgesAsync(Guid userId)
    {
        var gamification = await GetOrCreateGamificationAsync(userId);
        var earnedBadgeTypes = await _context.UserBadges
            .Where(ub => ub.UserGamificationId == gamification.Id)
            .Select(ub => ub.Badge!.Type)
            .ToListAsync();

        var allBadges = await _context.Badges.Where(b => b.IsActive).ToListAsync();
        var newBadges = new List<BadgeDto>();

        // Get user stats for badge evaluation
        var user = await _context.Users
            .Include(u => u.CreatedTickets)
            .Include(u => u.Purchases)
            .Include(u => u.Subscriptions)
            .Include(u => u.Subscribers)
            .Include(u => u.Following)
            .Include(u => u.FavoriteTickets)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return newBadges;

        var ticketsSold = await _context.TicketPurchases
            .CountAsync(p => p.Ticket != null && p.Ticket.CreatorId == userId);

        var winningTickets = await _context.Tickets
            .CountAsync(t => t.CreatorId == userId && t.Result == TicketResult.Win);

        var losingTickets = await _context.Tickets
            .CountAsync(t => t.CreatorId == userId && t.Result == TicketResult.Lose);

        var totalFinishedTickets = winningTickets + losingTickets;
        var winRate = totalFinishedTickets > 0 ? (winningTickets * 100.0 / totalFinishedTickets) : 0;

        var subscriberCount = await _context.Subscriptions
            .CountAsync(s => s.TipsterId == userId && s.Status == SubscriptionStatus.Active);

        var ticketsCreated = user.CreatedTickets.Count(t => t.DeletedAt == null);
        var purchaseCount = user.Purchases.Count;
        var activeSubscriptions = user.Subscriptions.Count(s => s.Status == SubscriptionStatus.Active);
        var followCount = user.Following.Count;
        var favoriteCount = user.FavoriteTickets.Count;

        foreach (var badge in allBadges)
        {
            if (earnedBadgeTypes.Contains(badge.Type))
                continue;

            var shouldAward = badge.Type switch
            {
                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Ventes
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstTicketSold => ticketsSold >= 1,
                BadgeType.TenTicketsSold => ticketsSold >= 10,
                BadgeType.TwentyFiveTicketsSold => ticketsSold >= 25,
                BadgeType.FiftyTicketsSold => ticketsSold >= 50,
                BadgeType.HundredTicketsSold => ticketsSold >= 100,
                BadgeType.TwoHundredFiftyTicketsSold => ticketsSold >= 250,
                BadgeType.FiveHundredTicketsSold => ticketsSold >= 500,
                BadgeType.ThousandTicketsSold => ticketsSold >= 1000,

                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Création
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstTicketCreated => ticketsCreated >= 1,
                BadgeType.TenTicketsCreated => ticketsCreated >= 10,
                BadgeType.FiftyTicketsCreated => ticketsCreated >= 50,
                BadgeType.HundredTicketsCreated => ticketsCreated >= 100,
                BadgeType.FiveHundredTicketsCreated => ticketsCreated >= 500,

                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Wins
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstWin => winningTickets >= 1,
                BadgeType.TenWins => winningTickets >= 10,
                BadgeType.FiftyWins => winningTickets >= 50,
                BadgeType.HundredWins => winningTickets >= 100,

                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Win Streaks
                // ═══════════════════════════════════════════════════════════════
                BadgeType.WinStreak3 => gamification.LongestWinStreak >= 3,
                BadgeType.WinStreak5 => gamification.LongestWinStreak >= 5,
                BadgeType.WinStreak7 => gamification.LongestWinStreak >= 7,
                BadgeType.WinStreak10 => gamification.LongestWinStreak >= 10,
                BadgeType.WinStreak15 => gamification.LongestWinStreak >= 15,
                BadgeType.WinStreak20 => gamification.LongestWinStreak >= 20,

                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Win Rates
                // ═══════════════════════════════════════════════════════════════
                BadgeType.WinRate50 => totalFinishedTickets >= 10 && winRate >= 50,
                BadgeType.WinRate60 => totalFinishedTickets >= 20 && winRate >= 60,
                BadgeType.WinRate70 => totalFinishedTickets >= 30 && winRate >= 70,
                BadgeType.WinRate80 => totalFinishedTickets >= 50 && winRate >= 80,
                BadgeType.WinRate90 => totalFinishedTickets >= 100 && winRate >= 90,

                // ═══════════════════════════════════════════════════════════════
                // TIPSTER BADGES - Abonnés
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstSubscriber => subscriberCount >= 1,
                BadgeType.FiveSubscribers => subscriberCount >= 5,
                BadgeType.TenSubscribers => subscriberCount >= 10,
                BadgeType.TwentyFiveSubscribers => subscriberCount >= 25,
                BadgeType.FiftySubscribers => subscriberCount >= 50,
                BadgeType.HundredSubscribers => subscriberCount >= 100,
                BadgeType.TwoHundredFiftySubscribers => subscriberCount >= 250,
                BadgeType.FiveHundredSubscribers => subscriberCount >= 500,
                BadgeType.ThousandSubscribers => subscriberCount >= 1000,

                // ═══════════════════════════════════════════════════════════════
                // BUYER BADGES - Achats
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstPurchase => purchaseCount >= 1,
                BadgeType.FivePurchases => purchaseCount >= 5,
                BadgeType.TenPurchases => purchaseCount >= 10,
                BadgeType.TwentyFivePurchases => purchaseCount >= 25,
                BadgeType.FiftyPurchases => purchaseCount >= 50,
                BadgeType.HundredPurchases => purchaseCount >= 100,

                // ═══════════════════════════════════════════════════════════════
                // BUYER BADGES - Abonnements
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstSubscription => activeSubscriptions >= 1,
                BadgeType.ThreeSubscriptions => activeSubscriptions >= 3,
                BadgeType.FiveSubscriptions => activeSubscriptions >= 5,
                BadgeType.TenSubscriptions => activeSubscriptions >= 10,

                // ═══════════════════════════════════════════════════════════════
                // ENGAGEMENT BADGES - Follows
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstFollow => followCount >= 1,
                BadgeType.FiveFollows => followCount >= 5,
                BadgeType.TenFollows => followCount >= 10,
                BadgeType.TwentyFiveFollows => followCount >= 25,
                BadgeType.FiftyFollows => followCount >= 50,

                // ═══════════════════════════════════════════════════════════════
                // ENGAGEMENT BADGES - Favoris
                // ═══════════════════════════════════════════════════════════════
                BadgeType.FirstFavorite => favoriteCount >= 1,
                BadgeType.FiveFavorites => favoriteCount >= 5,
                BadgeType.TenFavorites => favoriteCount >= 10,
                BadgeType.TwentyFiveFavorites => favoriteCount >= 25,
                BadgeType.FiftyFavorites => favoriteCount >= 50,

                // ═══════════════════════════════════════════════════════════════
                // ENGAGEMENT BADGES - Daily Streaks
                // ═══════════════════════════════════════════════════════════════
                BadgeType.DailyStreak3 => gamification.LongestDailyStreak >= 3,
                BadgeType.DailyStreak7 => gamification.LongestDailyStreak >= 7,
                BadgeType.DailyStreak14 => gamification.LongestDailyStreak >= 14,
                BadgeType.DailyStreak30 => gamification.LongestDailyStreak >= 30,
                BadgeType.DailyStreak60 => gamification.LongestDailyStreak >= 60,
                BadgeType.DailyStreak100 => gamification.LongestDailyStreak >= 100,
                BadgeType.DailyStreak365 => gamification.LongestDailyStreak >= 365,

                // ═══════════════════════════════════════════════════════════════
                // LEVEL BADGES
                // ═══════════════════════════════════════════════════════════════
                BadgeType.Level5 => gamification.Level >= 5,
                BadgeType.Level10 => gamification.Level >= 10,
                BadgeType.Level15 => gamification.Level >= 15,
                BadgeType.Level20 => gamification.Level >= 20,
                BadgeType.Level25 => gamification.Level >= 25,
                BadgeType.Level30 => gamification.Level >= 30,
                BadgeType.Level40 => gamification.Level >= 40,
                BadgeType.Level50 => gamification.Level >= 50,

                // ═══════════════════════════════════════════════════════════════
                // XP BADGES
                // ═══════════════════════════════════════════════════════════════
                BadgeType.Xp1000 => gamification.TotalXpEarned >= 1000,
                BadgeType.Xp5000 => gamification.TotalXpEarned >= 5000,
                BadgeType.Xp10000 => gamification.TotalXpEarned >= 10000,
                BadgeType.Xp25000 => gamification.TotalXpEarned >= 25000,
                BadgeType.Xp50000 => gamification.TotalXpEarned >= 50000,
                BadgeType.Xp100000 => gamification.TotalXpEarned >= 100000,

                // ═══════════════════════════════════════════════════════════════
                // SPECIAL/MANUAL BADGES (not auto-awarded)
                // ═══════════════════════════════════════════════════════════════
                BadgeType.EarlyAdopter => false,
                BadgeType.BetaTester => false,
                BadgeType.TopTipsterDaily => false,
                BadgeType.TopTipsterWeekly => false,
                BadgeType.TopTipsterMonthly => false,
                BadgeType.TopTipsterAllTime => false,
                BadgeType.Verified => false,
                BadgeType.Premium => false,
                BadgeType.Ambassador => false,
                BadgeType.Influencer => false,
                BadgeType.Legend => false,
                BadgeType.RoiPositive => false,
                BadgeType.Roi5Percent => false,
                BadgeType.Roi10Percent => false,
                BadgeType.Roi20Percent => false,
                BadgeType.Roi50Percent => false,
                BadgeType.FirstEuroEarned => false,
                BadgeType.TenEurosEarned => false,
                BadgeType.FiftyEurosEarned => false,
                BadgeType.HundredEurosEarned => false,
                BadgeType.FiveHundredEurosEarned => false,
                BadgeType.ThousandEurosEarned => false,
                BadgeType.FootballExpert => false,
                BadgeType.BasketballExpert => false,
                BadgeType.TennisExpert => false,
                BadgeType.EsportExpert => false,
                BadgeType.MultiSportMaster => false,
                BadgeType.NewYear2024 => false,
                BadgeType.NewYear2025 => false,
                BadgeType.WorldCup2026 => false,
                BadgeType.ChampionsLeague => false,
                BadgeType.SuperBowl => false,
                BadgeType.NightOwl => false,
                BadgeType.EarlyBird => false,
                BadgeType.WeekendWarrior => false,
                BadgeType.Perfectionist => false,
                BadgeType.Comeback => false,
                BadgeType.Generous => false,
                BadgeType.HighRoller => false,
                BadgeType.LuckyNumber7 => gamification.LongestWinStreak >= 7,
                BadgeType.Centurion => false,

                _ => false
            };

            if (shouldAward)
            {
                var userBadge = new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserGamificationId = gamification.Id,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow
                };
                _context.UserBadges.Add(userBadge);

                // Award badge XP
                if (badge.XpReward > 0)
                {
                    gamification.TotalXpEarned += badge.XpReward;
                    gamification.CurrentXp += badge.XpReward;

                    var xpTransaction = new XpTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserGamificationId = gamification.Id,
                        ActionType = XpActionType.EarnBadge,
                        Amount = badge.XpReward,
                        Description = $"Badge obtenu: {badge.Name}",
                        ReferenceId = badge.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.XpTransactions.Add(xpTransaction);
                }

                newBadges.Add(new BadgeDto(
                    badge.Id,
                    badge.Type.ToString(),
                    badge.Name,
                    badge.Description,
                    badge.Icon,
                    badge.Color,
                    badge.XpReward
                ));
            }
        }

        if (newBadges.Count > 0)
        {
            // Recalculate level after badge XP
            gamification.Level = GamificationConfig.GetLevelForXp(gamification.TotalXpEarned);
            gamification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return newBadges;
    }

    public async Task<XpGainResultDto> RecordDailyLoginAsync(Guid userId)
    {
        var gamification = await GetOrCreateGamificationAsync(userId);
        var today = DateTime.UtcNow.Date;

        // Check if already logged in today
        if (gamification.LastLoginDate?.Date == today)
        {
            return new XpGainResultDto(0, gamification.TotalXpEarned, gamification.Level, false, null, null, null);
        }

        // Update streak
        var yesterday = today.AddDays(-1);
        if (gamification.LastLoginDate?.Date == yesterday)
        {
            gamification.CurrentDailyStreak++;
        }
        else
        {
            gamification.CurrentDailyStreak = 1;
        }

        if (gamification.CurrentDailyStreak > gamification.LongestDailyStreak)
        {
            gamification.LongestDailyStreak = gamification.CurrentDailyStreak;
        }

        gamification.LastLoginDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Award daily login XP
        return await AwardXpAsync(userId, XpActionType.DailyLogin, $"Connexion quotidienne (jour {gamification.CurrentDailyStreak})");
    }

    public async Task<List<BadgeDto>> GetAllBadgesAsync()
    {
        var badges = await _context.Badges
            .Where(b => b.IsActive)
            .OrderBy(b => b.Type)
            .ToListAsync();

        return badges.Select(b => new BadgeDto(
            b.Id,
            b.Type.ToString(),
            b.Name,
            b.Description,
            b.Icon,
            b.Color,
            b.XpReward
        )).ToList();
    }

    public async Task<List<UserBadgeDto>> GetUserBadgesAsync(Guid userId)
    {
        var gamification = await _context.UserGamifications
            .FirstOrDefaultAsync(g => g.UserId == userId);

        if (gamification == null)
            return new List<UserBadgeDto>();

        var userBadges = await _context.UserBadges
            .Include(ub => ub.Badge)
            .Where(ub => ub.UserGamificationId == gamification.Id)
            .OrderByDescending(ub => ub.EarnedAt)
            .ToListAsync();

        return userBadges.Select(ub => new UserBadgeDto(
            ub.Id,
            ub.Badge!.Type.ToString(),
            ub.Badge.Name,
            ub.Badge.Description,
            ub.Badge.Icon,
            ub.Badge.Color,
            ub.EarnedAt
        )).ToList();
    }

    public async Task<List<LeaderboardEntryDto>> GetXpLeaderboardAsync(int limit = 20)
    {
        var topUsers = await _context.UserGamifications
            .Include(g => g.User)
            .Include(g => g.Badges)
            .Where(g => g.User != null && g.User.DeletedAt == null)
            .OrderByDescending(g => g.TotalXpEarned)
            .Take(limit)
            .ToListAsync();

        return topUsers.Select((g, index) => new LeaderboardEntryDto(
            index + 1,
            g.UserId,
            g.User!.Username,
            g.Level,
            GamificationConfig.GetLevelName(g.Level),
            g.TotalXpEarned,
            g.Badges.Count
        )).ToList();
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    private async Task<UserGamification> GetOrCreateGamificationAsync(Guid userId)
    {
        var gamification = await _context.UserGamifications
            .Include(g => g.Badges)
            .FirstOrDefaultAsync(g => g.UserId == userId);

        if (gamification == null)
        {
            gamification = new UserGamification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Level = 1,
                CurrentXp = 0,
                TotalXpEarned = 0,
                CurrentDailyStreak = 0,
                LongestDailyStreak = 0,
                CurrentWinStreak = 0,
                LongestWinStreak = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserGamifications.Add(gamification);
            await _context.SaveChangesAsync();
        }

        return gamification;
    }

    private UserGamificationDto MapToDto(UserGamification gamification)
    {
        return new UserGamificationDto(
            gamification.Level,
            GamificationConfig.GetLevelName(gamification.Level),
            gamification.CurrentXp,
            gamification.TotalXpEarned,
            GamificationConfig.GetXpForNextLevel(gamification.Level),
            GamificationConfig.GetProgressPercentage(gamification.TotalXpEarned, gamification.Level),
            gamification.CurrentDailyStreak,
            gamification.LongestDailyStreak,
            gamification.CurrentWinStreak,
            gamification.LongestWinStreak,
            gamification.Badges.Count
        );
    }

    private static string GetDefaultDescription(XpActionType action)
    {
        return action switch
        {
            XpActionType.DailyLogin => "Connexion quotidienne",
            XpActionType.DailyLoginStreak => "Bonus streak",
            XpActionType.CreateTicket => "Création de ticket",
            XpActionType.SellTicket => "Vente de ticket",
            XpActionType.TicketWin => "Ticket gagnant",
            XpActionType.TicketLose => "Ticket perdant",
            XpActionType.TicketWinStreak => "Bonus win streak",
            XpActionType.GainSubscriber => "Nouvel abonné",
            XpActionType.LoseSubscriber => "Perte d'abonné",
            XpActionType.EarnMoney => "Gains",
            XpActionType.PurchaseTicket => "Achat de ticket",
            XpActionType.Subscribe => "Nouvel abonnement",
            XpActionType.Unsubscribe => "Désabonnement",
            XpActionType.WinPurchasedTicket => "Ticket acheté gagnant",
            XpActionType.FollowUser => "Nouveau follow",
            XpActionType.UnfollowUser => "Unfollow",
            XpActionType.FavoriteTicket => "Ticket en favoris",
            XpActionType.UnfavoriteTicket => "Retrait des favoris",
            XpActionType.ShareTicket => "Partage de ticket",
            XpActionType.ViewTicket => "Vue de ticket",
            XpActionType.ViewProfile => "Vue de profil",
            XpActionType.EarnBadge => "Badge obtenu",
            XpActionType.LevelUp => "Niveau supérieur",
            XpActionType.CompleteProfile => "Profil complété",
            XpActionType.FirstAction => "Première action",
            XpActionType.WeeklyBonus => "Bonus hebdomadaire",
            XpActionType.MonthlyBonus => "Bonus mensuel",
            XpActionType.ReferralBonus => "Parrainage",
            _ => "Action"
        };
    }

    public async Task<int> SeedExistingUsersAsync()
    {
        var random = new Random();
        var usersWithoutGamification = await _context.Users
            .Where(u => u.DeletedAt == null)
            .Where(u => !_context.UserGamifications.Any(g => g.UserId == u.Id))
            .ToListAsync();

        // Get some badges for seeding
        var allBadges = await _context.Badges.ToListAsync();

        // Define sets of badges to give based on "experience level"
        var starterBadges = allBadges
            .Where(b => b.Type == BadgeType.FirstTicketCreated ||
                        b.Type == BadgeType.FirstFollow ||
                        b.Type == BadgeType.FirstFavorite ||
                        b.Type == BadgeType.DailyStreak3 ||
                        b.Type == BadgeType.EarlyAdopter)
            .ToList();

        var intermediateBadges = allBadges
            .Where(b => b.Type == BadgeType.FirstTicketSold ||
                        b.Type == BadgeType.TenTicketsCreated ||
                        b.Type == BadgeType.FirstWin ||
                        b.Type == BadgeType.WinStreak3 ||
                        b.Type == BadgeType.DailyStreak7 ||
                        b.Type == BadgeType.FiveFollows ||
                        b.Type == BadgeType.FiveFavorites ||
                        b.Type == BadgeType.Level5 ||
                        b.Type == BadgeType.Xp1000)
            .ToList();

        var advancedBadges = allBadges
            .Where(b => b.Type == BadgeType.TenTicketsSold ||
                        b.Type == BadgeType.TenWins ||
                        b.Type == BadgeType.WinStreak5 ||
                        b.Type == BadgeType.WinRate50 ||
                        b.Type == BadgeType.DailyStreak14 ||
                        b.Type == BadgeType.TenFollows ||
                        b.Type == BadgeType.FirstPurchase ||
                        b.Type == BadgeType.Level10 ||
                        b.Type == BadgeType.Xp5000)
            .ToList();

        var seededCount = 0;

        foreach (var user in usersWithoutGamification)
        {
            // Random level between 8 and 18
            var targetLevel = random.Next(8, 19);

            // Calculate XP for target level (with some variance)
            var baseXp = GamificationConfig.LevelThresholds[targetLevel - 1];
            var xpVariance = (GamificationConfig.LevelThresholds[targetLevel] - baseXp) / 2;
            var totalXp = baseXp + random.Next(0, xpVariance);

            // Random streaks
            var dailyStreak = random.Next(1, 25);
            var winStreak = random.Next(0, 8);

            var gamification = new UserGamification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Level = targetLevel,
                CurrentXp = totalXp,
                TotalXpEarned = totalXp,
                CurrentDailyStreak = dailyStreak,
                LongestDailyStreak = Math.Max(dailyStreak, random.Next(dailyStreak, dailyStreak + 15)),
                CurrentWinStreak = winStreak,
                LongestWinStreak = Math.Max(winStreak, random.Next(winStreak, winStreak + 5)),
                LastLoginDate = DateTime.UtcNow.AddDays(-random.Next(0, 3)),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserGamifications.Add(gamification);

            // Assign badges based on level
            var badgesToAward = new List<Badge>();
            badgesToAward.AddRange(starterBadges);

            if (targetLevel >= 5)
            {
                badgesToAward.AddRange(intermediateBadges.OrderBy(_ => random.Next()).Take(random.Next(3, 6)));
            }

            if (targetLevel >= 10)
            {
                badgesToAward.AddRange(advancedBadges.OrderBy(_ => random.Next()).Take(random.Next(2, 5)));
            }

            // Remove duplicates
            badgesToAward = badgesToAward.DistinctBy(b => b.Id).ToList();

            foreach (var badge in badgesToAward)
            {
                var userBadge = new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserGamificationId = gamification.Id,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60))
                };
                _context.UserBadges.Add(userBadge);
            }

            seededCount++;
        }

        await _context.SaveChangesAsync();
        return seededCount;
    }
}

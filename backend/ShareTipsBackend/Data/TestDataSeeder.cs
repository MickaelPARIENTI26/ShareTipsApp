#if DEBUG
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using BCrypt.Net;

namespace ShareTipsBackend.Data;

/// <summary>
/// Creates realistic test data for comprehensive app testing.
/// 5 users, 30 tickets with varied configurations.
/// NOTE: This class is only compiled in DEBUG builds - excluded from Release/Production.
/// </summary>
public static class TestDataSeeder
{
    private static readonly Random _random = new(42); // Fixed seed for reproducibility

    public static async Task SeedTestDataAsync(ApplicationDbContext context)
    {
        // Skip if already seeded (check for test user)
        if (context.Users.Any(u => u.Email == "tipster1@test.com"))
        {
            Console.WriteLine("[TestDataSeeder] Test data already exists, skipping...");
            return;
        }

        Console.WriteLine("[TestDataSeeder] Creating test data...");

        // Ensure base data exists
        await DbSeeder.SeedAsync(context);

        // Create 5 users
        var users = await CreateUsersAsync(context);

        // Get existing teams and leagues for matches
        var teams = context.Teams.ToList();
        var leagues = context.Leagues.ToList();

        // Create matches (we need matches for ticket selections)
        var matches = await CreateMatchesAsync(context, teams, leagues);

        // Create 6 tickets per user (30 total)
        await CreateTicketsAsync(context, users, matches);

        // Create some purchases, favorites, and follows for realistic data
        await CreateInteractionsAsync(context, users);

        Console.WriteLine("[TestDataSeeder] Test data created successfully!");
        Console.WriteLine($"  - Users: {users.Count}");
        Console.WriteLine($"  - Matches: {matches.Count}");
        Console.WriteLine($"  - Tickets: {context.Tickets.Count()}");
    }

    private static async Task<List<User>> CreateUsersAsync(ApplicationDbContext context)
    {
        var users = new List<User>
        {
            // User 1: Pro tipster with high success
            new User
            {
                Id = Guid.NewGuid(),
                Email = "tipster1@test.com",
                Username = "ProTipster_Max",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                Role = UserRole.User,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow.AddDays(-90),
                UpdatedAt = DateTime.UtcNow
            },
            // User 2: Pro tipster specializing in football
            new User
            {
                Id = Guid.NewGuid(),
                Email = "tipster2@test.com",
                Username = "FootballGuru",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                Role = UserRole.User,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow
            },
            // User 3: Casual bettor with some tickets
            new User
            {
                Id = Guid.NewGuid(),
                Email = "bettor1@test.com",
                Username = "CasualBettor",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                Role = UserRole.User,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow.AddDays(-45),
                UpdatedAt = DateTime.UtcNow
            },
            // User 4: New user exploring the platform
            new User
            {
                Id = Guid.NewGuid(),
                Email = "newuser@test.com",
                Username = "NewExplorer",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                Role = UserRole.User,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow
            },
            // User 5: E-sport specialist
            new User
            {
                Id = Guid.NewGuid(),
                Email = "esport@test.com",
                Username = "EsportKing",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"),
                Role = UserRole.User,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        // Create wallets for each user
        var wallets = users.Select(u => new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = u.Id,
            TipsterBalanceCents = _random.Next(1000, 50000),
            PendingPayoutCents = 0,
            CreatedAt = u.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        context.Wallets.AddRange(wallets);

        // Create notification preferences for each user
        var prefs = users.Select(u => new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = u.Id,
            NewTicket = true,
            MatchStart = true,
            TicketResult = true,
            SubscriptionExpire = true,
            CreatedAt = u.CreatedAt,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        context.NotificationPreferences.AddRange(prefs);
        await context.SaveChangesAsync();

        return users;
    }

    private static async Task<List<Match>> CreateMatchesAsync(
        ApplicationDbContext context,
        List<Team> teams,
        List<League> leagues)
    {
        var matches = new List<Match>();

        // Football matches
        var footballTeams = teams.Where(t => t.SportCode == "FOOTBALL").ToList();
        var footballLeagues = leagues.Where(l => l.SportCode == "FOOTBALL").ToList();

        if (footballTeams.Count >= 2 && footballLeagues.Count > 0)
        {
            for (int i = 0; i < 15; i++)
            {
                var homeIdx = i % footballTeams.Count;
                var awayIdx = (i + 1) % footballTeams.Count;
                var league = footballLeagues[i % footballLeagues.Count];

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    SportCode = "FOOTBALL",
                    LeagueId = league.Id,
                    HomeTeamId = footballTeams[homeIdx].Id,
                    AwayTeamId = footballTeams[awayIdx].Id,
                    StartTime = DateTime.UtcNow.AddHours(_random.Next(-48, 168)), // -2 days to +7 days
                    Status = i < 5 ? MatchStatus.Finished : (i < 10 ? MatchStatus.Scheduled : MatchStatus.Live),
                    HomeScore = i < 5 ? _random.Next(0, 4) : null,
                    AwayScore = i < 5 ? _random.Next(0, 3) : null,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow
                };
                matches.Add(match);
            }
        }

        // Basketball matches
        var basketballTeams = teams.Where(t => t.SportCode == "BASKETBALL").ToList();
        var basketballLeagues = leagues.Where(l => l.SportCode == "BASKETBALL").ToList();

        if (basketballTeams.Count >= 2 && basketballLeagues.Count > 0)
        {
            for (int i = 0; i < 10; i++)
            {
                var homeIdx = i % basketballTeams.Count;
                var awayIdx = (i + 1) % basketballTeams.Count;
                var league = basketballLeagues[i % basketballLeagues.Count];

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    SportCode = "BASKETBALL",
                    LeagueId = league.Id,
                    HomeTeamId = basketballTeams[homeIdx].Id,
                    AwayTeamId = basketballTeams[awayIdx].Id,
                    StartTime = DateTime.UtcNow.AddHours(_random.Next(-24, 120)),
                    Status = i < 3 ? MatchStatus.Finished : MatchStatus.Scheduled,
                    HomeScore = i < 3 ? _random.Next(95, 130) : null,
                    AwayScore = i < 3 ? _random.Next(90, 125) : null,
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow
                };
                matches.Add(match);
            }
        }

        // E-sport matches
        var esportTeams = teams.Where(t => t.SportCode == "ESPORT").ToList();
        var esportLeagues = leagues.Where(l => l.SportCode == "ESPORT").ToList();

        if (esportTeams.Count >= 2 && esportLeagues.Count > 0)
        {
            for (int i = 0; i < 8; i++)
            {
                var homeIdx = i % esportTeams.Count;
                var awayIdx = (i + 1) % esportTeams.Count;
                var league = esportLeagues[i % esportLeagues.Count];

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    SportCode = "ESPORT",
                    LeagueId = league.Id,
                    HomeTeamId = esportTeams[homeIdx].Id,
                    AwayTeamId = esportTeams[awayIdx].Id,
                    StartTime = DateTime.UtcNow.AddHours(_random.Next(-12, 72)),
                    Status = i < 2 ? MatchStatus.Finished : MatchStatus.Scheduled,
                    HomeScore = i < 2 ? _random.Next(0, 3) : null,
                    AwayScore = i < 2 ? _random.Next(0, 3) : null,
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow
                };
                matches.Add(match);
            }
        }

        context.Matches.AddRange(matches);
        await context.SaveChangesAsync();

        // Create markets for each match
        foreach (var match in matches)
        {
            var markets = CreateMarketsForMatch(match);
            context.Markets.AddRange(markets);
        }
        await context.SaveChangesAsync();

        return matches;
    }

    private static List<Market> CreateMarketsForMatch(Match match)
    {
        var markets = new List<Market>();

        // 1X2 Market (Match Result)
        var matchResultMarket = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.MatchResult,
            Label = "Resultat du match",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        matchResultMarket.Selections = new List<MarketSelection>
        {
            new MarketSelection { Id = Guid.NewGuid(), MarketId = matchResultMarket.Id, Code = "HOME_WIN", Label = "1", Odds = GenerateOdds(1.5m, 3.5m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = matchResultMarket.Id, Code = "DRAW", Label = "X", Odds = GenerateOdds(3.0m, 4.5m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = matchResultMarket.Id, Code = "AWAY_WIN", Label = "2", Odds = GenerateOdds(2.0m, 5.0m), IsActive = true }
        };
        markets.Add(matchResultMarket);

        // Over/Under 2.5 Market
        var overUnderMarket = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.OverUnder,
            Label = "Plus/Moins 2.5 buts",
            Line = 2.5m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        overUnderMarket.Selections = new List<MarketSelection>
        {
            new MarketSelection { Id = Guid.NewGuid(), MarketId = overUnderMarket.Id, Code = "OVER", Label = "Plus de 2.5", Odds = GenerateOdds(1.7m, 2.2m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = overUnderMarket.Id, Code = "UNDER", Label = "Moins de 2.5", Odds = GenerateOdds(1.6m, 2.1m), IsActive = true }
        };
        markets.Add(overUnderMarket);

        // Both Teams Score Market
        var bttsMarket = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.BothTeamsScore,
            Label = "Les deux equipes marquent",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        bttsMarket.Selections = new List<MarketSelection>
        {
            new MarketSelection { Id = Guid.NewGuid(), MarketId = bttsMarket.Id, Code = "YES", Label = "Oui", Odds = GenerateOdds(1.6m, 2.0m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = bttsMarket.Id, Code = "NO", Label = "Non", Odds = GenerateOdds(1.7m, 2.3m), IsActive = true }
        };
        markets.Add(bttsMarket);

        // Double Chance Market
        var doubleChanceMarket = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.DoubleChance,
            Label = "Double chance",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        doubleChanceMarket.Selections = new List<MarketSelection>
        {
            new MarketSelection { Id = Guid.NewGuid(), MarketId = doubleChanceMarket.Id, Code = "1X", Label = "1X", Odds = GenerateOdds(1.2m, 1.6m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = doubleChanceMarket.Id, Code = "X2", Label = "X2", Odds = GenerateOdds(1.3m, 1.7m), IsActive = true },
            new MarketSelection { Id = Guid.NewGuid(), MarketId = doubleChanceMarket.Id, Code = "12", Label = "12", Odds = GenerateOdds(1.1m, 1.4m), IsActive = true }
        };
        markets.Add(doubleChanceMarket);

        return markets;
    }

    private static decimal GenerateOdds(decimal min, decimal max)
    {
        var range = max - min;
        return Math.Round(min + (decimal)_random.NextDouble() * range, 2);
    }

    private static async Task CreateTicketsAsync(
        ApplicationDbContext context,
        List<User> users,
        List<Match> matches)
    {
        var allTickets = new List<Ticket>();
        var allSelections = new List<TicketSelection>();

        // Get all markets with selections for creating ticket selections
        var marketsWithSelections = context.Markets
            .Include(m => m.Selections)
            .ToList();

        foreach (var user in users)
        {
            // 6 tickets per user
            var userTickets = new List<(bool IsPublic, int PriceCents, int Confidence, TicketStatus Status, TicketResult Result)>
            {
                // 3 public free tickets
                (true, 0, _random.Next(5, 10), TicketStatus.Open, TicketResult.Pending),
                (true, 0, _random.Next(3, 8), TicketStatus.Finished, TicketResult.Win),
                (true, 0, _random.Next(4, 9), TicketStatus.Finished, TicketResult.Lose),
                // 2 private paid tickets
                (false, _random.Next(500, 3000), _random.Next(7, 10), TicketStatus.Open, TicketResult.Pending),
                (false, _random.Next(1000, 5000), _random.Next(6, 9), TicketStatus.Locked, TicketResult.Pending),
                // 1 mixed (public but paid)
                (true, _random.Next(200, 1000), _random.Next(5, 8), TicketStatus.Open, TicketResult.Pending)
            };

            for (int i = 0; i < userTickets.Count; i++)
            {
                var config = userTickets[i];
                var ticketId = Guid.NewGuid();

                // Select 2-5 random matches
                var numSelections = _random.Next(2, 6);
                var selectedMatches = matches
                    .OrderBy(_ => _random.Next())
                    .Take(numSelections)
                    .ToList();

                // Create ticket selections
                var ticketSelections = new List<TicketSelection>();
                decimal totalOdds = 1m;
                var sports = new HashSet<string>();

                foreach (var match in selectedMatches)
                {
                    var matchMarkets = marketsWithSelections.Where(m => m.MatchId == match.Id).ToList();
                    if (matchMarkets.Count == 0) continue;

                    var market = matchMarkets[_random.Next(matchMarkets.Count)];
                    var selections = market.Selections.ToList();
                    if (selections.Count == 0) continue;

                    var selection = selections[_random.Next(selections.Count)];

                    var homeTeam = context.Teams.Find(match.HomeTeamId);
                    var awayTeam = context.Teams.Find(match.AwayTeamId);
                    var league = context.Leagues.Find(match.LeagueId);

                    var ticketSelection = new TicketSelection
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticketId,
                        MatchId = match.Id,
                        MarketType = market.Type.ToString(),
                        SelectionLabel = selection.Label,
                        Odds = selection.Odds,
                        MatchLabel = $"{homeTeam?.ShortName ?? "Home"} vs {awayTeam?.ShortName ?? "Away"}",
                        LeagueName = league?.Name ?? "League"
                    };

                    ticketSelections.Add(ticketSelection);
                    totalOdds *= selection.Odds;
                    sports.Add(match.SportCode);
                }

                if (ticketSelections.Count == 0) continue;

                var ticket = new Ticket
                {
                    Id = ticketId,
                    CreatorId = user.Id,
                    Title = GenerateTicketTitle(user.Username, i, config.IsPublic, sports.First()),
                    IsPublic = config.IsPublic,
                    PriceCents = config.PriceCents,
                    ConfidenceIndex = config.Confidence,
                    AvgOdds = Math.Round(totalOdds, 2),
                    Sports = sports.ToArray(),
                    FirstMatchTime = selectedMatches.Min(m => m.StartTime),
                    Status = config.Status,
                    Result = config.Result,
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 14)),
                    DeletedAt = null
                };

                allTickets.Add(ticket);
                allSelections.AddRange(ticketSelections);
            }
        }

        context.Tickets.AddRange(allTickets);
        context.TicketSelections.AddRange(allSelections);
        await context.SaveChangesAsync();
    }

    private static string GenerateTicketTitle(string username, int index, bool isPublic, string sport)
    {
        var titles = new[]
        {
            $"Combo {sport} du jour",
            $"Picks surs {sport}",
            $"Valeur sure - {sport}",
            $"Analyse complete {sport}",
            $"Selection premium {sport}",
            $"Pronostic du jour {sport}"
        };

        var prefix = isPublic ? "" : "[VIP] ";
        return prefix + titles[index % titles.Length];
    }

    private static async Task CreateInteractionsAsync(ApplicationDbContext context, List<User> users)
    {
        var tickets = context.Tickets.ToList();

        // Create some purchases (user buys other users' tickets)
        var purchases = new List<TicketPurchase>();
        foreach (var user in users.Take(3))
        {
            var availableTickets = tickets
                .Where(t => t.CreatorId != user.Id && t.PriceCents > 0)
                .OrderBy(_ => _random.Next())
                .Take(2);

            foreach (var ticket in availableTickets)
            {
                purchases.Add(new TicketPurchase
                {
                    Id = Guid.NewGuid(),
                    TicketId = ticket.Id,
                    BuyerId = user.Id,
                    PriceCents = ticket.PriceCents,
                    CommissionCents = (int)(ticket.PriceCents * 0.17),
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 7))
                });
            }
        }
        context.TicketPurchases.AddRange(purchases);

        // Create some favorites
        var favorites = new List<FavoriteTicket>();
        foreach (var user in users)
        {
            var favoriteTickets = tickets
                .Where(t => t.CreatorId != user.Id)
                .OrderBy(_ => _random.Next())
                .Take(_random.Next(1, 5));

            foreach (var ticket in favoriteTickets)
            {
                favorites.Add(new FavoriteTicket
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    TicketId = ticket.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 10))
                });
            }
        }
        context.FavoriteTickets.AddRange(favorites);

        // Create some follows (users follow tipsters)
        var follows = new List<UserFollow>();

        foreach (var follower in users)
        {
            foreach (var tipster in users.OrderBy(_ => _random.Next()).Take(2))
            {
                if (follower.Id != tipster.Id)
                {
                    follows.Add(new UserFollow
                    {
                        Id = Guid.NewGuid(),
                        FollowerUserId = follower.Id,
                        FollowedUserId = tipster.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 20))
                    });
                }
            }
        }
        context.UserFollows.AddRange(follows);

        // Create some subscriptions
        var subscriptions = new List<Subscription>();
        foreach (var follower in users.Take(2))
        {
            var tipster = users.FirstOrDefault(t => t.Id != follower.Id);
            if (tipster != null)
            {
                subscriptions.Add(new Subscription
                {
                    Id = Guid.NewGuid(),
                    SubscriberId = follower.Id,
                    TipsterId = tipster.Id,
                    PriceCents = 500,
                    CommissionCents = (int)(500 * 0.17),
                    StartDate = DateTime.UtcNow.AddDays(-10),
                    EndDate = DateTime.UtcNow.AddDays(20),
                    Status = SubscriptionStatus.Active,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                });
            }
        }
        context.Subscriptions.AddRange(subscriptions);

        // Create some notifications
        var notifications = new List<Notification>();
        foreach (var user in users)
        {
            notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Type = NotificationType.NewTicket,
                Title = "Nouveau ticket disponible",
                Message = "Un pronostiqueur que vous suivez a publie un nouveau ticket",
                DataJson = null,
                IsRead = _random.Next(2) == 0,
                CreatedAt = DateTime.UtcNow.AddHours(-_random.Next(1, 48))
            });

            if (_random.Next(2) == 0)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = NotificationType.TicketWon,
                    Title = "Pronostic valide !",
                    Message = "Votre pronostic a ete valide",
                    DataJson = null,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-_random.Next(1, 24))
                });
            }
        }
        context.Notifications.AddRange(notifications);

        await context.SaveChangesAsync();
    }
}
#endif

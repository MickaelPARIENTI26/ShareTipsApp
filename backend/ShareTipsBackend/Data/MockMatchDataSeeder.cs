#if DEBUG
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;

namespace ShareTipsBackend.Data;

/// <summary>
/// Creates comprehensive mock data for demo/investor presentations.
/// 20+ matches across Football, Basketball, and Tennis with 5-20+ markets each.
/// NOTE: This class is only compiled in DEBUG builds.
/// </summary>
public static class MockMatchDataSeeder
{
    private static readonly Random _random = new(2026); // Fixed seed for reproducibility

    public static async Task SeedMockDataAsync(ApplicationDbContext context)
    {
        // Check if mock data already exists
        if (context.Matches.Any(m => m.ExternalId != null && m.ExternalId.StartsWith("MOCK_")))
        {
            Console.WriteLine("[MockMatchDataSeeder] Mock data already exists, skipping...");
            return;
        }

        Console.WriteLine("[MockMatchDataSeeder] Creating comprehensive mock data for demo...");

        // Ensure base leagues exist
        await EnsureLeaguesExistAsync(context);

        // Create additional teams for variety
        await CreateAdditionalTeamsAsync(context);

        // Create tennis players (as "teams" since tennis uses the same structure)
        await CreateTennisPlayersAsync(context);

        // Create players for player props
        await CreatePlayersAsync(context);

        // Create all matches with comprehensive markets
        var footballMatches = await CreateFootballMatchesAsync(context);
        var basketballMatches = await CreateBasketballMatchesAsync(context);
        var tennisMatches = await CreateTennisMatchesAsync(context);

        await context.SaveChangesAsync();

        Console.WriteLine("[MockMatchDataSeeder] Mock data created successfully!");
        Console.WriteLine($"  - Football matches: {footballMatches.Count} with comprehensive markets");
        Console.WriteLine($"  - Basketball matches: {basketballMatches.Count} with comprehensive markets");
        Console.WriteLine($"  - Tennis matches: {tennisMatches.Count} with comprehensive markets");
        Console.WriteLine($"  - Total markets created: {context.Markets.Local.Count}");
    }

    private static async Task EnsureLeaguesExistAsync(ApplicationDbContext context)
    {
        var existingLeagues = context.Leagues.Select(l => l.Name).ToHashSet();

        var newLeagues = new List<League>();

        // Football
        if (!existingLeagues.Contains("Champions League"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Champions League", Country = "EU", IsActive = true });
        if (!existingLeagues.Contains("Europa League"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Europa League", Country = "EU", IsActive = true });
        if (!existingLeagues.Contains("Coupe de France"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Coupe de France", Country = "FR", IsActive = true });

        // Basketball
        if (!existingLeagues.Contains("NCAA Basketball"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "NCAA Basketball", Country = "US", IsActive = true });
        if (!existingLeagues.Contains("Pro A"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Pro A", Country = "FR", IsActive = true });

        // Tennis
        if (!existingLeagues.Contains("ATP Tour"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "ATP Tour", Country = "WORLD", IsActive = true });
        if (!existingLeagues.Contains("WTA Tour"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "WTA Tour", Country = "WORLD", IsActive = true });
        if (!existingLeagues.Contains("ATP 1000 - Dubai"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "ATP 1000 - Dubai", Country = "UAE", IsActive = true });
        if (!existingLeagues.Contains("ATP 500 - Rotterdam"))
            newLeagues.Add(new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "ATP 500 - Rotterdam", Country = "NL", IsActive = true });

        if (newLeagues.Count > 0)
        {
            context.Leagues.AddRange(newLeagues);
            await context.SaveChangesAsync();
        }
    }

    private static async Task CreateAdditionalTeamsAsync(ApplicationDbContext context)
    {
        var existingTeams = context.Teams.Select(t => t.Name).ToHashSet();

        var newTeams = new List<Team>
        {
            // Premier League
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Arsenal FC", ShortName = "ARS", Country = "GB", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Chelsea FC", ShortName = "CHE", Country = "GB", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Manchester United", ShortName = "MUN", Country = "GB", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Tottenham Hotspur", ShortName = "TOT", Country = "GB", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Newcastle United", ShortName = "NEW", Country = "GB", IsActive = true },

            // Ligue 1
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "AS Monaco", ShortName = "MON", Country = "FR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "LOSC Lille", ShortName = "LIL", Country = "FR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Stade Rennais", ShortName = "REN", Country = "FR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "OGC Nice", ShortName = "NIC", Country = "FR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "RC Lens", ShortName = "LEN", Country = "FR", IsActive = true },

            // Serie A
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Juventus FC", ShortName = "JUV", Country = "IT", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "AC Milan", ShortName = "MIL", Country = "IT", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Inter Milan", ShortName = "INT", Country = "IT", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "AS Roma", ShortName = "ROM", Country = "IT", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "SSC Napoli", ShortName = "NAP", Country = "IT", IsActive = true },

            // La Liga
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Atletico Madrid", ShortName = "ATM", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Sevilla FC", ShortName = "SEV", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Real Sociedad", ShortName = "RSO", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Athletic Bilbao", ShortName = "ATH", Country = "ES", IsActive = true },

            // Bundesliga
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Bayern Munich", ShortName = "BAY", Country = "DE", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Borussia Dortmund", ShortName = "BVB", Country = "DE", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "RB Leipzig", ShortName = "RBL", Country = "DE", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Bayer Leverkusen", ShortName = "LEV", Country = "DE", IsActive = true },

            // NBA Teams
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Denver Nuggets", ShortName = "DEN", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Phoenix Suns", ShortName = "PHX", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Milwaukee Bucks", ShortName = "MIL", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Philadelphia 76ers", ShortName = "PHI", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Dallas Mavericks", ShortName = "DAL", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "New York Knicks", ShortName = "NYK", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Brooklyn Nets", ShortName = "BKN", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Cleveland Cavaliers", ShortName = "CLE", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Memphis Grizzlies", ShortName = "MEM", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Sacramento Kings", ShortName = "SAC", Country = "US", IsActive = true },

            // EuroLeague Teams
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Real Madrid Baloncesto", ShortName = "RMB", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "FC Barcelona Basquet", ShortName = "FCB", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Olympiacos BC", ShortName = "OLY", Country = "GR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Panathinaikos BC", ShortName = "PAN", Country = "GR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "ASVEL Lyon-Villeurbanne", ShortName = "ASV", Country = "FR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "AS Monaco Basket", ShortName = "ASM", Country = "FR", IsActive = true },
        };

        var teamsToAdd = newTeams.Where(t => !existingTeams.Contains(t.Name)).ToList();
        if (teamsToAdd.Count > 0)
        {
            context.Teams.AddRange(teamsToAdd);
            await context.SaveChangesAsync();
        }
    }

    private static async Task CreateTennisPlayersAsync(ApplicationDbContext context)
    {
        var existingTeams = context.Teams.Where(t => t.SportCode == "TENNIS").Select(t => t.Name).ToHashSet();

        // For tennis, we create "teams" that represent individual players
        var tennisPlayers = new List<Team>
        {
            // ATP Top Players
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Novak Djokovic", ShortName = "DJO", Country = "RS", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Carlos Alcaraz", ShortName = "ALC", Country = "ES", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Jannik Sinner", ShortName = "SIN", Country = "IT", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Daniil Medvedev", ShortName = "MED", Country = "RU", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Alexander Zverev", ShortName = "ZVE", Country = "DE", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Andrey Rublev", ShortName = "RUB", Country = "RU", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Holger Rune", ShortName = "RUN", Country = "DK", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Stefanos Tsitsipas", ShortName = "TSI", Country = "GR", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Taylor Fritz", ShortName = "FRI", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Frances Tiafoe", ShortName = "TIA", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Hubert Hurkacz", ShortName = "HUR", Country = "PL", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Casper Ruud", ShortName = "RUU", Country = "NO", IsActive = true },

            // WTA Top Players
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Iga Swiatek", ShortName = "SWI", Country = "PL", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Aryna Sabalenka", ShortName = "SAB", Country = "BY", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Coco Gauff", ShortName = "GAU", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Elena Rybakina", ShortName = "RYB", Country = "KZ", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Jessica Pegula", ShortName = "PEG", Country = "US", IsActive = true },
            new Team { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "Ons Jabeur", ShortName = "JAB", Country = "TN", IsActive = true },
        };

        var playersToAdd = tennisPlayers.Where(t => !existingTeams.Contains(t.Name)).ToList();
        if (playersToAdd.Count > 0)
        {
            context.Teams.AddRange(playersToAdd);
            await context.SaveChangesAsync();
        }
    }

    private static async Task CreatePlayersAsync(ApplicationDbContext context)
    {
        var teams = context.Teams.ToList();
        var existingPlayers = context.Players.Select(p => p.Name).ToHashSet();

        var newPlayers = new List<Player>();

        // Football players by team
        var playerData = new Dictionary<string, List<(string Name, string Position, int Number)>>
        {
            ["Paris Saint-Germain"] = new()
            {
                ("Ousmane Dembele", "RW", 10), ("Bradley Barcola", "LW", 29), ("Randal Kolo Muani", "ST", 23),
                ("Marco Asensio", "AM", 11), ("Goncalo Ramos", "ST", 9), ("Fabian Ruiz", "CM", 8),
                ("Warren Zaire-Emery", "CM", 33), ("Vitinha", "CM", 17), ("Nuno Mendes", "LB", 25)
            },
            ["Olympique de Marseille"] = new()
            {
                ("Pierre-Emerick Aubameyang", "ST", 10), ("Jonathan Clauss", "RB", 7), ("Amine Harit", "AM", 11),
                ("Chancel Mbemba", "CB", 99), ("Valentin Rongier", "CM", 21), ("Luis Henrique", "RW", 18)
            },
            ["Manchester City"] = new()
            {
                ("Erling Haaland", "ST", 9), ("Kevin De Bruyne", "AM", 17), ("Phil Foden", "LW", 47),
                ("Bernardo Silva", "RW", 20), ("Rodri", "DM", 16), ("Jack Grealish", "LW", 10),
                ("Julian Alvarez", "ST", 19), ("Jeremy Doku", "RW", 11)
            },
            ["Liverpool FC"] = new()
            {
                ("Mohamed Salah", "RW", 11), ("Darwin Nunez", "ST", 9), ("Luis Diaz", "LW", 7),
                ("Diogo Jota", "ST", 20), ("Cody Gakpo", "LW", 18), ("Alexis Mac Allister", "CM", 10),
                ("Dominik Szoboszlai", "AM", 8), ("Trent Alexander-Arnold", "RB", 66)
            },
            ["Real Madrid"] = new()
            {
                ("Vinicius Junior", "LW", 7), ("Jude Bellingham", "AM", 5), ("Rodrygo", "RW", 11),
                ("Kylian Mbappe", "ST", 9), ("Federico Valverde", "CM", 15), ("Luka Modric", "CM", 10),
                ("Toni Kroos", "CM", 8), ("Eduardo Camavinga", "CM", 12)
            },
            ["FC Barcelona"] = new()
            {
                ("Robert Lewandowski", "ST", 9), ("Lamine Yamal", "RW", 19), ("Raphinha", "LW", 11),
                ("Pedri", "CM", 8), ("Gavi", "CM", 6), ("Frenkie de Jong", "CM", 21),
                ("Joao Felix", "AM", 14), ("Ferran Torres", "RW", 7)
            },
            ["Bayern Munich"] = new()
            {
                ("Harry Kane", "ST", 9), ("Jamal Musiala", "AM", 42), ("Leroy Sane", "RW", 10),
                ("Serge Gnabry", "RW", 7), ("Thomas Muller", "AM", 25), ("Joshua Kimmich", "DM", 6),
                ("Leon Goretzka", "CM", 8), ("Kingsley Coman", "LW", 11)
            },
            ["Borussia Dortmund"] = new()
            {
                ("Niclas Fullkrug", "ST", 14), ("Karim Adeyemi", "LW", 27), ("Julian Brandt", "AM", 10),
                ("Marco Reus", "AM", 11), ("Jamie Bynoe-Gittens", "RW", 43), ("Donyell Malen", "RW", 21)
            },
            ["Juventus FC"] = new()
            {
                ("Dusan Vlahovic", "ST", 9), ("Federico Chiesa", "RW", 7), ("Arkadiusz Milik", "ST", 14),
                ("Kenan Yildiz", "AM", 10), ("Adrien Rabiot", "CM", 25), ("Manuel Locatelli", "CM", 5)
            },
            ["Inter Milan"] = new()
            {
                ("Lautaro Martinez", "ST", 10), ("Marcus Thuram", "ST", 9), ("Hakan Calhanoglu", "CM", 20),
                ("Nicolo Barella", "CM", 23), ("Federico Dimarco", "LB", 32), ("Henrikh Mkhitaryan", "AM", 22)
            },
        };

        // NBA players
        var nbaPlayerData = new Dictionary<string, List<(string Name, string Position, int Number)>>
        {
            ["Los Angeles Lakers"] = new()
            {
                ("LeBron James", "SF", 23), ("Anthony Davis", "PF", 3), ("Austin Reaves", "SG", 15),
                ("D'Angelo Russell", "PG", 1), ("Rui Hachimura", "PF", 28)
            },
            ["Golden State Warriors"] = new()
            {
                ("Stephen Curry", "PG", 30), ("Klay Thompson", "SG", 11), ("Andrew Wiggins", "SF", 22),
                ("Draymond Green", "PF", 23), ("Jonathan Kuminga", "SF", 0)
            },
            ["Boston Celtics"] = new()
            {
                ("Jayson Tatum", "SF", 0), ("Jaylen Brown", "SG", 7), ("Kristaps Porzingis", "C", 8),
                ("Derrick White", "PG", 9), ("Jrue Holiday", "PG", 4)
            },
            ["Denver Nuggets"] = new()
            {
                ("Nikola Jokic", "C", 15), ("Jamal Murray", "PG", 27), ("Michael Porter Jr.", "SF", 1),
                ("Aaron Gordon", "PF", 50), ("Kentavious Caldwell-Pope", "SG", 5)
            },
            ["Phoenix Suns"] = new()
            {
                ("Kevin Durant", "SF", 35), ("Devin Booker", "SG", 1), ("Bradley Beal", "SG", 3),
                ("Jusuf Nurkic", "C", 20), ("Grayson Allen", "SG", 0)
            },
            ["Milwaukee Bucks"] = new()
            {
                ("Giannis Antetokounmpo", "PF", 34), ("Damian Lillard", "PG", 0), ("Khris Middleton", "SF", 22),
                ("Brook Lopez", "C", 11), ("Bobby Portis", "PF", 9)
            },
            ["Dallas Mavericks"] = new()
            {
                ("Luka Doncic", "PG", 77), ("Kyrie Irving", "PG", 11), ("Tim Hardaway Jr.", "SG", 11),
                ("Dereck Lively II", "C", 2), ("Josh Green", "SF", 8)
            },
            ["Philadelphia 76ers"] = new()
            {
                ("Joel Embiid", "C", 21), ("Tyrese Maxey", "PG", 0), ("Tobias Harris", "PF", 12),
                ("De'Anthony Melton", "SG", 8), ("Kelly Oubre Jr.", "SF", 9)
            },
        };

        foreach (var (teamName, players) in playerData)
        {
            var team = teams.FirstOrDefault(t => t.Name == teamName);
            if (team == null) continue;

            foreach (var (name, position, number) in players)
            {
                if (!existingPlayers.Contains(name))
                {
                    newPlayers.Add(new Player
                    {
                        Id = Guid.NewGuid(),
                        TeamId = team.Id,
                        Name = name,
                        Position = position,
                        JerseyNumber = number,
                        IsActive = true
                    });
                }
            }
        }

        foreach (var (teamName, players) in nbaPlayerData)
        {
            var team = teams.FirstOrDefault(t => t.Name == teamName);
            if (team == null) continue;

            foreach (var (name, position, number) in players)
            {
                if (!existingPlayers.Contains(name))
                {
                    newPlayers.Add(new Player
                    {
                        Id = Guid.NewGuid(),
                        TeamId = team.Id,
                        Name = name,
                        Position = position,
                        JerseyNumber = number,
                        IsActive = true
                    });
                }
            }
        }

        if (newPlayers.Count > 0)
        {
            context.Players.AddRange(newPlayers);
            await context.SaveChangesAsync();
        }
    }

    #region Football Matches
    private static Task<List<Match>> CreateFootballMatchesAsync(ApplicationDbContext context)
    {
        var matches = new List<Match>();
        var teams = context.Teams.Where(t => t.SportCode == "FOOTBALL").ToList();
        var leagues = context.Leagues.Where(l => l.SportCode == "FOOTBALL").ToList();
        var players = context.Players.ToList();

        var baseDate = DateTime.UtcNow.Date;

        // Match configurations: (HomeTeam, AwayTeam, League, DaysFromNow, Hour, HomeOdds, DrawOdds, AwayOdds)
        var matchConfigs = new List<(string Home, string Away, string League, int Days, int Hour, decimal H, decimal D, decimal A)>
        {
            // Ligue 1 - Journee 24
            ("Paris Saint-Germain", "Olympique de Marseille", "Ligue 1", 1, 21, 1.45m, 4.50m, 6.50m),     // Le Classique
            ("Olympique Lyonnais", "AS Monaco", "Ligue 1", 2, 17, 2.10m, 3.40m, 3.30m),
            ("LOSC Lille", "RC Lens", "Ligue 1", 2, 21, 2.30m, 3.20m, 3.10m),                             // Derby du Nord
            ("OGC Nice", "Stade Rennais", "Ligue 1", 3, 19, 2.05m, 3.30m, 3.60m),

            // Premier League
            ("Manchester City", "Liverpool FC", "Premier League", 1, 17, 1.90m, 3.60m, 3.80m),           // Top of the table clash
            ("Arsenal FC", "Chelsea FC", "Premier League", 2, 14, 1.85m, 3.50m, 4.20m),                  // London Derby
            ("Manchester United", "Tottenham Hotspur", "Premier League", 3, 16, 2.20m, 3.40m, 3.20m),
            ("Newcastle United", "Chelsea FC", "Premier League", 4, 20, 2.40m, 3.30m, 2.90m),

            // Serie A
            ("Inter Milan", "AC Milan", "Serie A", 1, 20, 1.80m, 3.50m, 4.50m),                          // Derby della Madonnina
            ("Juventus FC", "SSC Napoli", "Serie A", 2, 18, 2.30m, 3.30m, 3.00m),

            // La Liga
            ("Real Madrid", "FC Barcelona", "La Liga", 3, 21, 2.10m, 3.40m, 3.30m),                      // El Clasico
            ("Atletico Madrid", "Sevilla FC", "La Liga", 4, 19, 1.70m, 3.60m, 5.00m),

            // Bundesliga
            ("Bayern Munich", "Borussia Dortmund", "Bundesliga", 2, 18, 1.55m, 4.20m, 5.50m),            // Der Klassiker
            ("RB Leipzig", "Bayer Leverkusen", "Bundesliga", 3, 15, 2.40m, 3.40m, 2.85m),

            // Champions League
            ("Real Madrid", "Manchester City", "Champions League", 5, 21, 2.25m, 3.50m, 3.00m),
            ("Paris Saint-Germain", "Bayern Munich", "Champions League", 5, 21, 2.60m, 3.40m, 2.65m),
        };

        foreach (var config in matchConfigs)
        {
            var homeTeam = teams.FirstOrDefault(t => t.Name == config.Home);
            var awayTeam = teams.FirstOrDefault(t => t.Name == config.Away);
            var league = leagues.FirstOrDefault(l => l.Name == config.League);

            if (homeTeam == null || awayTeam == null || league == null) continue;

            var match = new Match
            {
                Id = Guid.NewGuid(),
                ExternalId = $"MOCK_FB_{Guid.NewGuid().ToString()[..8]}",
                SportCode = "FOOTBALL",
                LeagueId = league.Id,
                HomeTeamId = homeTeam.Id,
                AwayTeamId = awayTeam.Id,
                StartTime = baseDate.AddDays(config.Days).AddHours(config.Hour),
                Status = MatchStatus.Scheduled,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var homePlayers = players.Where(p => p.TeamId == homeTeam.Id).ToList();
            var awayPlayers = players.Where(p => p.TeamId == awayTeam.Id).ToList();

            // Create comprehensive markets
            var markets = CreateFootballMarkets(match, homeTeam, awayTeam, config.H, config.D, config.A, homePlayers, awayPlayers);
            match.Markets = markets;

            matches.Add(match);
            context.Matches.Add(match);
        }

        return Task.FromResult(matches);
    }

    private static List<Market> CreateFootballMarkets(
        Match match, Team homeTeam, Team awayTeam,
        decimal homeOdds, decimal drawOdds, decimal awayOdds,
        List<Player> homePlayers, List<Player> awayPlayers)
    {
        var markets = new List<Market>();

        // 1. MATCH RESULT (1X2)
        markets.Add(CreateMarket(match.Id, MarketType.MatchResult, "Resultat du match", null, new[]
        {
            ("HOME_WIN", "1", homeOdds),
            ("DRAW", "X", drawOdds),
            ("AWAY_WIN", "2", awayOdds)
        }));

        // 2. DOUBLE CHANCE
        markets.Add(CreateMarket(match.Id, MarketType.DoubleChance, "Double chance", null, new[]
        {
            ("1X", "1X (Dom. ou Nul)", CalculateDoubleChance(homeOdds, drawOdds)),
            ("X2", "X2 (Nul ou Ext.)", CalculateDoubleChance(drawOdds, awayOdds)),
            ("12", "12 (Dom. ou Ext.)", CalculateDoubleChance(homeOdds, awayOdds))
        }));

        // 3. DRAW NO BET
        markets.Add(CreateMarket(match.Id, MarketType.DrawNoBet, "Draw No Bet", null, new[]
        {
            ("HOME_DNB", homeTeam.ShortName!, homeOdds * 0.75m),
            ("AWAY_DNB", awayTeam.ShortName!, awayOdds * 0.75m)
        }));

        // 4. OVER/UNDER GOALS (Multiple Lines)
        var ouLines = new[] { 0.5m, 1.5m, 2.5m, 3.5m, 4.5m, 5.5m };
        var baseOverOdds = new[] { 1.08m, 1.35m, 1.85m, 2.60m, 4.00m, 7.00m };
        var baseUnderOdds = new[] { 8.00m, 3.00m, 1.95m, 1.50m, 1.22m, 1.08m };

        for (int i = 0; i < ouLines.Length; i++)
        {
            markets.Add(CreateMarket(match.Id, MarketType.OverUnderAlternate, $"Plus/Moins {ouLines[i]} buts", ouLines[i], new[]
            {
                ("OVER", $"Plus de {ouLines[i]}", Randomize(baseOverOdds[i])),
                ("UNDER", $"Moins de {ouLines[i]}", Randomize(baseUnderOdds[i]))
            }));
        }

        // 5. BOTH TEAMS TO SCORE
        markets.Add(CreateMarket(match.Id, MarketType.BothTeamsScore, "Les deux equipes marquent", null, new[]
        {
            ("YES", "Oui", Randomize(1.72m)),
            ("NO", "Non", Randomize(2.05m))
        }));

        // 6. HALF-TIME RESULT
        markets.Add(CreateMarket(match.Id, MarketType.HalfTimeResult, "Resultat mi-temps", null, new[]
        {
            ("HOME_HT", "1", homeOdds * 1.3m),
            ("DRAW_HT", "X", Randomize(2.10m)),
            ("AWAY_HT", "2", awayOdds * 1.3m)
        }));

        // 7. HALF-TIME / FULL-TIME
        var htftSelections = new List<(string, string, decimal)>
        {
            ("HH", "1/1", Randomize(2.80m)),
            ("HD", "1/X", Randomize(15.00m)),
            ("HA", "1/2", Randomize(25.00m)),
            ("DH", "X/1", Randomize(5.50m)),
            ("DD", "X/X", Randomize(5.00m)),
            ("DA", "X/2", Randomize(6.50m)),
            ("AH", "2/1", Randomize(25.00m)),
            ("AD", "2/X", Randomize(15.00m)),
            ("AA", "2/2", Randomize(4.00m))
        };
        markets.Add(CreateMarket(match.Id, MarketType.HalfTimeFullTime, "Mi-temps / Fin de match", null, htftSelections.ToArray()));

        // 8. CORRECT SCORE
        var correctScores = new List<(string, string, decimal)>
        {
            ("0-0", "0-0", Randomize(9.00m)),
            ("1-0", "1-0", Randomize(6.50m)),
            ("2-0", "2-0", Randomize(8.00m)),
            ("2-1", "2-1", Randomize(9.50m)),
            ("3-0", "3-0", Randomize(15.00m)),
            ("3-1", "3-1", Randomize(13.00m)),
            ("3-2", "3-2", Randomize(25.00m)),
            ("4-0", "4-0", Randomize(29.00m)),
            ("4-1", "4-1", Randomize(25.00m)),
            ("1-1", "1-1", Randomize(6.00m)),
            ("2-2", "2-2", Randomize(13.00m)),
            ("3-3", "3-3", Randomize(41.00m)),
            ("0-1", "0-1", Randomize(8.00m)),
            ("0-2", "0-2", Randomize(11.00m)),
            ("1-2", "1-2", Randomize(11.00m)),
            ("0-3", "0-3", Randomize(21.00m)),
            ("1-3", "1-3", Randomize(19.00m)),
            ("2-3", "2-3", Randomize(29.00m)),
            ("OTHER", "Autre score", Randomize(15.00m))
        };
        markets.Add(CreateMarket(match.Id, MarketType.CorrectScore, "Score exact", null, correctScores.ToArray()));

        // 9. HANDICAP (Multiple Lines)
        var handicapLines = new[] { -2.5m, -1.5m, -1.0m, -0.5m, 0.5m, 1.0m, 1.5m, 2.5m };
        foreach (var line in handicapLines)
        {
            var label = line > 0 ? $"+{line}" : $"{line}";
            markets.Add(CreateMarket(match.Id, MarketType.HandicapAlternate, $"Handicap {label}", line, new[]
            {
                ("HOME_HC", $"{homeTeam.ShortName} ({label})", CalculateHandicapOdds(homeOdds, line, true)),
                ("AWAY_HC", $"{awayTeam.ShortName} ({(line > 0 ? $"-{Math.Abs(line)}" : $"+{Math.Abs(line)}")})", CalculateHandicapOdds(awayOdds, line, false))
            }));
        }

        // 10. TEAM TOTAL GOALS
        foreach (var team in new[] { (homeTeam, "HOME"), (awayTeam, "AWAY") })
        {
            var teamLines = new[] { 0.5m, 1.5m, 2.5m };
            foreach (var line in teamLines)
            {
                var isHome = team.Item2 == "HOME";
                var baseOdds = isHome ? homeOdds : awayOdds;
                markets.Add(CreateMarket(match.Id, MarketType.TeamTotalGoals, $"{team.Item1.ShortName} - Plus/Moins {line} buts", line, new[]
                {
                    ($"{team.Item2}_OVER", $"Plus de {line}", Randomize(isHome ? 1.65m : 2.00m)),
                    ($"{team.Item2}_UNDER", $"Moins de {line}", Randomize(isHome ? 2.15m : 1.75m))
                }));
            }
        }

        // 11. TEAM CLEAN SHEET
        markets.Add(CreateMarket(match.Id, MarketType.TeamCleanSheet, $"{homeTeam.ShortName} garde sa cage inviolee", null, new[]
        {
            ("HOME_CS_YES", "Oui", Randomize(2.40m)),
            ("HOME_CS_NO", "Non", Randomize(1.55m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.TeamCleanSheet, $"{awayTeam.ShortName} garde sa cage inviolee", null, new[]
        {
            ("AWAY_CS_YES", "Oui", Randomize(3.00m)),
            ("AWAY_CS_NO", "Non", Randomize(1.35m))
        }));

        // 12. FIRST TEAM TO SCORE
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreFirst, "Premiere equipe a marquer", null, new[]
        {
            ("HOME_FIRST", homeTeam.ShortName!, Randomize(1.65m)),
            ("AWAY_FIRST", awayTeam.ShortName!, Randomize(2.20m)),
            ("NO_GOAL", "Aucun but", Randomize(9.00m))
        }));

        // 13. LAST TEAM TO SCORE
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreLast, "Derniere equipe a marquer", null, new[]
        {
            ("HOME_LAST", homeTeam.ShortName!, Randomize(1.85m)),
            ("AWAY_LAST", awayTeam.ShortName!, Randomize(2.00m)),
            ("NO_GOAL", "Aucun but", Randomize(9.00m))
        }));

        // 14. TOTAL CORNERS
        var cornerLines = new[] { 8.5m, 9.5m, 10.5m, 11.5m, 12.5m };
        foreach (var line in cornerLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TotalCorners, $"Total corners - {line}", line, new[]
            {
                ("CORNERS_OVER", $"Plus de {line}", Randomize(1.90m)),
                ("CORNERS_UNDER", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 15. TEAM CORNERS
        markets.Add(CreateMarket(match.Id, MarketType.TeamCorners, $"{homeTeam.ShortName} - Nombre de corners", 5.5m, new[]
        {
            ("HOME_CORNERS_OVER", "Plus de 5.5", Randomize(1.80m)),
            ("HOME_CORNERS_UNDER", "Moins de 5.5", Randomize(2.00m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.TeamCorners, $"{awayTeam.ShortName} - Nombre de corners", 4.5m, new[]
        {
            ("AWAY_CORNERS_OVER", "Plus de 4.5", Randomize(1.85m)),
            ("AWAY_CORNERS_UNDER", "Moins de 4.5", Randomize(1.95m))
        }));

        // 16. FIRST CORNER
        markets.Add(CreateMarket(match.Id, MarketType.FirstCorner, "Premier corner", null, new[]
        {
            ("HOME_FIRST_CORNER", homeTeam.ShortName!, Randomize(1.75m)),
            ("AWAY_FIRST_CORNER", awayTeam.ShortName!, Randomize(2.05m))
        }));

        // 17. TOTAL CARDS
        var cardLines = new[] { 3.5m, 4.5m, 5.5m, 6.5m };
        foreach (var line in cardLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TotalCards, $"Total cartons - {line}", line, new[]
            {
                ("CARDS_OVER", $"Plus de {line}", Randomize(1.85m)),
                ("CARDS_UNDER", $"Moins de {line}", Randomize(1.95m))
            }));
        }

        // 18. TEAM CARDS
        markets.Add(CreateMarket(match.Id, MarketType.TeamCards, $"{homeTeam.ShortName} - Cartons recus", 2.5m, new[]
        {
            ("HOME_CARDS_OVER", "Plus de 2.5", Randomize(2.10m)),
            ("HOME_CARDS_UNDER", "Moins de 2.5", Randomize(1.70m))
        }));

        // 19. PLAYER PROPS - GOALSCORERS
        var allPlayers = homePlayers.Concat(awayPlayers).Where(p =>
            p.Position == "ST" || p.Position == "RW" || p.Position == "LW" || p.Position == "AM").ToList();

        if (allPlayers.Count > 0)
        {
            // First Goalscorer
            var fgsSelections = allPlayers.Take(10).Select(p =>
                ($"FGS_{p.Id}", p.Name, Randomize(p.Position == "ST" ? 5.50m : 8.00m))).ToList();
            fgsSelections.Add(("FGS_NONE", "Aucun but", Randomize(9.00m)));
            markets.Add(CreateMarketWithPlayers(match.Id, MarketType.FirstGoalscorer, "Premier buteur", null, fgsSelections, allPlayers));

            // Anytime Goalscorer
            var agsSelections = allPlayers.Take(12).Select(p =>
                ($"AGS_{p.Id}", p.Name, Randomize(p.Position == "ST" ? 1.90m : 3.20m))).ToArray();
            markets.Add(CreateMarketWithPlayers(match.Id, MarketType.AnytimeGoalscorer, "Buteur durant le match", null, agsSelections.ToList(), allPlayers));

            // Last Goalscorer
            var lgsSelections = allPlayers.Take(10).Select(p =>
                ($"LGS_{p.Id}", p.Name, Randomize(p.Position == "ST" ? 6.00m : 9.00m))).ToList();
            markets.Add(CreateMarketWithPlayers(match.Id, MarketType.LastGoalscorer, "Dernier buteur", null, lgsSelections, allPlayers));

            // Player to score 2+
            var p2Selections = allPlayers.Where(p => p.Position == "ST").Take(6).Select(p =>
                ($"P2G_{p.Id}", $"{p.Name} marque 2+ buts", Randomize(4.50m))).ToArray();
            if (p2Selections.Length > 0)
                markets.Add(CreateMarketWithPlayers(match.Id, MarketType.PlayerToScore2Plus, "Joueur marque 2+ buts", null, p2Selections.ToList(), allPlayers));

            // Player to score hat-trick
            var htSelections = allPlayers.Where(p => p.Position == "ST").Take(4).Select(p =>
                ($"P3G_{p.Id}", $"{p.Name} marque 3+ buts (Hat-trick)", Randomize(21.00m))).ToArray();
            if (htSelections.Length > 0)
                markets.Add(CreateMarketWithPlayers(match.Id, MarketType.PlayerToScore3Plus, "Hat-trick", null, htSelections.ToList(), allPlayers));
        }

        // 20. PLAYER SHOTS ON TARGET
        var attackers = allPlayers.Where(p => p.Position == "ST" || p.Position == "RW" || p.Position == "LW").Take(6).ToList();
        foreach (var player in attackers)
        {
            markets.Add(CreateMarket(match.Id, MarketType.PlayerShotsOnTarget, $"{player.Name} - Tirs cadres", 0.5m, new[]
            {
                ($"SOT_OVER_{player.Id}", "1+ tir cadre", Randomize(1.55m)),
                ($"SOT_UNDER_{player.Id}", "0 tir cadre", Randomize(2.35m))
            }));
            markets.Add(CreateMarket(match.Id, MarketType.PlayerShotsOnTarget, $"{player.Name} - Tirs cadres", 1.5m, new[]
            {
                ($"SOT_OVER2_{player.Id}", "2+ tirs cadres", Randomize(2.50m)),
                ($"SOT_UNDER2_{player.Id}", "Moins de 2", Randomize(1.50m))
            }));
        }

        // 21. PLAYER TO BE BOOKED
        var fieldPlayers = homePlayers.Concat(awayPlayers).Where(p => p.Position != "GK").Take(12).ToList();
        foreach (var player in fieldPlayers)
        {
            markets.Add(CreateMarket(match.Id, MarketType.PlayerToBeBooked, $"{player.Name} - Carton jaune", null, new[]
            {
                ($"BOOKED_YES_{player.Id}", "Recoit un carton", Randomize(3.50m)),
                ($"BOOKED_NO_{player.Id}", "Pas de carton", Randomize(1.25m))
            }));
        }

        // 22. PLAYER ASSISTS
        var midfielders = allPlayers.Where(p => p.Position == "AM" || p.Position == "CM").Take(6).ToList();
        foreach (var player in midfielders)
        {
            markets.Add(CreateMarket(match.Id, MarketType.PlayerToAssist, $"{player.Name} - Passe decisive", null, new[]
            {
                ($"ASSIST_YES_{player.Id}", "Fait une passe decisive", Randomize(3.00m)),
                ($"ASSIST_NO_{player.Id}", "Pas de passe decisive", Randomize(1.33m))
            }));
        }

        // 23. TEAM TO SCORE IN BOTH HALVES
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreBothHalves, $"{homeTeam.ShortName} marque en 1ere et 2eme MT", null, new[]
        {
            ("HOME_BOTH_YES", "Oui", Randomize(2.80m)),
            ("HOME_BOTH_NO", "Non", Randomize(1.40m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreBothHalves, $"{awayTeam.ShortName} marque en 1ere et 2eme MT", null, new[]
        {
            ("AWAY_BOTH_YES", "Oui", Randomize(3.50m)),
            ("AWAY_BOTH_NO", "Non", Randomize(1.28m))
        }));

        return markets;
    }
    #endregion

    #region Basketball Matches
    private static Task<List<Match>> CreateBasketballMatchesAsync(ApplicationDbContext context)
    {
        var matches = new List<Match>();
        var teams = context.Teams.Where(t => t.SportCode == "BASKETBALL").ToList();
        var leagues = context.Leagues.Where(l => l.SportCode == "BASKETBALL").ToList();
        var players = context.Players.ToList();

        var baseDate = DateTime.UtcNow.Date;

        // NBA matches (All times ET converted to CET +6)
        var nbaConfigs = new List<(string Home, string Away, int Days, int Hour, decimal Total, decimal Spread)>
        {
            ("Los Angeles Lakers", "Golden State Warriors", 1, 4, 228.5m, -2.5m),      // Late game
            ("Boston Celtics", "Philadelphia 76ers", 1, 2, 221.5m, -5.5m),
            ("Denver Nuggets", "Phoenix Suns", 2, 3, 232.0m, -4.0m),
            ("Milwaukee Bucks", "Miami Heat", 2, 1, 224.5m, -7.5m),
            ("Dallas Mavericks", "Sacramento Kings", 3, 2, 236.5m, -1.5m),
            ("Brooklyn Nets", "New York Knicks", 3, 1, 218.5m, 3.5m),                  // Knicks favored
            ("Cleveland Cavaliers", "Memphis Grizzlies", 4, 0, 225.0m, -2.0m),
        };

        // EuroLeague matches
        var euroConfigs = new List<(string Home, string Away, int Days, int Hour, decimal Total, decimal Spread)>
        {
            ("Real Madrid Baloncesto", "FC Barcelona Basquet", 2, 21, 168.5m, -3.5m),   // El Clasico
            ("Olympiacos BC", "Panathinaikos BC", 3, 20, 162.5m, -2.0m),               // Greek Derby
            ("AS Monaco Basket", "ASVEL Lyon-Villeurbanne", 4, 20, 165.0m, -4.5m),
        };

        var nbaLeague = leagues.FirstOrDefault(l => l.Name == "NBA");
        var euroLeague = leagues.FirstOrDefault(l => l.Name == "EuroLeague");

        // Create NBA matches
        if (nbaLeague != null)
        {
            foreach (var config in nbaConfigs)
            {
                var homeTeam = teams.FirstOrDefault(t => t.Name == config.Home);
                var awayTeam = teams.FirstOrDefault(t => t.Name == config.Away);
                if (homeTeam == null || awayTeam == null) continue;

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    ExternalId = $"MOCK_BB_{Guid.NewGuid().ToString()[..8]}",
                    SportCode = "BASKETBALL",
                    LeagueId = nbaLeague.Id,
                    HomeTeamId = homeTeam.Id,
                    AwayTeamId = awayTeam.Id,
                    StartTime = baseDate.AddDays(config.Days).AddHours(config.Hour),
                    Status = MatchStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var homePlayers = players.Where(p => p.TeamId == homeTeam.Id).ToList();
                var awayPlayers = players.Where(p => p.TeamId == awayTeam.Id).ToList();

                var markets = CreateBasketballMarkets(match, homeTeam, awayTeam, config.Total, config.Spread, homePlayers, awayPlayers, true);
                match.Markets = markets;

                matches.Add(match);
                context.Matches.Add(match);
            }
        }

        // Create EuroLeague matches
        if (euroLeague != null)
        {
            foreach (var config in euroConfigs)
            {
                var homeTeam = teams.FirstOrDefault(t => t.Name == config.Home);
                var awayTeam = teams.FirstOrDefault(t => t.Name == config.Away);
                if (homeTeam == null || awayTeam == null) continue;

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    ExternalId = $"MOCK_BB_{Guid.NewGuid().ToString()[..8]}",
                    SportCode = "BASKETBALL",
                    LeagueId = euroLeague.Id,
                    HomeTeamId = homeTeam.Id,
                    AwayTeamId = awayTeam.Id,
                    StartTime = baseDate.AddDays(config.Days).AddHours(config.Hour),
                    Status = MatchStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var homePlayers = players.Where(p => p.TeamId == homeTeam.Id).ToList();
                var awayPlayers = players.Where(p => p.TeamId == awayTeam.Id).ToList();

                var markets = CreateBasketballMarkets(match, homeTeam, awayTeam, config.Total, config.Spread, homePlayers, awayPlayers, false);
                match.Markets = markets;

                matches.Add(match);
                context.Matches.Add(match);
            }
        }

        return Task.FromResult(matches);
    }

    private static List<Market> CreateBasketballMarkets(
        Match match, Team homeTeam, Team awayTeam,
        decimal totalLine, decimal spreadLine,
        List<Player> homePlayers, List<Player> awayPlayers,
        bool isNBA)
    {
        var markets = new List<Market>();

        // 1. MONEY LINE (2-way)
        var homeOdds = spreadLine < 0 ? Randomize(1.55m) : Randomize(2.30m);
        var awayOdds = spreadLine < 0 ? Randomize(2.50m) : Randomize(1.60m);
        markets.Add(CreateMarket(match.Id, MarketType.MoneyLine, "Vainqueur du match", null, new[]
        {
            ("HOME_ML", homeTeam.ShortName!, homeOdds),
            ("AWAY_ML", awayTeam.ShortName!, awayOdds)
        }));

        // 2. POINT SPREAD (Multiple Lines)
        var spreadLines = new[] { spreadLine - 5m, spreadLine - 2.5m, spreadLine, spreadLine + 2.5m, spreadLine + 5m };
        foreach (var line in spreadLines)
        {
            var label = line > 0 ? $"+{line}" : $"{line}";
            var oppLabel = line > 0 ? $"-{Math.Abs(line)}" : $"+{Math.Abs(line)}";
            markets.Add(CreateMarket(match.Id, MarketType.PointSpread, $"Handicap {label}", line, new[]
            {
                ("HOME_SPREAD", $"{homeTeam.ShortName} ({label})", Randomize(1.90m)),
                ("AWAY_SPREAD", $"{awayTeam.ShortName} ({oppLabel})", Randomize(1.90m))
            }));
        }

        // 3. TOTAL POINTS (Multiple Lines)
        var totalLines = new[] { totalLine - 10m, totalLine - 5m, totalLine, totalLine + 5m, totalLine + 10m };
        foreach (var line in totalLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TotalPoints, $"Total points - {line}", line, new[]
            {
                ("OVER", $"Plus de {line}", Randomize(1.90m)),
                ("UNDER", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 4. TEAM TOTAL POINTS
        var homeTotal = totalLine / 2 + Math.Abs(spreadLine) / 2;
        var awayTotal = totalLine / 2 - Math.Abs(spreadLine) / 2;

        var homeLines = new[] { homeTotal - 5m, homeTotal, homeTotal + 5m };
        foreach (var line in homeLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TeamTotalPoints, $"{homeTeam.ShortName} - Total points {line}", line, new[]
            {
                ($"HOME_OVER", $"Plus de {line}", Randomize(1.87m)),
                ($"HOME_UNDER", $"Moins de {line}", Randomize(1.93m))
            }));
        }

        var awayLines = new[] { awayTotal - 5m, awayTotal, awayTotal + 5m };
        foreach (var line in awayLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TeamTotalPoints, $"{awayTeam.ShortName} - Total points {line}", line, new[]
            {
                ($"AWAY_OVER", $"Plus de {line}", Randomize(1.90m)),
                ($"AWAY_UNDER", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 5. FIRST QUARTER SPREAD & TOTAL
        var q1Spread = Math.Round(spreadLine / 4, 1);
        var q1Total = Math.Round(totalLine / 4, 1);

        markets.Add(CreateMarket(match.Id, MarketType.FirstQuarterSpread, $"1er QT - Handicap {q1Spread}", q1Spread, new[]
        {
            ("Q1_HOME_SPREAD", $"{homeTeam.ShortName} ({(q1Spread > 0 ? "+" : "")}{q1Spread})", Randomize(1.90m)),
            ("Q1_AWAY_SPREAD", $"{awayTeam.ShortName} ({(q1Spread > 0 ? "-" : "+")}{Math.Abs(q1Spread)})", Randomize(1.90m))
        }));

        markets.Add(CreateMarket(match.Id, MarketType.FirstQuarterTotal, $"1er QT - Total {q1Total}", q1Total, new[]
        {
            ("Q1_OVER", $"Plus de {q1Total}", Randomize(1.87m)),
            ("Q1_UNDER", $"Moins de {q1Total}", Randomize(1.93m))
        }));

        // 6. FIRST HALF SPREAD & TOTAL
        var h1Spread = Math.Round(spreadLine / 2, 1);
        var h1Total = Math.Round(totalLine / 2, 1);

        markets.Add(CreateMarket(match.Id, MarketType.FirstHalfSpread, $"1ere MT - Handicap {h1Spread}", h1Spread, new[]
        {
            ("H1_HOME_SPREAD", $"{homeTeam.ShortName} ({(h1Spread > 0 ? "+" : "")}{h1Spread})", Randomize(1.90m)),
            ("H1_AWAY_SPREAD", $"{awayTeam.ShortName} ({(h1Spread > 0 ? "-" : "+")}{Math.Abs(h1Spread)})", Randomize(1.90m))
        }));

        markets.Add(CreateMarket(match.Id, MarketType.FirstHalfTotal, $"1ere MT - Total {h1Total}", h1Total, new[]
        {
            ("H1_OVER", $"Plus de {h1Total}", Randomize(1.90m)),
            ("H1_UNDER", $"Moins de {h1Total}", Randomize(1.90m))
        }));

        // 7. FIRST TEAM TO SCORE
        markets.Add(CreateMarket(match.Id, MarketType.FirstTeamToScore, "Premiere equipe a marquer", null, new[]
        {
            ("HOME_FIRST", homeTeam.ShortName!, Randomize(1.90m)),
            ("AWAY_FIRST", awayTeam.ShortName!, Randomize(1.90m))
        }));

        // PLAYER PROPS (Only for NBA with players)
        if (isNBA)
        {
            var allPlayers = homePlayers.Concat(awayPlayers).ToList();

            if (allPlayers.Count > 0)
            {
                // Player Points - Stars get higher lines
                var starPlayers = new[] { "LeBron James", "Stephen Curry", "Kevin Durant", "Giannis Antetokounmpo",
                    "Nikola Jokic", "Luka Doncic", "Joel Embiid", "Jayson Tatum", "Damian Lillard", "Devin Booker" };

                foreach (var player in allPlayers.Take(10))
                {
                    var isStar = starPlayers.Contains(player.Name);
                    var basePoints = isStar ? 28.5m : 18.5m;
                    var pointLines = new[] { basePoints - 5m, basePoints, basePoints + 5m };

                    foreach (var line in pointLines)
                    {
                        markets.Add(CreateMarket(match.Id, MarketType.PlayerPoints, $"{player.Name} - Points {line}", line, new[]
                        {
                            ($"PP_OVER_{player.Id}", $"Plus de {line}", Randomize(1.87m)),
                            ($"PP_UNDER_{player.Id}", $"Moins de {line}", Randomize(1.93m))
                        }));
                    }

                    // Player Rebounds
                    var baseReb = isStar && (player.Position == "C" || player.Position == "PF") ? 11.5m : 6.5m;
                    markets.Add(CreateMarket(match.Id, MarketType.PlayerRebounds, $"{player.Name} - Rebonds {baseReb}", baseReb, new[]
                    {
                        ($"PR_OVER_{player.Id}", $"Plus de {baseReb}", Randomize(1.85m)),
                        ($"PR_UNDER_{player.Id}", $"Moins de {baseReb}", Randomize(1.95m))
                    }));

                    // Player Assists
                    var baseAst = player.Position == "PG" ? 8.5m : 4.5m;
                    markets.Add(CreateMarket(match.Id, MarketType.PlayerAssistsBasketball, $"{player.Name} - Passes {baseAst}", baseAst, new[]
                    {
                        ($"PA_OVER_{player.Id}", $"Plus de {baseAst}", Randomize(1.87m)),
                        ($"PA_UNDER_{player.Id}", $"Moins de {baseAst}", Randomize(1.93m))
                    }));

                    // Player PRA (Points + Rebounds + Assists)
                    var pra = basePoints + baseReb + baseAst;
                    markets.Add(CreateMarket(match.Id, MarketType.PlayerPointsReboundsAssists, $"{player.Name} - Pts+Reb+Ast {pra}", pra, new[]
                    {
                        ($"PRA_OVER_{player.Id}", $"Plus de {pra}", Randomize(1.87m)),
                        ($"PRA_UNDER_{player.Id}", $"Moins de {pra}", Randomize(1.93m))
                    }));

                    // Player 3-Pointers (for guards/wings)
                    if (player.Position == "PG" || player.Position == "SG" || player.Position == "SF")
                    {
                        var threes = isStar ? 4.5m : 2.5m;
                        markets.Add(CreateMarket(match.Id, MarketType.PlayerThrees, $"{player.Name} - 3pts marques {threes}", threes, new[]
                        {
                            ($"P3_OVER_{player.Id}", $"Plus de {threes}", Randomize(1.90m)),
                            ($"P3_UNDER_{player.Id}", $"Moins de {threes}", Randomize(1.90m))
                        }));
                    }

                    // Double-Double
                    if (isStar)
                    {
                        markets.Add(CreateMarket(match.Id, MarketType.PlayerDoubleDouble, $"{player.Name} - Double-Double", null, new[]
                        {
                            ($"DD_YES_{player.Id}", "Oui", Randomize(1.70m)),
                            ($"DD_NO_{player.Id}", "Non", Randomize(2.10m))
                        }));
                    }
                }

                // Triple-Double for elite players
                var elitePlayers = allPlayers.Where(p =>
                    starPlayers.Contains(p.Name) && (p.Name.Contains("LeBron") || p.Name.Contains("Jokic") || p.Name.Contains("Doncic"))).ToList();

                foreach (var player in elitePlayers)
                {
                    markets.Add(CreateMarket(match.Id, MarketType.PlayerTripleDouble, $"{player.Name} - Triple-Double", null, new[]
                    {
                        ($"TD_YES_{player.Id}", "Oui", Randomize(5.00m)),
                        ($"TD_NO_{player.Id}", "Non", Randomize(1.15m))
                    }));
                }
            }
        }

        return markets;
    }
    #endregion

    #region Tennis Matches
    private static Task<List<Match>> CreateTennisMatchesAsync(ApplicationDbContext context)
    {
        var matches = new List<Match>();
        var players = context.Teams.Where(t => t.SportCode == "TENNIS").ToList();
        var leagues = context.Leagues.Where(l => l.SportCode == "TENNIS").ToList();

        if (players.Count < 2) return Task.FromResult(matches);

        var baseDate = DateTime.UtcNow.Date;
        var atpLeague = leagues.FirstOrDefault(l => l.Name.Contains("ATP"));
        var wtaLeague = leagues.FirstOrDefault(l => l.Name.Contains("WTA"));

        // ATP matches configuration
        var atpConfigs = new List<(string P1, string P2, int Days, int Hour, decimal P1Odds, bool IsBo5)>
        {
            ("Novak Djokovic", "Carlos Alcaraz", 1, 14, 2.10m, false),         // ATP 500 Final
            ("Jannik Sinner", "Daniil Medvedev", 1, 11, 1.65m, false),         // Semi-final
            ("Alexander Zverev", "Andrey Rublev", 2, 13, 1.80m, false),
            ("Holger Rune", "Stefanos Tsitsipas", 2, 16, 2.20m, false),
            ("Taylor Fritz", "Hubert Hurkacz", 3, 12, 1.95m, false),
            ("Frances Tiafoe", "Casper Ruud", 3, 15, 2.40m, false),
        };

        // WTA matches
        var wtaConfigs = new List<(string P1, string P2, int Days, int Hour, decimal P1Odds)>
        {
            ("Iga Swiatek", "Aryna Sabalenka", 2, 15, 1.85m),                  // Top 2 clash
            ("Coco Gauff", "Elena Rybakina", 3, 13, 2.05m),
            ("Jessica Pegula", "Ons Jabeur", 4, 14, 1.90m),
        };

        if (atpLeague != null)
        {
            foreach (var config in atpConfigs)
            {
                var player1 = players.FirstOrDefault(t => t.Name == config.P1);
                var player2 = players.FirstOrDefault(t => t.Name == config.P2);
                if (player1 == null || player2 == null) continue;

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    ExternalId = $"MOCK_TN_{Guid.NewGuid().ToString()[..8]}",
                    SportCode = "TENNIS",
                    LeagueId = atpLeague.Id,
                    HomeTeamId = player1.Id,
                    AwayTeamId = player2.Id,
                    StartTime = baseDate.AddDays(config.Days).AddHours(config.Hour),
                    Status = MatchStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var markets = CreateTennisMarkets(match, player1, player2, config.P1Odds, config.IsBo5);
                match.Markets = markets;

                matches.Add(match);
                context.Matches.Add(match);
            }
        }

        if (wtaLeague != null)
        {
            foreach (var config in wtaConfigs)
            {
                var player1 = players.FirstOrDefault(t => t.Name == config.P1);
                var player2 = players.FirstOrDefault(t => t.Name == config.P2);
                if (player1 == null || player2 == null) continue;

                var match = new Match
                {
                    Id = Guid.NewGuid(),
                    ExternalId = $"MOCK_TN_{Guid.NewGuid().ToString()[..8]}",
                    SportCode = "TENNIS",
                    LeagueId = wtaLeague.Id,
                    HomeTeamId = player1.Id,
                    AwayTeamId = player2.Id,
                    StartTime = baseDate.AddDays(config.Days).AddHours(config.Hour),
                    Status = MatchStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var markets = CreateTennisMarkets(match, player1, player2, config.P1Odds, false);
                match.Markets = markets;

                matches.Add(match);
                context.Matches.Add(match);
            }
        }

        return Task.FromResult(matches);
    }

    private static List<Market> CreateTennisMarkets(Match match, Team player1, Team player2, decimal p1Odds, bool isBestOf5)
    {
        var markets = new List<Market>();
        var p2Odds = CalculateOpponentOdds(p1Odds);

        // 1. MATCH WINNER
        markets.Add(CreateMarket(match.Id, MarketType.MoneyLine, "Vainqueur du match", null, new[]
        {
            ("P1_WIN", player1.Name, p1Odds),
            ("P2_WIN", player2.Name, p2Odds)
        }));

        // 2. SET BETTING (Correct Score in Sets)
        if (isBestOf5)
        {
            var setBettingBo5 = new List<(string, string, decimal)>
            {
                ("3-0", $"{player1.ShortName} 3-0", Randomize(4.50m)),
                ("3-1", $"{player1.ShortName} 3-1", Randomize(4.00m)),
                ("3-2", $"{player1.ShortName} 3-2", Randomize(6.00m)),
                ("0-3", $"{player2.ShortName} 3-0", Randomize(6.50m)),
                ("1-3", $"{player2.ShortName} 3-1", Randomize(5.50m)),
                ("2-3", $"{player2.ShortName} 3-2", Randomize(8.00m)),
            };
            markets.Add(CreateMarket(match.Id, MarketType.CorrectScore, "Score en sets", null, setBettingBo5.ToArray()));
        }
        else
        {
            var setBettingBo3 = new List<(string, string, decimal)>
            {
                ("2-0", $"{player1.ShortName} 2-0", Randomize(2.60m)),
                ("2-1", $"{player1.ShortName} 2-1", Randomize(3.80m)),
                ("0-2", $"{player2.ShortName} 2-0", Randomize(3.50m)),
                ("1-2", $"{player2.ShortName} 2-1", Randomize(4.50m)),
            };
            markets.Add(CreateMarket(match.Id, MarketType.CorrectScore, "Score en sets", null, setBettingBo3.ToArray()));
        }

        // 3. TOTAL SETS
        if (isBestOf5)
        {
            markets.Add(CreateMarket(match.Id, MarketType.OverUnder, "Nombre de sets", 3.5m, new[]
            {
                ("OVER_SETS", "Plus de 3.5 sets", Randomize(1.75m)),
                ("UNDER_SETS", "Moins de 3.5 sets", Randomize(2.05m))
            }));
            markets.Add(CreateMarket(match.Id, MarketType.OverUnder, "Nombre de sets", 4.5m, new[]
            {
                ("OVER_SETS_4", "5 sets", Randomize(3.20m)),
                ("UNDER_SETS_4", "3 ou 4 sets", Randomize(1.33m))
            }));
        }
        else
        {
            markets.Add(CreateMarket(match.Id, MarketType.OverUnder, "Nombre de sets", 2.5m, new[]
            {
                ("3_SETS", "3 sets", Randomize(2.00m)),
                ("2_SETS", "2 sets", Randomize(1.80m))
            }));
        }

        // 4. SET 1 WINNER
        var s1P1Odds = p1Odds * 0.95m; // Slight adjustment for set market
        var s1P2Odds = CalculateOpponentOdds(s1P1Odds);
        markets.Add(CreateMarket(match.Id, MarketType.HalfTimeResult, "Vainqueur Set 1", null, new[]
        {
            ("P1_SET1", player1.ShortName!, s1P1Odds),
            ("P2_SET1", player2.ShortName!, s1P2Odds)
        }));

        // 5. SET 2 WINNER
        markets.Add(CreateMarket(match.Id, MarketType.HalfTimeResult, "Vainqueur Set 2", null, new[]
        {
            ("P1_SET2", player1.ShortName!, Randomize(p1Odds)),
            ("P2_SET2", player2.ShortName!, Randomize(p2Odds))
        }));

        // 6. TOTAL GAMES
        var gameLines = new[] { 20.5m, 21.5m, 22.5m, 23.5m, 24.5m };
        foreach (var line in gameLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.TotalPoints, $"Total jeux - {line}", line, new[]
            {
                ("GAMES_OVER", $"Plus de {line}", Randomize(1.90m)),
                ("GAMES_UNDER", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 7. GAME HANDICAP
        var handicaps = new[] { -4.5m, -3.5m, -2.5m, -1.5m, 1.5m, 2.5m, 3.5m, 4.5m };
        foreach (var hc in handicaps)
        {
            var label = hc > 0 ? $"+{hc}" : $"{hc}";
            var oppLabel = hc > 0 ? $"-{hc}" : $"+{Math.Abs(hc)}";
            markets.Add(CreateMarket(match.Id, MarketType.Handicap, $"Handicap jeux {label}", hc, new[]
            {
                ("P1_HC", $"{player1.ShortName} ({label})", Randomize(1.90m)),
                ("P2_HC", $"{player2.ShortName} ({oppLabel})", Randomize(1.90m))
            }));
        }

        // 8. SET HANDICAP
        var setHandicaps = new[] { -1.5m, 1.5m };
        foreach (var hc in setHandicaps)
        {
            var label = hc > 0 ? $"+{hc}" : $"{hc}";
            markets.Add(CreateMarket(match.Id, MarketType.HandicapAlternate, $"Handicap sets {label}", hc, new[]
            {
                ("P1_SET_HC", $"{player1.ShortName} ({label})", hc < 0 ? Randomize(2.30m) : Randomize(1.55m)),
                ("P2_SET_HC", $"{player2.ShortName} ({(hc > 0 ? $"-{Math.Abs(hc)}" : $"+{Math.Abs(hc)}")})", hc < 0 ? Randomize(1.60m) : Randomize(2.40m))
            }));
        }

        // 9. PLAYER TO WIN A SET
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreBothHalves, $"{player1.ShortName} gagne au moins 1 set", null, new[]
        {
            ("P1_WIN_SET_YES", "Oui", Randomize(1.12m)),
            ("P1_WIN_SET_NO", "Non", Randomize(5.50m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreBothHalves, $"{player2.ShortName} gagne au moins 1 set", null, new[]
        {
            ("P2_WIN_SET_YES", "Oui", Randomize(1.25m)),
            ("P2_WIN_SET_NO", "Non", Randomize(3.75m))
        }));

        // 10. TIE-BREAK IN MATCH
        markets.Add(CreateMarket(match.Id, MarketType.BothTeamsScore, "Tie-break dans le match", null, new[]
        {
            ("TIEBREAK_YES", "Oui", Randomize(1.55m)),
            ("TIEBREAK_NO", "Non", Randomize(2.35m))
        }));

        // 11. TIE-BREAK IN SET 1
        markets.Add(CreateMarket(match.Id, MarketType.BothTeamsScore, "Tie-break dans le Set 1", null, new[]
        {
            ("S1_TIEBREAK_YES", "Oui", Randomize(2.80m)),
            ("S1_TIEBREAK_NO", "Non", Randomize(1.40m))
        }));

        // 12. FIRST SET CORRECT SCORE
        var firstSetScores = new List<(string, string, decimal)>
        {
            ("6-0", $"{player1.ShortName} 6-0", Randomize(17.00m)),
            ("6-1", $"{player1.ShortName} 6-1", Randomize(11.00m)),
            ("6-2", $"{player1.ShortName} 6-2", Randomize(7.00m)),
            ("6-3", $"{player1.ShortName} 6-3", Randomize(5.50m)),
            ("6-4", $"{player1.ShortName} 6-4", Randomize(5.00m)),
            ("7-5", $"{player1.ShortName} 7-5", Randomize(8.00m)),
            ("7-6", $"{player1.ShortName} 7-6", Randomize(6.50m)),
            ("0-6", $"{player2.ShortName} 6-0", Randomize(26.00m)),
            ("1-6", $"{player2.ShortName} 6-1", Randomize(17.00m)),
            ("2-6", $"{player2.ShortName} 6-2", Randomize(10.00m)),
            ("3-6", $"{player2.ShortName} 6-3", Randomize(7.50m)),
            ("4-6", $"{player2.ShortName} 6-4", Randomize(6.50m)),
            ("5-7", $"{player2.ShortName} 7-5", Randomize(11.00m)),
            ("6-7", $"{player2.ShortName} 7-6", Randomize(9.00m)),
        };
        markets.Add(CreateMarket(match.Id, MarketType.CorrectScore, "Score exact Set 1", null, firstSetScores.ToArray()));

        // 13. FIRST SET TOTAL GAMES
        var s1GameLines = new[] { 9.5m, 10.5m, 11.5m, 12.5m };
        foreach (var line in s1GameLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.FirstQuarterTotal, $"Set 1 - Total jeux {line}", line, new[]
            {
                ("S1_GAMES_OVER", $"Plus de {line}", Randomize(1.90m)),
                ("S1_GAMES_UNDER", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 14. PLAYER TO BREAK SERVE
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreFirst, $"{player1.ShortName} break de service", null, new[]
        {
            ("P1_BREAK_YES", "Oui", Randomize(1.15m)),
            ("P1_BREAK_NO", "Non", Randomize(4.75m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.TeamToScoreFirst, $"{player2.ShortName} break de service", null, new[]
        {
            ("P2_BREAK_YES", "Oui", Randomize(1.22m)),
            ("P2_BREAK_NO", "Non", Randomize(4.00m))
        }));

        // 15. FIRST SERVICE BREAK
        markets.Add(CreateMarket(match.Id, MarketType.FirstCorner, "Premier break de service", null, new[]
        {
            ("P1_FIRST_BREAK", player1.ShortName!, Randomize(2.05m)),
            ("P2_FIRST_BREAK", player2.ShortName!, Randomize(2.20m)),
            ("NO_BREAK", "Aucun break", Randomize(5.00m))
        }));

        // 16. TOTAL ACES (Player specific)
        var aceLines = new[] { 4.5m, 6.5m, 8.5m, 10.5m };
        foreach (var line in aceLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.PlayerShotsOnTarget, $"{player1.ShortName} - Aces {line}", line, new[]
            {
                ($"P1_ACES_OVER_{line}", $"Plus de {line}", Randomize(1.85m)),
                ($"P1_ACES_UNDER_{line}", $"Moins de {line}", Randomize(1.95m))
            }));
        }
        foreach (var line in aceLines)
        {
            markets.Add(CreateMarket(match.Id, MarketType.PlayerShotsOnTarget, $"{player2.ShortName} - Aces {line}", line, new[]
            {
                ($"P2_ACES_OVER_{line}", $"Plus de {line}", Randomize(1.90m)),
                ($"P2_ACES_UNDER_{line}", $"Moins de {line}", Randomize(1.90m))
            }));
        }

        // 17. DOUBLE FAULTS
        markets.Add(CreateMarket(match.Id, MarketType.PlayerFoulsCommitted, $"{player1.ShortName} - Double fautes", 2.5m, new[]
        {
            ("P1_DF_OVER", "Plus de 2.5", Randomize(1.75m)),
            ("P1_DF_UNDER", "Moins de 2.5", Randomize(2.05m))
        }));
        markets.Add(CreateMarket(match.Id, MarketType.PlayerFoulsCommitted, $"{player2.ShortName} - Double fautes", 2.5m, new[]
        {
            ("P2_DF_OVER", "Plus de 2.5", Randomize(1.80m)),
            ("P2_DF_UNDER", "Moins de 2.5", Randomize(2.00m))
        }));

        return markets;
    }
    #endregion

    #region Helpers
    private static Market CreateMarket(Guid matchId, MarketType type, string label, decimal? line, (string Code, string Label, decimal Odds)[] selections)
    {
        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = matchId,
            Type = type,
            Label = label,
            Line = line,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Selections = new List<MarketSelection>()
        };

        foreach (var (code, selLabel, odds) in selections)
        {
            market.Selections.Add(new MarketSelection
            {
                Id = Guid.NewGuid(),
                MarketId = market.Id,
                Code = code,
                Label = selLabel,
                Odds = Math.Round(odds, 2),
                Point = line,
                IsActive = true
            });
        }

        return market;
    }

    private static Market CreateMarketWithPlayers(Guid matchId, MarketType type, string label, decimal? line,
        List<(string Code, string Label, decimal Odds)> selections, List<Player> players)
    {
        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = matchId,
            Type = type,
            Label = label,
            Line = line,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            Selections = new List<MarketSelection>()
        };

        foreach (var (code, selLabel, odds) in selections)
        {
            var playerId = players.FirstOrDefault(p => selLabel.Contains(p.Name))?.Id;
            market.Selections.Add(new MarketSelection
            {
                Id = Guid.NewGuid(),
                MarketId = market.Id,
                Code = code,
                Label = selLabel,
                Odds = Math.Round(odds, 2),
                Point = line,
                PlayerId = playerId,
                IsActive = true
            });
        }

        return market;
    }

    private static decimal Randomize(decimal baseOdds)
    {
        var variance = (decimal)(_random.NextDouble() * 0.1 - 0.05); // +/- 5%
        return Math.Round(baseOdds * (1 + variance), 2);
    }

    private static decimal CalculateDoubleChance(decimal odds1, decimal odds2)
    {
        // Formula: 1 / (1/odds1 + 1/odds2)
        var prob1 = 1m / odds1;
        var prob2 = 1m / odds2;
        var combined = 1m / (prob1 + prob2);
        return Math.Round(combined * 0.93m, 2); // 7% margin
    }

    private static decimal CalculateHandicapOdds(decimal baseOdds, decimal line, bool isHome)
    {
        // Adjust based on handicap line
        var adjustment = line * 0.15m;
        var result = isHome ? baseOdds - adjustment : baseOdds + adjustment;
        return Math.Max(1.05m, Math.Round(result, 2));
    }

    private static decimal CalculateOpponentOdds(decimal favoriteOdds)
    {
        // Calculate implied probability and adjust for margin
        var favProb = 1m / favoriteOdds;
        var oppProb = (1m - favProb) * 0.93m; // 7% margin
        return Math.Round(1m / oppProb, 2);
    }
    #endregion
}
#endif

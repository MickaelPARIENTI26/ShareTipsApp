using ShareTipsBackend.Domain.Entities;

namespace ShareTipsBackend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Skip if already seeded
        if (context.Leagues.Any()) return;

        // Football Leagues
        var ligue1 = new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Ligue 1", Country = "FR", IsActive = true };
        var premierLeague = new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Premier League", Country = "GB", IsActive = true };
        var laLiga = new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "La Liga", Country = "ES", IsActive = true };
        var serieA = new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Serie A", Country = "IT", IsActive = true };
        var bundesliga = new League { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Bundesliga", Country = "DE", IsActive = true };

        // Basketball Leagues
        var nba = new League { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "NBA", Country = "US", IsActive = true };
        var euroleague = new League { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "EuroLeague", Country = "EU", IsActive = true };

        // Tennis
        var atp = new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "ATP Tour", Country = "WORLD", IsActive = true };
        var wta = new League { Id = Guid.NewGuid(), SportCode = "TENNIS", Name = "WTA Tour", Country = "WORLD", IsActive = true };

        // E-Sport Leagues
        var lol = new League { Id = Guid.NewGuid(), SportCode = "ESPORT", Name = "League of Legends LEC", Country = "EU", IsActive = true };
        var csgo = new League { Id = Guid.NewGuid(), SportCode = "ESPORT", Name = "CS2 Major", Country = "WORLD", IsActive = true };

        context.Leagues.AddRange(ligue1, premierLeague, laLiga, serieA, bundesliga, nba, euroleague, atp, wta, lol, csgo);

        // Football Teams
        var psg = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Paris Saint-Germain", ShortName = "PSG", Country = "FR", IsActive = true };
        var om = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Olympique de Marseille", ShortName = "OM", Country = "FR", IsActive = true };
        var lyon = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Olympique Lyonnais", ShortName = "OL", Country = "FR", IsActive = true };
        var manCity = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Manchester City", ShortName = "MCI", Country = "GB", IsActive = true };
        var liverpool = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Liverpool FC", ShortName = "LIV", Country = "GB", IsActive = true };
        var realMadrid = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "Real Madrid", ShortName = "RMA", Country = "ES", IsActive = true };
        var barcelona = new Team { Id = Guid.NewGuid(), SportCode = "FOOTBALL", Name = "FC Barcelona", ShortName = "BAR", Country = "ES", IsActive = true };

        // NBA Teams
        var lakers = new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Los Angeles Lakers", ShortName = "LAL", Country = "US", IsActive = true };
        var warriors = new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Golden State Warriors", ShortName = "GSW", Country = "US", IsActive = true };
        var celtics = new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Boston Celtics", ShortName = "BOS", Country = "US", IsActive = true };
        var heat = new Team { Id = Guid.NewGuid(), SportCode = "BASKETBALL", Name = "Miami Heat", ShortName = "MIA", Country = "US", IsActive = true };

        // E-Sport Teams
        var fnatic = new Team { Id = Guid.NewGuid(), SportCode = "ESPORT", Name = "Fnatic", ShortName = "FNC", Country = "EU", IsActive = true };
        var g2 = new Team { Id = Guid.NewGuid(), SportCode = "ESPORT", Name = "G2 Esports", ShortName = "G2", Country = "EU", IsActive = true };
        var vitality = new Team { Id = Guid.NewGuid(), SportCode = "ESPORT", Name = "Team Vitality", ShortName = "VIT", Country = "FR", IsActive = true };

        context.Teams.AddRange(psg, om, lyon, manCity, liverpool, realMadrid, barcelona, lakers, warriors, celtics, heat, fnatic, g2, vitality);

        // Sample Players - PSG
        context.Players.AddRange(
            new Player { Id = Guid.NewGuid(), TeamId = psg.Id, Name = "Gianluigi Donnarumma", Position = "GK", JerseyNumber = 1, IsActive = true },
            new Player { Id = Guid.NewGuid(), TeamId = psg.Id, Name = "Achraf Hakimi", Position = "RB", JerseyNumber = 2, IsActive = true },
            new Player { Id = Guid.NewGuid(), TeamId = psg.Id, Name = "Marquinhos", Position = "CB", JerseyNumber = 5, IsActive = true }
        );

        // Sample Players - Lakers
        context.Players.AddRange(
            new Player { Id = Guid.NewGuid(), TeamId = lakers.Id, Name = "LeBron James", Position = "SF", JerseyNumber = 23, IsActive = true },
            new Player { Id = Guid.NewGuid(), TeamId = lakers.Id, Name = "Anthony Davis", Position = "PF", JerseyNumber = 3, IsActive = true }
        );

        await context.SaveChangesAsync();
    }
}

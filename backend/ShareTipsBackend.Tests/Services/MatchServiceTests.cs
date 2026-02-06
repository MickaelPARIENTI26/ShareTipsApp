using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using Match = ShareTipsBackend.Domain.Entities.Match;

namespace ShareTipsBackend.Tests.Services;

public class MatchServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cacheService;
    private readonly MatchService _service;

    public MatchServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        // Use real cache service with in-memory cache for simpler tests
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        _cacheService = new CacheService(memoryCache, NullLogger<CacheService>.Instance);

        _service = new MatchService(_context, _cacheService);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task<(League league, Team homeTeam, Team awayTeam)> SeedTestDataAsync()
    {
        var league = new League
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            Name = "Test League",
            Country = "FR",
            IsActive = true
        };
        _context.Leagues.Add(league);

        var homeTeam = new Team
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            Name = "Home Team",
            ShortName = "HOM",
            IsActive = true
        };
        var awayTeam = new Team
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            Name = "Away Team",
            ShortName = "AWY",
            IsActive = true
        };
        _context.Teams.AddRange(homeTeam, awayTeam);

        await _context.SaveChangesAsync();
        return (league, homeTeam, awayTeam);
    }

    [Fact]
    public async Task GetUpcomingMatchesAsync_ReturnsScheduledMatches()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUpcomingMatchesAsync();

        // Assert
        result.Should().HaveCount(1);
        result.First().Id.Should().Be(match.Id);
    }

    [Fact]
    public async Task GetUpcomingMatchesAsync_FiltersBySportCode()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var footballMatch = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        var basketballLeague = new League
        {
            Id = Guid.NewGuid(),
            SportCode = "BASKETBALL",
            Name = "NBA",
            Country = "US",
            IsActive = true
        };
        _context.Leagues.Add(basketballLeague);

        var basketballMatch = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "BASKETBALL",
            LeagueId = basketballLeague.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        _context.Matches.AddRange(footballMatch, basketballMatch);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUpcomingMatchesAsync(sportCode: "FOOTBALL");

        // Assert
        result.Should().HaveCount(1);
        result.First().SportCode.Should().Be("FOOTBALL");
    }

    [Fact]
    public async Task GetUpcomingMatchesAsync_ExcludesFinishedMatches()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var scheduledMatch = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        var finishedMatch = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(-1),
            Status = MatchStatus.Finished,
            CreatedAt = DateTime.UtcNow
        };

        _context.Matches.AddRange(scheduledMatch, finishedMatch);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUpcomingMatchesAsync();

        // Assert
        result.Should().HaveCount(1);
        result.First().Status.Should().Be("Scheduled");
    }

    [Fact]
    public async Task GetMatchByIdAsync_ReturnsMatchWithMarkets()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);

        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.MatchResult,
            Label = "Résultat du match",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        market.Selections.Add(new MarketSelection
        {
            Id = Guid.NewGuid(),
            MarketId = market.Id,
            Code = "1",
            Label = homeTeam.Name,
            Odds = 1.85m,
            IsActive = true
        });
        market.Selections.Add(new MarketSelection
        {
            Id = Guid.NewGuid(),
            MarketId = market.Id,
            Code = "X",
            Label = "Match nul",
            Odds = 3.50m,
            IsActive = true
        });
        market.Selections.Add(new MarketSelection
        {
            Id = Guid.NewGuid(),
            MarketId = market.Id,
            Code = "2",
            Label = awayTeam.Name,
            Odds = 4.20m,
            IsActive = true
        });
        _context.Markets.Add(market);

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetMatchByIdAsync(match.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(match.Id);
        result.Markets.Should().HaveCount(1);
        result.Markets.First().Selections.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetMatchByIdAsync_ReturnsNullForNonExistent()
    {
        // Act
        var result = await _service.GetMatchByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateMatchAsync_CreatesMatchSuccessfully()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var request = new CreateMatchRequest(
            SportCode: "FOOTBALL",
            LeagueId: league.Id,
            HomeTeamId: homeTeam.Id,
            AwayTeamId: awayTeam.Id,
            StartTime: DateTime.UtcNow.AddDays(2)
        );

        // Act
        var result = await _service.CreateMatchAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.SportCode.Should().Be("FOOTBALL");
        result.HomeTeam.Name.Should().Be(homeTeam.Name);
        result.AwayTeam.Name.Should().Be(awayTeam.Name);

        // Verify in DB
        var matchInDb = await _context.Matches.FindAsync(result.Id);
        matchInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateMatchAsync_UpdatesMatchSuccessfully()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateMatchRequest(
            StartTime: null,
            Status: "Live",
            HomeScore: 1,
            AwayScore: 0
        );

        // Act
        var result = await _service.UpdateMatchAsync(match.Id, updateRequest);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be("Live");
        result.HomeScore.Should().Be(1);
        result.AwayScore.Should().Be(0);
    }

    [Fact]
    public async Task DeleteMatchAsync_DeletesMatchSuccessfully()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DeleteMatchAsync(match.Id);

        // Assert
        result.Should().BeTrue();

        var matchInDb = await _context.Matches.FindAsync(match.Id);
        matchInDb.Should().BeNull();
    }

    [Fact]
    public async Task CreateMarketAsync_CreatesMarketWithSelections()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);
        await _context.SaveChangesAsync();

        var request = new CreateMarketRequest(
            MatchId: match.Id,
            Type: "MatchResult",
            Label: "Résultat du match",
            Line: null,
            Selections: new List<CreateSelectionRequest>
            {
                new("1", homeTeam.Name, 1.85m, null),
                new("X", "Match nul", 3.50m, null),
                new("2", awayTeam.Name, 4.20m, null)
            }
        );

        // Act
        var result = await _service.CreateMarketAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Type.Should().Be("MatchResult");
        result.Selections.Should().HaveCount(3);
    }

    [Fact]
    public async Task UpdateOddsAsync_UpdatesSelectionOdds()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);

        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.MatchResult,
            Label = "Résultat",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        var selection = new MarketSelection
        {
            Id = Guid.NewGuid(),
            MarketId = market.Id,
            Code = "1",
            Label = homeTeam.Name,
            Odds = 1.85m,
            IsActive = true
        };
        market.Selections.Add(selection);
        _context.Markets.Add(market);
        await _context.SaveChangesAsync();

        var request = new UpdateOddsRequest(selection.Id, 2.00m);

        // Act
        var result = await _service.UpdateOddsAsync(request);

        // Assert
        result.Should().BeTrue();

        var updatedSelection = await _context.Set<MarketSelection>().FindAsync(selection.Id);
        updatedSelection!.Odds.Should().Be(2.00m);
    }

    [Fact]
    public async Task GetUpcomingMatchesWithMarketsAsync_ReturnsMatchesWithFullMarketDetails()
    {
        // Arrange
        var (league, homeTeam, awayTeam) = await SeedTestDataAsync();

        var match = new Match
        {
            Id = Guid.NewGuid(),
            SportCode = "FOOTBALL",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };
        _context.Matches.Add(match);

        var market = new Market
        {
            Id = Guid.NewGuid(),
            MatchId = match.Id,
            Type = MarketType.MatchResult,
            Label = "Résultat",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        market.Selections.Add(new MarketSelection
        {
            Id = Guid.NewGuid(),
            MarketId = market.Id,
            Code = "1",
            Label = homeTeam.Name,
            Odds = 1.85m,
            IsActive = true
        });
        _context.Markets.Add(market);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetUpcomingMatchesWithMarketsAsync();

        // Assert
        result.Should().HaveCount(1);
        var matchDto = result.First();
        matchDto.Markets.Should().HaveCount(1);
        matchDto.Markets.First().Selections.Should().HaveCount(1);
    }
}

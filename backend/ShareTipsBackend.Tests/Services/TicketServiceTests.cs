using FluentAssertions;
using Moq;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class TicketServiceTests
{
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ICacheService> _mockCacheService;
    private readonly Mock<IGamificationService> _mockGamificationService;

    public TicketServiceTests()
    {
        _mockNotificationService = new Mock<INotificationService>();
        _mockCacheService = new Mock<ICacheService>();
        _mockGamificationService = new Mock<IGamificationService>();
        _mockGamificationService.Setup(x => x.AwardXpAsync(It.IsAny<Guid>(), It.IsAny<XpActionType>(), It.IsAny<string?>(), It.IsAny<Guid?>()))
            .ReturnsAsync(new XpGainResultDto(15, 100, 1, false, null, null, null));
    }

    private TicketService CreateService(Data.ApplicationDbContext context)
    {
        return new TicketService(context, _mockNotificationService.Object, _mockCacheService.Object, _mockGamificationService.Object);
    }

    private async Task<(User user, Domain.Entities.Match match)> SetupUserAndMatchAsync(Data.ApplicationDbContext context)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        var league = new League
        {
            Id = Guid.NewGuid(),
            ExternalKey = "ligue1",
            Name = "Ligue 1",
            SportCode = "soccer",
            Country = "France"
        };
        context.Leagues.Add(league);

        var homeTeam = new Team { Id = Guid.NewGuid(), Name = "PSG", SportCode = "soccer" };
        var awayTeam = new Team { Id = Guid.NewGuid(), Name = "OM", SportCode = "soccer" };
        context.Teams.AddRange(homeTeam, awayTeam);

        var match = new Domain.Entities.Match
        {
            Id = Guid.NewGuid(),
            ExternalId = Guid.NewGuid().ToString(),
            SportCode = "soccer",
            LeagueId = league.Id,
            HomeTeamId = homeTeam.Id,
            AwayTeamId = awayTeam.Id,
            StartTime = DateTime.UtcNow.AddDays(1),
            Status = MatchStatus.Scheduled,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Matches.Add(match);
        await context.SaveChangesAsync();

        return (user, match);
    }

    [Fact]
    public async Task CreateAsync_ValidTicket_ReturnsTicketDto()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "My Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.8m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        var result = await ticketService.CreateAsync(user.Id, dto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Title.Should().Be("My Ticket");
        result.IsPublic.Should().BeTrue();
        result.ConfidenceIndex.Should().Be(7);
        result.Status.Should().Be("Open");
        result.Selections.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateAsync_SetsCorrectSportsAndAvgOdds()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "Multi-odds Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 2.0m, "PSG vs OM", "Ligue 1")
            }
        );

        // Act
        var result = await ticketService.CreateAsync(user.Id, dto);

        // Assert
        result.Sports.Should().Contain("soccer");
        result.AvgOdds.Should().Be(2.0m);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingTicket_ReturnsTicket()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "Find Me",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 8,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        var created = await ticketService.CreateAsync(user.Id, dto);

        // Act
        var result = await ticketService.GetByIdAsync(created.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(created.Id);
        result.Title.Should().Be("Find Me");
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingTicket_ReturnsNull()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);

        // Act
        var result = await ticketService.GetByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ValidUpdate_ReturnsUpdatedTicket()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var createDto = new CreateTicketDto(
            Title: "Original Title",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        var created = await ticketService.CreateAsync(user.Id, createDto);

        var updateDto = new UpdateTicketDto(
            Title: "Updated Title",
            IsPublic: false,
            PriceEur: 1.00m,
            ConfidenceIndex: 9,
            Selections: null
        );

        // Act
        var result = await ticketService.UpdateAsync(created.Id, user.Id, updateDto);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.IsPublic.Should().BeFalse();
        result.PriceEur.Should().Be(1.00m);
        result.ConfidenceIndex.Should().Be(9);
    }

    [Fact]
    public async Task UpdateAsync_WrongUser_ThrowsUnauthorized()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var createDto = new CreateTicketDto(
            Title: "My Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        var created = await ticketService.CreateAsync(user.Id, createDto);

        var updateDto = new UpdateTicketDto(
            Title: "Hacked!",
            IsPublic: null,
            PriceEur: null,
            ConfidenceIndex: null,
            Selections: null
        );

        // Act & Assert - service throws UnauthorizedAccessException for wrong user
        var act = async () => await ticketService.UpdateAsync(created.Id, Guid.NewGuid(), updateDto);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task DeleteAsync_OwnerDeletes_ReturnsTrue()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "To Delete",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        var created = await ticketService.CreateAsync(user.Id, dto);

        // Act
        var result = await ticketService.DeleteAsync(created.Id, user.Id);

        // Assert
        result.Should().BeTrue();
        var deleted = await ticketService.GetByIdAsync(created.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WrongUser_ThrowsUnauthorized()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "Protected",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        var created = await ticketService.CreateAsync(user.Id, dto);

        // Act & Assert - service throws UnauthorizedAccessException for wrong user
        var act = async () => await ticketService.DeleteAsync(created.Id, Guid.NewGuid());
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetPublicTicketsPaginatedAsync_ReturnsOnlyOpenTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        // Create an open ticket
        var dto = new CreateTicketDto(
            Title: "Open Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        await ticketService.CreateAsync(user.Id, dto);

        // Act
        var result = await ticketService.GetPublicTicketsPaginatedAsync(
            page: 1, pageSize: 10, sports: null, minOdds: null, maxOdds: null);

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items.First().Status.Should().Be("Open");
    }

    // Note: Sport filter tests require PostgreSQL - InMemory provider doesn't support array Contains
    // [Fact(Skip = "Requires PostgreSQL")]
    // public async Task GetPublicTicketsPaginatedAsync_FiltersBySport() { }

    [Fact]
    public async Task GetPublicTicketsPaginatedAsync_FiltersByOddsRange()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "Medium Odds",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 2.5m, "PSG vs OM", "Ligue 1")
            }
        );
        await ticketService.CreateAsync(user.Id, dto);

        // Act - filter for odds > 3 (should return 0)
        var highOddsResult = await ticketService.GetPublicTicketsPaginatedAsync(
            page: 1, pageSize: 10, sports: null, minOdds: 3.0m, maxOdds: null);

        // Assert
        highOddsResult.Items.Should().BeEmpty();

        // Act - filter for odds between 2 and 3 (should return 1)
        var matchingResult = await ticketService.GetPublicTicketsPaginatedAsync(
            page: 1, pageSize: 10, sports: null, minOdds: 2.0m, maxOdds: 3.0m);

        // Assert
        matchingResult.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetPublicTicketsPaginatedAsync_ExcludesUserOwnTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);
        var (user, match) = await SetupUserAndMatchAsync(context);

        var dto = new CreateTicketDto(
            Title: "My Own Ticket",
            IsPublic: true,
            PriceEur: 0m,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(match.Id, "soccer", "1X2", "1", 1.5m, "PSG vs OM", "Ligue 1")
            }
        );
        await ticketService.CreateAsync(user.Id, dto);

        // Act - exclude user's own tickets
        var result = await ticketService.GetPublicTicketsPaginatedAsync(
            page: 1, pageSize: 10, sports: null, minOdds: null, maxOdds: null,
            excludeUserId: user.Id);

        // Assert
        result.Items.Should().BeEmpty();
    }

    [Theory]
    [InlineData(new[] { 2.0 }, 2.0)]
    [InlineData(new[] { 2.0, 3.0 }, 2.5)] // Average: (2+3)/2 = 2.5
    [InlineData(new[] { 1.5, 2.0, 3.0 }, 2.17)] // Average: (1.5+2+3)/3 ≈ 2.17
    public void CalculateAverageOdds_ReturnsAverage(double[] odds, double expected)
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var ticketService = CreateService(context);

        // Act
        var result = ticketService.CalculateAverageOdds(odds.Select(o => (decimal)o));

        // Assert
        result.Should().BeApproximately((decimal)expected, 0.05m);
    }
}

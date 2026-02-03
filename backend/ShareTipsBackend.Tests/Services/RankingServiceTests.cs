using FluentAssertions;
using Moq;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class RankingServiceTests
{
    private static RankingService CreateService(Data.ApplicationDbContext context)
    {
        var cacheService = new Mock<ICacheService>();
        // Bypass cache in tests - always compute fresh by invoking the factory
        cacheService.Setup(x => x.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<Task<DTOs.RankingResponseDto>>>(),
                It.IsAny<TimeSpan?>()))
            .Returns((string key, Func<Task<DTOs.RankingResponseDto>> factory, TimeSpan? _) => factory());
        return new RankingService(context, cacheService.Object);
    }

    [Theory]
    [InlineData("daily")]
    [InlineData("weekly")]
    [InlineData("monthly")]
    public async Task GetRankingAsync_ValidPeriod_ReturnsRanking(string period)
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var rankingService = CreateService(context);

        // Act
        var result = await rankingService.GetRankingAsync(period);

        // Assert
        result.Should().NotBeNull();
        result.Period.Should().Be(period);
        result.PeriodStart.Should().BeBefore(result.PeriodEnd);
    }

    [Fact]
    public async Task GetRankingAsync_InvalidPeriod_ThrowsException()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var rankingService = CreateService(context);

        // Act & Assert
        var act = async () => await rankingService.GetRankingAsync("invalid");

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Invalid period*");
    }

    [Fact]
    public async Task GetRankingAsync_WithFinishedTickets_CalculatesCorrectly()
    {
        // Arrange
        using var context = DbContextFactory.Create();

        var user1 = new User
        {
            Id = Guid.NewGuid(),
            Email = "user1@test.com",
            Username = "TopPlayer",
            PasswordHash = "hash",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        var user2 = new User
        {
            Id = Guid.NewGuid(),
            Email = "user2@test.com",
            Username = "AveragePlayer",
            PasswordHash = "hash",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.AddRange(user1, user2);

        // User 1: 3 tickets - 2 wins (odds 2.0, 3.0), 1 loss
        // ROI = ((2.0-1) + (3.0-1) + (-1)) / 3 * 100 = (1 + 2 - 1) / 3 * 100 = 66.67%
        // WinRate = 2/3 * 100 = 66.67%
        var ticket1 = CreateTicket(user1.Id, TicketResult.Win, 2.0m, DateTime.UtcNow.AddDays(-1));
        var ticket2 = CreateTicket(user1.Id, TicketResult.Win, 3.0m, DateTime.UtcNow.AddDays(-2));
        var ticket3 = CreateTicket(user1.Id, TicketResult.Lose, 2.5m, DateTime.UtcNow.AddDays(-3));

        // User 2: 2 tickets - 1 win (odds 1.5), 1 loss
        // ROI = ((1.5-1) + (-1)) / 2 * 100 = (0.5 - 1) / 2 * 100 = -25%
        // WinRate = 1/2 * 100 = 50%
        var ticket4 = CreateTicket(user2.Id, TicketResult.Win, 1.5m, DateTime.UtcNow.AddDays(-1));
        var ticket5 = CreateTicket(user2.Id, TicketResult.Lose, 2.0m, DateTime.UtcNow.AddDays(-2));

        context.Tickets.AddRange(ticket1, ticket2, ticket3, ticket4, ticket5);
        await context.SaveChangesAsync();

        var rankingService = CreateService(context);

        // Act
        var result = await rankingService.GetRankingAsync("weekly");

        // Assert
        result.Rankings.Should().HaveCount(2);

        var rankings = result.Rankings.ToList();
        rankings[0].Username.Should().Be("TopPlayer");
        rankings[0].Rank.Should().Be(1);
        rankings[0].ROI.Should().BeApproximately(66.67m, 0.01m);
        rankings[0].WinRate.Should().BeApproximately(66.67m, 0.01m);
        rankings[0].TotalTickets.Should().Be(3);
        rankings[0].WinCount.Should().Be(2);
        rankings[0].LoseCount.Should().Be(1);

        rankings[1].Username.Should().Be("AveragePlayer");
        rankings[1].Rank.Should().Be(2);
        rankings[1].ROI.Should().BeApproximately(-25m, 0.01m);
        rankings[1].WinRate.Should().BeApproximately(50m, 0.01m);
        rankings[1].TotalTickets.Should().Be(2);
    }

    [Fact]
    public async Task GetRankingAsync_OnlyCountsPublicTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@test.com",
            Username = "TestUser",
            PasswordHash = "hash",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        var publicTicket = CreateTicket(user.Id, TicketResult.Win, 2.0m, DateTime.UtcNow.AddDays(-1));
        publicTicket.IsPublic = true;

        var privateTicket = CreateTicket(user.Id, TicketResult.Win, 5.0m, DateTime.UtcNow.AddDays(-1));
        privateTicket.IsPublic = false;

        context.Tickets.AddRange(publicTicket, privateTicket);
        await context.SaveChangesAsync();

        var rankingService = CreateService(context);

        // Act
        var result = await rankingService.GetRankingAsync("weekly");

        // Assert
        var ranking = result.Rankings.Single();
        ranking.TotalTickets.Should().Be(1); // Only the public ticket
    }

    [Fact]
    public async Task GetRankingAsync_ExcludesPendingTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@test.com",
            Username = "TestUser",
            PasswordHash = "hash",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        var finishedTicket = CreateTicket(user.Id, TicketResult.Win, 2.0m, DateTime.UtcNow.AddDays(-1));

        var pendingTicket = CreateTicket(user.Id, TicketResult.Pending, 3.0m, DateTime.UtcNow.AddDays(-1));
        pendingTicket.Status = TicketStatus.Open;

        context.Tickets.AddRange(finishedTicket, pendingTicket);
        await context.SaveChangesAsync();

        var rankingService = CreateService(context);

        // Act
        var result = await rankingService.GetRankingAsync("weekly");

        // Assert
        var ranking = result.Rankings.Single();
        ranking.TotalTickets.Should().Be(1); // Only the finished ticket
    }

    [Fact]
    public async Task GetRankingAsync_RespectsLimit()
    {
        // Arrange
        using var context = DbContextFactory.Create();

        // Create 5 users with tickets
        for (int i = 0; i < 5; i++)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = $"user{i}@test.com",
                Username = $"User{i}",
                PasswordHash = "hash",
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);

            var ticket = CreateTicket(user.Id, TicketResult.Win, 2.0m + (i * 0.1m), DateTime.UtcNow.AddDays(-1));
            context.Tickets.Add(ticket);
        }
        await context.SaveChangesAsync();

        var rankingService = CreateService(context);

        // Act
        var result = await rankingService.GetRankingAsync("weekly", limit: 3);

        // Assert
        result.Rankings.Should().HaveCount(3);
    }

    private static Ticket CreateTicket(Guid creatorId, TicketResult result, decimal avgOdds, DateTime matchTime)
    {
        return new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = creatorId,
            Title = "Test Ticket",
            PriceCents = 1000,
            IsPublic = true,
            Status = TicketStatus.Finished,
            Result = result,
            AvgOdds = avgOdds,
            ConfidenceIndex = 3,
            FirstMatchTime = matchTime,
            CreatedAt = DateTime.UtcNow
        };
    }
}

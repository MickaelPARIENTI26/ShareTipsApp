using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services.Interfaces;
using Xunit;

namespace ShareTipsBackend.Tests.BackgroundServices;

public class MatchResultServiceNotificationTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private async Task<User> CreateUserAsync(ApplicationDbContext context, string username)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{username}@example.com",
            Username = username,
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        // Create wallet for the user
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TipsterBalanceCents = 10000,
            PendingPayoutCents = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Wallets.Add(wallet);

        await context.SaveChangesAsync();
        return user;
    }

    private async Task<(Ticket ticket, Domain.Entities.Match match)> CreateTicketWithMatchAsync(
        ApplicationDbContext context,
        User creator,
        TicketStatus status = TicketStatus.Locked)
    {
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
            StartTime = DateTime.UtcNow.AddDays(-1),
            Status = MatchStatus.Finished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Matches.Add(match);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = creator.Id,
            Creator = creator,
            Title = "Test Ticket",
            IsPublic = true,
            PriceCents = 1000,
            ConfidenceIndex = 7,
            AvgOdds = 2.5m,
            Sports = new[] { "soccer" },
            FirstMatchTime = match.StartTime,
            Status = status,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow,
            Selections = new List<TicketSelection>
            {
                new TicketSelection
                {
                    Id = Guid.NewGuid(),
                    MatchId = match.Id,
                    MarketType = "1X2",
                    SelectionLabel = "1",
                    Odds = 2.5m,
                    MatchLabel = "PSG vs OM",
                    LeagueName = "Ligue 1"
                }
            }
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        return (ticket, match);
    }

    [Fact]
    public async Task NotifyTicketResult_WhenTicketWon_ShouldSendCorrectNotification()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var tipster = await CreateUserAsync(context, "tipster1");
        var buyer = await CreateUserAsync(context, "buyer1");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        // Add purchase
        context.TicketPurchases.Add(new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Simulate ticket winning
        ticket.Result = TicketResult.Win;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act - Call the notification logic directly
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Contains(buyer.Id)),
                NotificationType.TicketWon,
                "Ticket gagnant 🎉",
                It.Is<string>(msg => msg.Contains("tipster1") && msg.Contains("gagné")),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyTicketResult_WhenTicketLost_ShouldSendCorrectNotification()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var tipster = await CreateUserAsync(context, "tipster2");
        var buyer = await CreateUserAsync(context, "buyer2");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        // Add purchase
        context.TicketPurchases.Add(new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Simulate ticket losing
        ticket.Result = TicketResult.Lose;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Contains(buyer.Id)),
                NotificationType.TicketLost,
                "Ticket perdant ❌",
                It.Is<string>(msg => msg.Contains("tipster2") && msg.Contains("perdu")),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyTicketResult_ShouldNotifyBuyersAndActiveSubscribers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var tipster = await CreateUserAsync(context, "tipster3");
        var buyer = await CreateUserAsync(context, "buyer3");
        var subscriber = await CreateUserAsync(context, "subscriber3");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        // Add purchase
        context.TicketPurchases.Add(new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        });

        // Add active subscription
        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriber.Id,
            TipsterId = tipster.Id,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        ticket.Result = TicketResult.Win;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert - Both buyer and subscriber should be notified
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids =>
                    ids.Count() == 2 &&
                    ids.Contains(buyer.Id) &&
                    ids.Contains(subscriber.Id)),
                NotificationType.TicketWon,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyTicketResult_ShouldNotDuplicateNotifications()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var tipster = await CreateUserAsync(context, "tipster4");
        var buyerAndSubscriber = await CreateUserAsync(context, "buyerAndSubscriber");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        // User is both buyer and subscriber
        context.TicketPurchases.Add(new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyerAndSubscriber.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        });

        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = buyerAndSubscriber.Id,
            TipsterId = tipster.Id,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        ticket.Result = TicketResult.Win;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert - Should have exactly 1 user (no duplicates)
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids => ids.Count() == 1 && ids.Contains(buyerAndSubscriber.Id)),
                NotificationType.TicketWon,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyTicketResult_ShouldNotNotifyExpiredSubscribers()
    {
        // Arrange
        using var context = CreateContext();
        var mockNotificationService = new Mock<INotificationService>();

        var tipster = await CreateUserAsync(context, "tipster5");
        var activeSubscriber = await CreateUserAsync(context, "activeSubscriber");
        var expiredSubscriber = await CreateUserAsync(context, "expiredSubscriber");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        // Add active subscription
        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = activeSubscriber.Id,
            TipsterId = tipster.Id,
            Status = SubscriptionStatus.Active,
            StartDate = DateTime.UtcNow.AddDays(-30),
            EndDate = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        });

        // Add expired subscription
        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = expiredSubscriber.Id,
            TipsterId = tipster.Id,
            Status = SubscriptionStatus.Expired,
            StartDate = DateTime.UtcNow.AddDays(-60),
            EndDate = DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        ticket.Result = TicketResult.Lose;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert - Only active subscriber should be notified
        mockNotificationService.Verify(
            s => s.NotifyManyAsync(
                It.Is<IEnumerable<Guid>>(ids =>
                    ids.Count() == 1 &&
                    ids.Contains(activeSubscriber.Id) &&
                    !ids.Contains(expiredSubscriber.Id)),
                NotificationType.TicketLost,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyTicketResult_ShouldIncludeCorrectDataInNotification()
    {
        // Arrange
        using var context = CreateContext();
        object? capturedData = null;
        var mockNotificationService = new Mock<INotificationService>();
        mockNotificationService
            .Setup(s => s.NotifyManyAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<NotificationType>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>()))
            .Callback<IEnumerable<Guid>, NotificationType, string, string, object?>(
                (_, _, _, _, data) => capturedData = data);

        var tipster = await CreateUserAsync(context, "tipster6");
        var buyer = await CreateUserAsync(context, "buyer6");
        var (ticket, _) = await CreateTicketWithMatchAsync(context, tipster);

        context.TicketPurchases.Add(new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            BuyerId = buyer.Id,
            PriceCents = 1000,
            CommissionCents = 170,
            SellerAmountCents = 830,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        ticket.Result = TicketResult.Win;
        ticket.Status = TicketStatus.Finished;
        await context.SaveChangesAsync();

        // Act
        await SimulateNotifyTicketResultAsync(context, mockNotificationService.Object, ticket);

        // Assert
        Assert.NotNull(capturedData);
        var dataType = capturedData.GetType();
        var ticketIdProp = dataType.GetProperty("ticketId");
        var tipsterIdProp = dataType.GetProperty("tipsterId");

        Assert.NotNull(ticketIdProp);
        Assert.NotNull(tipsterIdProp);
        Assert.Equal(ticket.Id, ticketIdProp.GetValue(capturedData));
        Assert.Equal(tipster.Id, tipsterIdProp.GetValue(capturedData));
    }

    // Helper method that simulates the notification logic from MatchResultService
    private async Task SimulateNotifyTicketResultAsync(
        ApplicationDbContext context,
        INotificationService notificationService,
        Ticket ticket)
    {
        // Reload ticket with all relationships
        var loadedTicket = await context.Tickets
            .Include(t => t.Creator)
            .Include(t => t.Purchases)
            .FirstAsync(t => t.Id == ticket.Id);

        var isWin = loadedTicket.Result == TicketResult.Win;
        var notificationType = isWin ? NotificationType.TicketWon : NotificationType.TicketLost;
        var title = isWin ? "Ticket gagnant 🎉" : "Ticket perdant ❌";
        var tipsterName = loadedTicket.Creator?.Username ?? "Un tipster";
        var message = isWin
            ? $"Le ticket de {tipsterName} a gagné !"
            : $"Le ticket de {tipsterName} a perdu.";

        // Get buyers of the ticket
        var buyerIds = loadedTicket.Purchases
            .Select(p => p.BuyerId)
            .ToList();

        // Get active subscribers of the tipster
        var now = DateTime.UtcNow;
        var subscriberIds = await context.Subscriptions
            .Where(s => s.TipsterId == loadedTicket.CreatorId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > now)
            .Select(s => s.SubscriberId)
            .ToListAsync();

        // Combine without duplicates
        var userIdsToNotify = buyerIds
            .Union(subscriberIds)
            .Distinct()
            .ToList();

        if (userIdsToNotify.Count == 0)
            return;

        await notificationService.NotifyManyAsync(
            userIdsToNotify,
            notificationType,
            title,
            message,
            new { ticketId = loadedTicket.Id, tipsterId = loadedTicket.CreatorId });
    }
}

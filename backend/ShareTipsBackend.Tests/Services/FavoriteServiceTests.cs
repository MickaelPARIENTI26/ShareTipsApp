using FluentAssertions;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class FavoriteServiceTests
{
    private async Task<(User user, Ticket ticket)> SetupUserAndTicketAsync(
        Data.ApplicationDbContext context,
        string username = "testuser",
        Guid? creatorId = null)
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

        var ticketCreatorId = creatorId ?? Guid.NewGuid();

        // Create creator if different from user
        if (ticketCreatorId != user.Id)
        {
            var creator = new User
            {
                Id = ticketCreatorId,
                Email = "creator@example.com",
                Username = "creator",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(creator);
        }

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = ticketCreatorId,
            Title = "Test Ticket",
            IsPublic = true,
            PriceCredits = 0,
            ConfidenceIndex = 5,
            AvgOdds = 2.0m,
            Sports = new[] { "soccer" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        return (user, ticket);
    }

    [Fact]
    public async Task ToggleFavoriteAsync_AddToFavorites_ReturnsTrueWithMessage()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket) = await SetupUserAndTicketAsync(context);

        // Act
        var result = await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);

        // Assert
        result.IsFavorited.Should().BeTrue();
        result.Message.Should().Contain("Added");
    }

    [Fact]
    public async Task ToggleFavoriteAsync_RemoveFromFavorites_ReturnsFalseWithMessage()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket) = await SetupUserAndTicketAsync(context);

        // First add to favorites
        await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);

        // Act - toggle again to remove
        var result = await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);

        // Assert
        result.IsFavorited.Should().BeFalse();
        result.Message.Should().Contain("Removed");
    }

    [Fact]
    public async Task ToggleFavoriteAsync_NonExistingTicket_ReturnsFalseWithError()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);

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
        await context.SaveChangesAsync();

        // Act
        var result = await favoriteService.ToggleFavoriteAsync(user.Id, Guid.NewGuid());

        // Assert
        result.IsFavorited.Should().BeFalse();
        result.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task ToggleFavoriteAsync_OwnTicket_ReturnsFalseWithError()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);

        // Create user who owns a ticket
        var userId = Guid.NewGuid();
        var owner = new User
        {
            Id = userId,
            Email = "owner@example.com",
            Username = "owner",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(owner);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = userId, // Same as user
            Title = "My Own Ticket",
            IsPublic = true,
            PriceCredits = 0,
            ConfidenceIndex = 5,
            AvgOdds = 2.0m,
            Sports = new[] { "soccer" },
            FirstMatchTime = DateTime.UtcNow.AddDays(1),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act - try to favorite own ticket
        var result = await favoriteService.ToggleFavoriteAsync(userId, ticket.Id);

        // Assert
        result.IsFavorited.Should().BeFalse();
        result.Message.Should().Contain("own ticket");
    }

    [Fact]
    public async Task GetMyFavoritesAsync_ReturnsFavoritedTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket1) = await SetupUserAndTicketAsync(context);

        // Create a second ticket
        var ticket2 = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = Guid.NewGuid(),
            Title = "Second Ticket",
            IsPublic = true,
            PriceCredits = 50,
            ConfidenceIndex = 8,
            AvgOdds = 3.0m,
            Sports = new[] { "basketball" },
            FirstMatchTime = DateTime.UtcNow.AddDays(2),
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow
        };
        context.Tickets.Add(ticket2);

        // Create creator for second ticket
        var creator2 = new User
        {
            Id = ticket2.CreatorId,
            Email = "creator2@example.com",
            Username = "creator2",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(creator2);
        await context.SaveChangesAsync();

        // Add both to favorites
        await favoriteService.ToggleFavoriteAsync(user.Id, ticket1.Id);
        await favoriteService.ToggleFavoriteAsync(user.Id, ticket2.Id);

        // Act
        var result = (await favoriteService.GetMyFavoritesAsync(user.Id)).ToList();

        // Assert
        result.Should().HaveCount(2);
        result.Select(f => f.TicketId).Should().Contain(ticket1.Id);
        result.Select(f => f.TicketId).Should().Contain(ticket2.Id);
    }

    [Fact]
    public async Task GetMyFavoritesAsync_NoFavorites_ReturnsEmptyList()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "lonely@example.com",
            Username = "lonely",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var result = await favoriteService.GetMyFavoritesAsync(user.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMyFavoritesAsync_ExcludesDeletedTickets()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket) = await SetupUserAndTicketAsync(context);

        // Add to favorites
        await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);

        // Soft delete the ticket
        ticket.DeletedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Act
        var result = await favoriteService.GetMyFavoritesAsync(user.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task IsFavoritedAsync_WhenFavorited_ReturnsTrue()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket) = await SetupUserAndTicketAsync(context);

        await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);

        // Act
        var result = await favoriteService.IsFavoritedAsync(user.Id, ticket.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsFavoritedAsync_WhenNotFavorited_ReturnsFalse()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, ticket) = await SetupUserAndTicketAsync(context);

        // Act - don't add to favorites
        var result = await favoriteService.IsFavoritedAsync(user.Id, ticket.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetMyFavoritesAsync_ReturnsOrderedByMostRecent()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var favoriteService = new FavoriteService(context);
        var (user, _) = await SetupUserAndTicketAsync(context);

        // Create 3 tickets with different creators
        var tickets = new List<Ticket>();
        for (int i = 0; i < 3; i++)
        {
            var creatorId = Guid.NewGuid();
            var creator = new User
            {
                Id = creatorId,
                Email = $"creator{i}@example.com",
                Username = $"creator{i}",
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(creator);

            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                CreatorId = creatorId,
                Title = $"Ticket {i}",
                IsPublic = true,
                PriceCredits = 0,
                ConfidenceIndex = 5,
                AvgOdds = 2.0m,
                Sports = new[] { "soccer" },
                FirstMatchTime = DateTime.UtcNow.AddDays(1),
                Status = TicketStatus.Open,
                Result = TicketResult.Pending,
                CreatedAt = DateTime.UtcNow
            };
            context.Tickets.Add(ticket);
            tickets.Add(ticket);
        }
        await context.SaveChangesAsync();

        // Favorite in order: 0, 1, 2
        foreach (var ticket in tickets)
        {
            await favoriteService.ToggleFavoriteAsync(user.Id, ticket.Id);
            await Task.Delay(10); // Small delay to ensure different timestamps
        }

        // Act
        var result = (await favoriteService.GetMyFavoritesAsync(user.Id)).ToList();

        // Assert - most recent first (ticket 2, then 1, then 0)
        result.Should().HaveCount(3);
        result[0].TicketId.Should().Be(tickets[2].Id);
        result[2].TicketId.Should().Be(tickets[0].Id);
    }
}

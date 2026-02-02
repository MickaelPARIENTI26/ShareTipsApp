using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Tests.Integration;

/// <summary>
/// Integration tests for TicketsController.
/// NOTE: These tests require PostgreSQL database running.
/// Run with: dotnet test --filter "Category=Integration"
/// Skip with: dotnet test --filter "Category!=Integration"
/// </summary>
[Trait("Category", "Integration")]
public class TicketsControllerTests : IntegrationTestBase
{
    public TicketsControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private async Task<AuthResponse> CreateAuthenticatedUserAsync(string prefix = "test")
    {
        var email = $"{prefix}{Guid.NewGuid()}@example.com";
        var username = $"{prefix}{Guid.NewGuid():N}"[..20];
        var authResponse = await RegisterUserAsync(email, "Password123!", username);
        SetAuthToken(authResponse.AccessToken);
        return authResponse;
    }

    private CreateTicketDto CreateValidTicketDto(string title = "Test Ticket")
    {
        return new CreateTicketDto(
            Title: title,
            IsPublic: true,
            PriceCredits: 0,
            ConfidenceIndex: 7,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(
                    MatchId: Guid.NewGuid(),
                    Sport: "soccer",
                    MarketType: "1X2",
                    SelectionCode: "1",
                    Odds: 1.85m,
                    MatchLabel: "PSG vs OM",
                    LeagueName: "Ligue 1"
                )
            }
        );
    }

    [Fact]
    public async Task CreateTicket_WithValidToken_ReturnsCreated()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var ticketDto = CreateValidTicketDto("My First Ticket");

        // Act
        var response = await Client.PostAsJsonAsync("/api/tickets", ticketDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var content = await response.Content.ReadAsStringAsync();
        var ticket = JsonSerializer.Deserialize<TicketDto>(content, JsonOptions);

        ticket.Should().NotBeNull();
        ticket!.Id.Should().NotBeEmpty();
        ticket.Title.Should().Be("My First Ticket");
        ticket.IsPublic.Should().BeTrue();
        ticket.ConfidenceIndex.Should().Be(7);
        ticket.Status.Should().Be("Open");
    }

    [Fact]
    public async Task CreateTicket_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        ClearAuthToken();
        var ticketDto = CreateValidTicketDto();

        // Act
        var response = await Client.PostAsJsonAsync("/api/tickets", ticketDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTicket_EmptySelections_ReturnsBadRequest()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var ticketDto = new CreateTicketDto(
            Title: "Empty Ticket",
            IsPublic: true,
            PriceCredits: 0,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>()
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/tickets", ticketDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetMyTickets_ReturnsUserTickets()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Create 2 tickets
        await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Ticket 1"));
        await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Ticket 2"));

        // Act
        var response = await Client.GetAsync("/api/tickets/my");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var tickets = JsonSerializer.Deserialize<List<TicketDto>>(content, JsonOptions);

        tickets.Should().NotBeNull();
        tickets!.Count.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task GetMyTickets_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        ClearAuthToken();

        // Act
        var response = await Client.GetAsync("/api/tickets/my");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTicketById_ExistingTicket_ReturnsTicket()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var createResponse = await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Find Me"));
        var createdTicket = JsonSerializer.Deserialize<TicketDto>(
            await createResponse.Content.ReadAsStringAsync(), JsonOptions);

        // Act
        var response = await Client.GetAsync($"/api/tickets/{createdTicket!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var ticket = JsonSerializer.Deserialize<TicketDto>(content, JsonOptions);

        ticket.Should().NotBeNull();
        ticket!.Id.Should().Be(createdTicket.Id);
        ticket.Title.Should().Be("Find Me");
    }

    [Fact]
    public async Task GetTicketById_NonExistent_ReturnsNotFound()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Act
        var response = await Client.GetAsync($"/api/tickets/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateTicket_OwnerUpdates_ReturnsOk()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var createResponse = await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Original"));
        var createdTicket = JsonSerializer.Deserialize<TicketDto>(
            await createResponse.Content.ReadAsStringAsync(), JsonOptions);

        var updateDto = new UpdateTicketDto(
            Title: "Updated Title",
            IsPublic: false,
            PriceCredits: 50,
            ConfidenceIndex: 9,
            Selections: null
        );

        // Act
        var response = await Client.PutAsJsonAsync($"/api/tickets/{createdTicket!.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var updatedTicket = JsonSerializer.Deserialize<TicketDto>(content, JsonOptions);

        updatedTicket.Should().NotBeNull();
        updatedTicket!.Title.Should().Be("Updated Title");
        updatedTicket.IsPublic.Should().BeFalse();
        updatedTicket.PriceCredits.Should().Be(50);
        updatedTicket.ConfidenceIndex.Should().Be(9);
    }

    [Fact]
    public async Task UpdateTicket_NonOwner_ReturnsForbidden()
    {
        // Arrange - User 1 creates ticket
        await CreateAuthenticatedUserAsync("owner");
        var createResponse = await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Protected"));
        var createdTicket = JsonSerializer.Deserialize<TicketDto>(
            await createResponse.Content.ReadAsStringAsync(), JsonOptions);

        // User 2 tries to update
        await CreateAuthenticatedUserAsync("hacker");
        var updateDto = new UpdateTicketDto(
            Title: "Hacked!",
            IsPublic: null,
            PriceCredits: null,
            ConfidenceIndex: null,
            Selections: null
        );

        // Act
        var response = await Client.PutAsJsonAsync($"/api/tickets/{createdTicket!.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteTicket_OwnerDeletes_ReturnsNoContent()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var createResponse = await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("To Delete"));
        var createdTicket = JsonSerializer.Deserialize<TicketDto>(
            await createResponse.Content.ReadAsStringAsync(), JsonOptions);

        // Act
        var response = await Client.DeleteAsync($"/api/tickets/{createdTicket!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion
        var getResponse = await Client.GetAsync($"/api/tickets/{createdTicket.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteTicket_NonOwner_ReturnsForbidden()
    {
        // Arrange - User 1 creates ticket
        await CreateAuthenticatedUserAsync("owner");
        var createResponse = await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Protected"));
        var createdTicket = JsonSerializer.Deserialize<TicketDto>(
            await createResponse.Content.ReadAsStringAsync(), JsonOptions);

        // User 2 tries to delete
        await CreateAuthenticatedUserAsync("hacker");

        // Act
        var response = await Client.DeleteAsync($"/api/tickets/{createdTicket!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetPublicTickets_ReturnsPublicTickets()
    {
        // Arrange - Create a public ticket
        await CreateAuthenticatedUserAsync();
        await Client.PostAsJsonAsync("/api/tickets", CreateValidTicketDto("Public Ticket"));

        // Clear auth to test anonymous access
        ClearAuthToken();

        // Act
        var response = await Client.GetAsync("/api/tickets/public?page=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PaginatedResult<TicketDto>>(content, JsonOptions);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
    }

    [Fact]
    public async Task GetPublicTickets_WithOddsFilter_FiltersCorrectly()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Create ticket with known odds
        var ticketDto = new CreateTicketDto(
            Title: "High Odds",
            IsPublic: true,
            PriceCredits: 0,
            ConfidenceIndex: 5,
            Selections: new List<CreateTicketSelectionDto>
            {
                new(Guid.NewGuid(), "soccer", "1X2", "1", 3.5m, "Match 1", "League 1")
            }
        );
        await Client.PostAsJsonAsync("/api/tickets", ticketDto);

        // Act - Filter for odds > 4 (should not include our ticket)
        var response = await Client.GetAsync("/api/tickets/public?page=1&pageSize=10&minOdds=4");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PaginatedResult<TicketDto>>(content, JsonOptions);

        // Our 3.5 odds ticket should not appear
        result!.Items.Should().NotContain(t => t.Title == "High Odds");
    }
}

// Helper class for paginated results
public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

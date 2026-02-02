using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Tests.Integration;

/// <summary>
/// Integration tests for WalletController.
/// NOTE: These tests require PostgreSQL database running.
/// Run with: dotnet test --filter "Category=Integration"
/// Skip with: dotnet test --filter "Category!=Integration"
/// </summary>
[Trait("Category", "Integration")]
public class WalletControllerTests : IntegrationTestBase
{
    public WalletControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    private async Task<AuthResponse> CreateAuthenticatedUserAsync(string prefix = "wallet")
    {
        var email = $"{prefix}{Guid.NewGuid()}@example.com";
        var username = $"{prefix}{Guid.NewGuid():N}"[..20];
        var authResponse = await RegisterUserAsync(email, "Password123!", username);
        SetAuthToken(authResponse.AccessToken);
        return authResponse;
    }

    [Fact]
    public async Task GetWallet_AuthenticatedUser_ReturnsWallet()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Act
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var wallet = JsonSerializer.Deserialize<WalletDto>(content, JsonOptions);

        wallet.Should().NotBeNull();
        wallet!.Balance.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task GetWallet_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        ClearAuthToken();

        // Act
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTransactions_ReturnsTransactionHistory()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Act
        var response = await Client.GetAsync("/api/wallet/transactions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var transactions = JsonSerializer.Deserialize<List<TransactionDto>>(content, JsonOptions);

        transactions.Should().NotBeNull();
        // New user may have 0 or more transactions (welcome bonus, etc.)
    }

    [Fact]
    public async Task GetTransactions_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        ClearAuthToken();

        // Act
        var response = await Client.GetAsync("/api/wallet/transactions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AddCredits_ValidAmount_UpdatesBalance()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Get initial balance
        var initialResponse = await Client.GetAsync("/api/wallet");
        var initialWallet = JsonSerializer.Deserialize<WalletDto>(
            await initialResponse.Content.ReadAsStringAsync(), JsonOptions);

        var addRequest = new { amount = 100 };

        // Act
        var response = await Client.PostAsJsonAsync("/api/wallet/add", addRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify balance increased
        var finalResponse = await Client.GetAsync("/api/wallet");
        var finalWallet = JsonSerializer.Deserialize<WalletDto>(
            await finalResponse.Content.ReadAsStringAsync(), JsonOptions);

        finalWallet!.Balance.Should().Be(initialWallet!.Balance + 100);
    }

    [Fact]
    public async Task AddCredits_NegativeAmount_ReturnsBadRequest()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var addRequest = new { amount = -50 };

        // Act
        var response = await Client.PostAsJsonAsync("/api/wallet/add", addRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddCredits_ZeroAmount_ReturnsBadRequest()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();
        var addRequest = new { amount = 0 };

        // Act
        var response = await Client.PostAsJsonAsync("/api/wallet/add", addRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTransactions_AfterAddCredits_ShowsTransaction()
    {
        // Arrange
        await CreateAuthenticatedUserAsync();

        // Add credits
        var addRequest = new { amount = 250 };
        await Client.PostAsJsonAsync("/api/wallet/add", addRequest);

        // Act
        var response = await Client.GetAsync("/api/wallet/transactions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var transactions = JsonSerializer.Deserialize<List<TransactionDto>>(content, JsonOptions);

        transactions.Should().NotBeNull();
        transactions!.Should().Contain(t => t.Amount == 250);
    }

    [Fact]
    public async Task WalletBalance_NewUser_StartsWithInitialBalance()
    {
        // Arrange & Act
        await CreateAuthenticatedUserAsync();
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var wallet = JsonSerializer.Deserialize<WalletDto>(content, JsonOptions);

        wallet.Should().NotBeNull();
        // New users should have some initial balance (could be 0 or welcome bonus)
        wallet!.Balance.Should().BeGreaterThanOrEqualTo(0);
    }
}

// DTOs for wallet responses
public class WalletDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Balance { get; set; }
}

public class TransactionDto
{
    public Guid Id { get; set; }
    public int Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

using System.Net;
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
        var wallet = JsonSerializer.Deserialize<TipsterWalletTestDto>(content, JsonOptions);

        wallet.Should().NotBeNull();
        wallet!.AvailableBalance.Should().BeGreaterThanOrEqualTo(0);
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
        var transactions = JsonSerializer.Deserialize<List<WalletTransactionTestDto>>(content, JsonOptions);

        transactions.Should().NotBeNull();
        // New user may have 0 or more transactions
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

    // Note: AddCredits, Credit, and Debit endpoints removed with EUR migration
    // Wallet now uses TipsterWalletDto with EUR values

    [Fact]
    public async Task WalletBalance_NewUser_StartsWithZero()
    {
        // Arrange & Act
        await CreateAuthenticatedUserAsync();
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var wallet = JsonSerializer.Deserialize<TipsterWalletTestDto>(content, JsonOptions);

        wallet.Should().NotBeNull();
        // New users start with 0 EUR balance (no more welcome bonus)
        wallet!.AvailableBalance.Should().Be(0);
        wallet.PendingPayout.Should().Be(0);
        wallet.TotalEarned.Should().Be(0);
    }
}

// Test DTOs matching TipsterWalletDto and WalletTransactionDto
public class TipsterWalletTestDto
{
    public decimal AvailableBalance { get; set; }
    public decimal PendingPayout { get; set; }
    public decimal TotalEarned { get; set; }
}

public class WalletTransactionTestDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal AmountEur { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

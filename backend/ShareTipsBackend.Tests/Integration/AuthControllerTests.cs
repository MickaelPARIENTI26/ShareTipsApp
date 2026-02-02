using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Tests.Integration;

/// <summary>
/// Integration tests for AuthController.
/// NOTE: These tests require PostgreSQL database running.
/// Run with: dotnet test --filter "Category=Integration"
/// Skip with: dotnet test --filter "Category!=Integration"
/// </summary>
[Trait("Category", "Integration")]
public class AuthControllerTests : IntegrationTestBase
{
    public AuthControllerTests(CustomWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task Register_ValidRequest_ReturnsTokens()
    {
        // Arrange
        var request = new RegisterRequest(
            $"test{Guid.NewGuid()}@example.com",
            "Password123!",
            $"user{Guid.NewGuid():N}"[..20],
            ValidDob
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, JsonOptions);

        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
        authResponse.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var email = $"duplicate{Guid.NewGuid()}@example.com";
        var request1 = new RegisterRequest(email, "Password123!", "user1" + Guid.NewGuid().ToString("N")[..10], ValidDob);
        var request2 = new RegisterRequest(email, "Password456!", "user2" + Guid.NewGuid().ToString("N")[..10], ValidDob);

        // Act - register first user
        var response1 = await Client.PostAsJsonAsync("/api/auth/register", request1);
        response1.EnsureSuccessStatusCode();

        // Act - try to register with same email
        var response2 = await Client.PostAsJsonAsync("/api/auth/register", request2);

        // Assert
        response2.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WeakPassword_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterRequest(
            $"weak{Guid.NewGuid()}@example.com",
            "weak",  // Too short, no uppercase, no digit
            "weakuser" + Guid.NewGuid().ToString("N")[..5],
            ValidDob
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokens()
    {
        // Arrange
        var email = $"login{Guid.NewGuid()}@example.com";
        var password = "Password123!";
        var username = "loginuser" + Guid.NewGuid().ToString("N")[..5];

        // Register first
        await RegisterUserAsync(email, password, username);

        // Act
        var loginRequest = new LoginRequest(email, password);
        var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, JsonOptions);

        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty();
        authResponse.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var email = $"wrongpwd{Guid.NewGuid()}@example.com";
        var password = "Password123!";
        var username = "wrongpwduser" + Guid.NewGuid().ToString("N")[..5];

        // Register first
        await RegisterUserAsync(email, password, username);

        // Act - login with wrong password
        var loginRequest = new LoginRequest(email, "WrongPassword!");
        var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentUser_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest("nonexistent@example.com", "Password123!");

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_ValidToken_ReturnsNewTokens()
    {
        // Arrange
        var email = $"refresh{Guid.NewGuid()}@example.com";
        var authResponse = await RegisterUserAsync(email, "Password123!", "refreshuser" + Guid.NewGuid().ToString("N")[..5]);

        // Act
        var refreshRequest = new { refreshToken = authResponse.RefreshToken };
        var response = await Client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var newAuthResponse = JsonSerializer.Deserialize<AuthResponse>(content, JsonOptions);

        newAuthResponse.Should().NotBeNull();
        newAuthResponse!.AccessToken.Should().NotBeNullOrEmpty();
        newAuthResponse.RefreshToken.Should().NotBeNullOrEmpty();
        // Token rotation: new refresh token should be different
        newAuthResponse.RefreshToken.Should().NotBe(authResponse.RefreshToken);
    }

    [Fact]
    public async Task Refresh_InvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var refreshRequest = new { refreshToken = "invalid-token" };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/refresh", refreshRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange - no token set
        ClearAuthToken();

        // Act - try to access protected endpoint
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsOk()
    {
        // Arrange
        var email = $"protected{Guid.NewGuid()}@example.com";
        var authResponse = await RegisterUserAsync(email, "Password123!", "protecteduser" + Guid.NewGuid().ToString("N")[..5]);
        SetAuthToken(authResponse.AccessToken);

        // Act - access protected endpoint
        var response = await Client.GetAsync("/api/wallet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

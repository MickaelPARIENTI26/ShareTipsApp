using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Tests.TestHelpers;

namespace ShareTipsBackend.Tests.Services;

public class AuthServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly Mock<IEmailService> _mockEmailService;
    private static readonly DateOnly ValidDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-25));

    public AuthServiceTests()
    {
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "ThisIsAVeryLongSecretKeyForTestingPurposes123!",
            ["Jwt:Issuer"] = "ShareTips",
            ["Jwt:Audience"] = "ShareTipsApp",
            ["Jwt:AccessTokenExpirationMinutes"] = "15",
            ["Jwt:RefreshTokenExpirationDays"] = "30"
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _mockLogger = new Mock<ILogger<AuthService>>();
        _mockEmailService = new Mock<IEmailService>();
    }

    private AuthService CreateService(Data.ApplicationDbContext context)
    {
        return new AuthService(context, _configuration, _mockLogger.Object, _mockEmailService.Object);
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_ReturnsTokens()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        var request = new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob);

        // Act
        var result = await authService.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task RegisterAsync_CreatesUserAndWallet()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        var request = new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob);

        // Act
        await authService.RegisterAsync(request);

        // Assert
        context.Users.Should().HaveCount(1);
        context.Wallets.Should().HaveCount(1);

        var user = context.Users.First();
        user.Username.Should().Be("testuser");
        user.Email.Should().Be("test@example.com");

        var wallet = context.Wallets.First();
        wallet.UserId.Should().Be(user.Id);
        wallet.TipsterBalanceCents.Should().Be(0); // New wallet starts with 0 balance
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        await authService.RegisterAsync(new RegisterRequest("test@example.com", "Password1!", "user1", ValidDob));

        // Act & Assert
        var act = async () => await authService.RegisterAsync(
            new RegisterRequest("test@example.com", "Password2!", "user2", ValidDob));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Email already registered*");
    }

    [Fact]
    public async Task RegisterAsync_DuplicateUsername_ThrowsException()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        await authService.RegisterAsync(new RegisterRequest("user1@example.com", "Password1!", "testuser", ValidDob));

        // Act & Assert
        var act = async () => await authService.RegisterAsync(
            new RegisterRequest("user2@example.com", "Password2!", "testuser", ValidDob));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Username already taken*");
    }

    [Theory]
    [InlineData("short")]                // Too short
    [InlineData("nouppercase1")]         // No uppercase
    [InlineData("NoDigitsHere")]         // No digit
    [InlineData("")]                     // Empty
    public async Task RegisterAsync_InvalidPassword_ThrowsException(string password)
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        var request = new RegisterRequest("test@example.com", password, "testuser", ValidDob);

        // Act & Assert
        var act = async () => await authService.RegisterAsync(request);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Password must be at least 8 characters*");
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokens()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        await authService.RegisterAsync(new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob));

        // Act
        var result = await authService.LoginAsync(new LoginRequest("test@example.com", "Password1!"));

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ThrowsUnauthorized()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        await authService.RegisterAsync(new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob));

        // Act & Assert
        var act = async () => await authService.LoginAsync(
            new LoginRequest("wrong@example.com", "Password1!"));

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsUnauthorized()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        await authService.RegisterAsync(new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob));

        // Act & Assert
        var act = async () => await authService.LoginAsync(
            new LoginRequest("test@example.com", "WrongPassword1!"));

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid email or password*");
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_ReturnsNewTokens()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        var registerResult = await authService.RegisterAsync(
            new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob));

        // Act
        var result = await authService.RefreshTokenAsync(registerResult.RefreshToken);

        // Assert
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(registerResult.RefreshToken); // Token rotation
    }

    [Fact]
    public async Task RefreshTokenAsync_InvalidToken_ThrowsUnauthorized()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);

        // Act & Assert
        var act = async () => await authService.RefreshTokenAsync("invalid-token");

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Invalid refresh token*");
    }

    [Fact]
    public async Task RevokeTokenAsync_ValidToken_RevokesToken()
    {
        // Arrange
        using var context = DbContextFactory.Create();
        var authService = CreateService(context);
        var registerResult = await authService.RegisterAsync(
            new RegisterRequest("test@example.com", "Password1!", "testuser", ValidDob));

        // Act
        await authService.RevokeTokenAsync(registerResult.RefreshToken);

        // Assert - trying to use the revoked token should fail
        var act = async () => await authService.RefreshTokenAsync(registerResult.RefreshToken);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*expired or revoked*");
    }
}

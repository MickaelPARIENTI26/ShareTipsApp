using FluentAssertions;
using FluentValidation.TestHelper;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Validators;

namespace ShareTipsBackend.Tests.Validators;

public class AuthValidatorTests
{
    private readonly RegisterRequestValidator _registerValidator = new();
    private readonly LoginRequestValidator _loginValidator = new();
    private static readonly DateOnly ValidDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-25));

    [Fact]
    public void RegisterRequest_ValidData_PassesValidation()
    {
        // Arrange
        var request = new RegisterRequest("test@example.com", "Password1!", "validuser", ValidDob);

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]  // Too short
    public void RegisterRequest_InvalidUsername_FailsValidation(string username)
    {
        // Arrange
        var request = new RegisterRequest("test@example.com", "Password1!", username, ValidDob);

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Username);
    }

    [Theory]
    [InlineData("")]
    [InlineData("notanemail")]
    [InlineData("@domain.com")]
    public void RegisterRequest_InvalidEmail_FailsValidation(string email)
    {
        // Arrange
        var request = new RegisterRequest(email, "Password1!", "validuser", ValidDob);

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]              // Empty
    [InlineData("short")]         // Too short (no uppercase, no digit either)
    [InlineData("nouppercase1")]  // Missing uppercase
    [InlineData("NoDigitsHere")]  // Missing digit
    public void RegisterRequest_InvalidPassword_FailsValidation(string password)
    {
        // Arrange
        var request = new RegisterRequest("test@example.com", password, "validuser", ValidDob);

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void RegisterRequest_UsernameWithSpecialChars_FailsValidation()
    {
        // Arrange
        var request = new RegisterRequest("test@example.com", "Password1!", "invalid@user!", ValidDob);

        // Act
        var result = _registerValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Username)
            .WithErrorMessage("Username can only contain letters, numbers, and underscores");
    }

    [Fact]
    public void LoginRequest_ValidData_PassesValidation()
    {
        // Arrange
        var request = new LoginRequest("test@example.com", "password123");

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", "password")]
    [InlineData("notanemail", "password")]
    public void LoginRequest_InvalidEmail_FailsValidation(string email, string password)
    {
        // Arrange
        var request = new LoginRequest(email, password);

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void LoginRequest_EmptyPassword_FailsValidation()
    {
        // Arrange
        var request = new LoginRequest("test@example.com", "");

        // Act
        var result = _loginValidator.TestValidate(request);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}

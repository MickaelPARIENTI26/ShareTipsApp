using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion de l'authentification et des comptes utilisateurs
/// </summary>
[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
[Tags("Authentification")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Inscription d'un nouvel utilisateur
    /// </summary>
    /// <param name="request">Données d'inscription (email, username, password)</param>
    /// <returns>Token JWT et informations utilisateur</returns>
    /// <response code="200">Inscription réussie</response>
    /// <response code="400">Email ou username déjà utilisé</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            _logger.LogInformation("New user registered successfully");
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new AuthErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Connexion avec email et mot de passe
    /// </summary>
    /// <param name="request">Identifiants (email, password)</param>
    /// <returns>Token JWT et informations utilisateur</returns>
    /// <response code="200">Connexion réussie</response>
    /// <response code="401">Identifiants invalides</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            _logger.LogInformation("User login successful");
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Failed login attempt from {IP}", HttpContext.Connection.RemoteIpAddress);
            return Unauthorized(new AuthErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new AuthErrorResponse(ex.Message));
        }
    }

    /// <summary>
    /// Revoke a refresh token (logout)
    /// </summary>
    [HttpPost("revoke")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
    {
        await _authService.RevokeTokenAsync(request.RefreshToken);
        return Ok(new { message = "Token revoked" });
    }

    /// <summary>
    /// Request password reset (sends email with code)
    /// </summary>
    [HttpPost("forgot-password")]
    [DisableRateLimiting]
    [EnableRateLimiting("password-reset")]
    [ProducesResponseType(typeof(ForgotPasswordResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var response = await _authService.ForgotPasswordAsync(request.Email);
        return Ok(response);
    }

    /// <summary>
    /// Reset password using code from email
    /// </summary>
    [HttpPost("reset-password")]
    [DisableRateLimiting]
    [EnableRateLimiting("password-reset")]
    [ProducesResponseType(typeof(ForgotPasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ForgotPasswordResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var response = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
        if (!response.Success)
        {
            return BadRequest(response);
        }
        return Ok(response);
    }
}

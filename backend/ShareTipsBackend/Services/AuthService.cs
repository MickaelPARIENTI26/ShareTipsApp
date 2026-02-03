using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Utilities;

namespace ShareTipsBackend.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly IEmailService _emailService;
    private const int BcryptWorkFactor = 12;

    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Validate password policy: min 8 chars, 1 uppercase, 1 digit
        if (!IsValidPassword(request.Password))
        {
            throw new ArgumentException("Password must be at least 8 characters with 1 uppercase and 1 digit");
        }

        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new ArgumentException("Email already registered");
        }

        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            throw new ArgumentException("Username already taken");
        }

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLowerInvariant(),
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, BcryptWorkFactor),
            Role = UserRole.User,
            IsVerified = false,
            DateOfBirth = request.DateOfBirth,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create wallet for user (EUR cents-based)
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TipsterBalanceCents = 0,
            PendingPayoutCents = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Wallets.Add(wallet);
        await _context.SaveChangesAsync();

        // Send welcome email (fire and forget, don't block registration)
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email, user.Username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
            }
        });

        return await GenerateTokensAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant() && u.DeletedAt == null);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        return await GenerateTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        // Hash the incoming token to look up in DB
        var tokenHash = TokenHasher.Hash(refreshToken);

        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        if (!storedToken.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token is expired or revoked");
        }

        if (storedToken.User == null || storedToken.User.DeletedAt != null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Rotate refresh token
        storedToken.RevokedAt = DateTime.UtcNow;

        var (response, newTokenHash) = await GenerateTokensWithHashAsync(storedToken.User);

        storedToken.ReplacedByTokenHash = newTokenHash;
        await _context.SaveChangesAsync();

        return response;
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        // Hash the incoming token to look up in DB
        var tokenHash = TokenHasher.Hash(refreshToken);

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken != null && storedToken.IsActive)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant() && u.DeletedAt == null);

        // Always return success to prevent email enumeration
        if (user == null)
        {
            return new ForgotPasswordResponse(true, "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.");
        }

        // Generate reset token
        var resetToken = GenerateResetCode();

        // Store hash of the token (never store plain tokens)
        user.PasswordResetTokenHash = TokenHasher.Hash(resetToken);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Send password reset email
        try
        {
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.Username, resetToken);
            _logger.LogInformation("Password reset email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
            // Don't throw - still return success to prevent email enumeration
        }

        return new ForgotPasswordResponse(true, "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.");
    }

    public async Task<ForgotPasswordResponse> ResetPasswordAsync(string token, string newPassword)
    {
        if (!IsValidPassword(newPassword))
        {
            return new ForgotPasswordResponse(false, "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre.");
        }

        // Hash the incoming token to look up
        var tokenHash = TokenHasher.Hash(token);

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.PasswordResetTokenHash == tokenHash &&
                u.PasswordResetTokenExpiresAt > DateTime.UtcNow &&
                u.DeletedAt == null);

        if (user == null)
        {
            return new ForgotPasswordResponse(false, "Code invalide ou expiré.");
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, BcryptWorkFactor);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke all refresh tokens for security
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync();
        foreach (var t in tokens)
        {
            t.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new ForgotPasswordResponse(true, "Mot de passe réinitialisé avec succès.");
    }

    private static string GenerateResetCode()
    {
        // Generate 32-byte (256-bit) cryptographically secure token
        // URL-safe Base64 encoding results in ~43 characters
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        // Use URL-safe Base64 (replace + and / with - and _)
        return Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    private async Task<AuthResponse> GenerateTokensAsync(User user)
    {
        var (response, _) = await GenerateTokensWithHashAsync(user);
        return response;
    }

    private async Task<(AuthResponse Response, string TokenHash)> GenerateTokensWithHashAsync(User user)
    {
        var accessToken = GenerateAccessToken(user);
        var (rawToken, tokenHash) = await GenerateRefreshTokenAsync(user);

        var expiresAt = DateTime.UtcNow.AddMinutes(
            _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 15));

        return (new AuthResponse(accessToken, rawToken, expiresAt), tokenHash);
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expirationMinutes = _configuration.GetValue<int>("Jwt:AccessTokenExpirationMinutes", 15);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<(string RawToken, string TokenHash)> GenerateRefreshTokenAsync(User user)
    {
        var rawToken = GenerateSecureToken();
        var tokenHash = TokenHasher.Hash(rawToken);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(
                _configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 30)),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return (rawToken, tokenHash);
    }

    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static bool IsValidPassword(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8)
            return false;

        var hasUpperCase = Regex.IsMatch(password, @"[A-Z]");
        var hasDigit = Regex.IsMatch(password, @"\d");

        return hasUpperCase && hasDigit;
    }
}

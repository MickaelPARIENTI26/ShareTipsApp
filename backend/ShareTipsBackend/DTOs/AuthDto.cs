using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required][MinLength(3)] string Username,
    [Required] DateOnly DateOfBirth
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record RefreshTokenRequest(
    [Required] string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt
);

public record AuthErrorResponse(
    string Error,
    string? Details = null
);

public record ForgotPasswordRequest(
    [Required][EmailAddress] string Email
);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required][MinLength(8)] string NewPassword
);

public record ForgotPasswordResponse(
    bool Success,
    string Message
);

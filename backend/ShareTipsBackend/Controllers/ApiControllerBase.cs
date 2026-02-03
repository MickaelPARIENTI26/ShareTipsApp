using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Base controller providing common functionality for all API controllers.
/// </summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Gets the authenticated user's ID from the JWT token.
    /// Throws UnauthorizedAccessException if the user is not authenticated.
    /// </summary>
    protected Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }

    /// <summary>
    /// Attempts to get the user ID from an optional authentication context.
    /// Returns null if the user is not authenticated (for endpoints that support anonymous access).
    /// </summary>
    protected async Task<Guid?> GetUserIdFromAuthAsync()
    {
        var authResult = await HttpContext.AuthenticateAsync();
        if (authResult.Succeeded && authResult.Principal != null)
        {
            var userIdClaim = authResult.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? authResult.Principal.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
        }
        return null;
    }
}

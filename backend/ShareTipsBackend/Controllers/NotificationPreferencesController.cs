using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;
using System.Security.Claims;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/notification-preferences")]
[Authorize]
public class NotificationPreferencesController : ControllerBase
{
    private readonly INotificationPreferencesService _preferencesService;

    public NotificationPreferencesController(INotificationPreferencesService preferencesService)
    {
        _preferencesService = preferencesService;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationPreferencesDto>> GetMyPreferences()
    {
        var userId = GetUserId();
        var prefs = await _preferencesService.GetByUserIdAsync(userId);
        return Ok(prefs);
    }

    [HttpPut]
    public async Task<ActionResult<NotificationPreferencesDto>> UpdateMyPreferences(
        [FromBody] UpdateNotificationPreferencesDto dto)
    {
        var userId = GetUserId();
        var prefs = await _preferencesService.UpdateAsync(userId, dto);
        return Ok(prefs);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User ID claim not found");
        return Guid.Parse(userIdClaim);
    }
}

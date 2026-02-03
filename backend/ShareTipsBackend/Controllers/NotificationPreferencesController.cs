using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[Route("api/notification-preferences")]
[Authorize]
public class NotificationPreferencesController : ApiControllerBase
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
}

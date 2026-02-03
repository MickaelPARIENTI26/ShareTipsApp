using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[Route("api/[controller]")]
[Authorize]
public class ConsentController : ApiControllerBase
{
    private readonly IConsentService _consentService;

    public ConsentController(IConsentService consentService)
    {
        _consentService = consentService;
    }

    /// <summary>
    /// Get consent status for the "NoGuarantee" type
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<ConsentStatusDto>> GetConsentStatus()
    {
        var userId = GetUserId();
        var status = await _consentService.GetConsentStatusAsync(userId, ConsentTypes.NoGuarantee);
        return Ok(status);
    }

    /// <summary>
    /// Give consent for the "NoGuarantee" type
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<GiveConsentResponse>> GiveConsent()
    {
        var userId = GetUserId();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        // Truncate user agent if too long
        if (userAgent?.Length > 500)
        {
            userAgent = userAgent[..500];
        }

        var result = await _consentService.GiveConsentAsync(
            userId,
            ConsentTypes.NoGuarantee,
            ipAddress,
            userAgent
        );

        return Ok(result);
    }
}

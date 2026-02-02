using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion des tokens de notification push
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Notifications Push")]
public class DeviceTokensController : ControllerBase
{
    private readonly IPushNotificationService _pushService;
    private readonly ApplicationDbContext _context;

    public DeviceTokensController(IPushNotificationService pushService, ApplicationDbContext context)
    {
        _pushService = pushService;
        _context = context;
    }

    /// <summary>
    /// Enregistre un token de notification push pour l'appareil actuel
    /// </summary>
    /// <param name="request">Token FCM/Expo et infos appareil</param>
    /// <response code="200">Token enregistré avec succès</response>
    /// <response code="400">Données invalides</response>
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterToken([FromBody] RegisterDeviceTokenRequest request)
    {
        var userId = GetUserId();

        var success = await _pushService.RegisterDeviceTokenAsync(
            userId,
            request.Token,
            request.Platform,
            request.DeviceId,
            request.DeviceName
        );

        if (!success)
            return BadRequest(new { error = "Failed to register device token" });

        return Ok(new { message = "Device token registered successfully" });
    }

    /// <summary>
    /// Supprime un token de notification push
    /// </summary>
    /// <param name="request">Token à supprimer</param>
    /// <response code="200">Token supprimé</response>
    [HttpPost("unregister")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UnregisterToken([FromBody] UnregisterDeviceTokenRequest request)
    {
        var userId = GetUserId();

        await _pushService.UnregisterDeviceTokenAsync(userId, request.Token);

        return Ok(new { message = "Device token unregistered" });
    }

    /// <summary>
    /// Supprime tous les tokens d'un appareil
    /// </summary>
    /// <param name="deviceId">ID de l'appareil</param>
    [HttpDelete("device/{deviceId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UnregisterDevice(string deviceId)
    {
        var userId = GetUserId();

        await _pushService.UnregisterDeviceAsync(userId, deviceId);

        return Ok(new { message = "Device unregistered" });
    }

    /// <summary>
    /// Liste les tokens enregistrés pour l'utilisateur actuel
    /// </summary>
    [HttpGet("my-devices")]
    [ProducesResponseType(typeof(IEnumerable<DeviceTokenDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDevices()
    {
        var userId = GetUserId();

        var tokens = await _context.DeviceTokens
            .Where(t => t.UserId == userId)
            .Select(t => new DeviceTokenDto(
                t.Id,
                t.Token.Substring(0, Math.Min(20, t.Token.Length)) + "...", // Masquer le token complet
                t.Platform,
                t.DeviceId,
                t.DeviceName,
                t.CreatedAt,
                t.LastUsedAt,
                t.IsActive
            ))
            .ToListAsync();

        return Ok(tokens);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

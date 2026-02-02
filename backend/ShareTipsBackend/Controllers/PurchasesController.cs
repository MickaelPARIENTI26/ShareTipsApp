using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Achat de tickets
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("financial")]
[Tags("Achats")]
public class PurchasesController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchasesController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    /// <summary>
    /// Purchase a ticket
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PurchaseResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Purchase([FromBody] PurchaseTicketRequest request)
    {
        var userId = GetUserId();
        var result = await _purchaseService.PurchaseTicketAsync(userId, request.TicketId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get my purchases (tickets I bought) with pagination
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(PaginatedResult<PurchaseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPurchases(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();
        var purchases = await _purchaseService.GetPurchasesByBuyerPaginatedAsync(userId, page, pageSize);
        return Ok(purchases);
    }

    /// <summary>
    /// Get my sales (tickets I sold)
    /// </summary>
    [HttpGet("sales")]
    [ProducesResponseType(typeof(IEnumerable<PurchaseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySales()
    {
        var userId = GetUserId();
        var sales = await _purchaseService.GetSalesBySellerAsync(userId);
        return Ok(sales);
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }
}

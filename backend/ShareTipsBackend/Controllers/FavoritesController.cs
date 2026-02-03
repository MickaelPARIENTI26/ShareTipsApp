using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.Common;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ApiControllerBase
{
    private readonly IFavoriteService _favoriteService;

    public FavoritesController(IFavoriteService favoriteService)
    {
        _favoriteService = favoriteService;
    }

    /// <summary>
    /// Toggle favorite on a ticket (add/remove)
    /// </summary>
    [HttpPost("toggle")]
    [ProducesResponseType(typeof(FavoriteResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleFavorite([FromBody] FavoriteToggleRequest request)
    {
        var userId = GetUserId();
        var result = await _favoriteService.ToggleFavoriteAsync(userId, request.TicketId);
        return Ok(result);
    }

    /// <summary>
    /// Get my favorite tickets with pagination
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(PaginatedResult<FavoriteTicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyFavorites(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();
        var favorites = await _favoriteService.GetMyFavoritesPaginatedAsync(userId, page, pageSize);
        return Ok(favorites);
    }

    /// <summary>
    /// Check if a ticket is favorited
    /// </summary>
    [HttpGet("check/{ticketId:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckFavorite(Guid ticketId)
    {
        var userId = GetUserId();
        var isFavorited = await _favoriteService.IsFavoritedAsync(userId, ticketId);
        return Ok(new { isFavorited });
    }
}

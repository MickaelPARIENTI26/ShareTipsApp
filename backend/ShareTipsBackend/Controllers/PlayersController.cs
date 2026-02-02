using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly ISportService _sportService;

    public PlayersController(ISportService sportService)
    {
        _sportService = sportService;
    }

    /// <summary>
    /// Get all players (optionally filter by team)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PlayerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] Guid? teamId = null)
    {
        var players = await _sportService.GetAllPlayersAsync(teamId);
        return Ok(players);
    }

    /// <summary>
    /// Get player by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PlayerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var player = await _sportService.GetPlayerByIdAsync(id);
        if (player == null) return NotFound();
        return Ok(player);
    }

    /// <summary>
    /// Create a new player (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PlayerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePlayerRequest request)
    {
        try
        {
            var player = await _sportService.CreatePlayerAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = player.Id }, player);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update a player (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PlayerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlayerRequest request)
    {
        var player = await _sportService.UpdatePlayerAsync(id, request);
        if (player == null) return NotFound();
        return Ok(player);
    }

    /// <summary>
    /// Delete a player (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _sportService.DeletePlayerAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

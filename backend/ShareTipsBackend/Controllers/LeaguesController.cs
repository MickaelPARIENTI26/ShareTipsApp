using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaguesController : ControllerBase
{
    private readonly ISportService _sportService;

    public LeaguesController(ISportService sportService)
    {
        _sportService = sportService;
    }

    /// <summary>
    /// Get all leagues (optionally filter by sport)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<LeagueDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? sport = null)
    {
        var leagues = await _sportService.GetAllLeaguesAsync(sport);
        return Ok(leagues);
    }

    /// <summary>
    /// Get league by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LeagueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var league = await _sportService.GetLeagueByIdAsync(id);
        if (league == null) return NotFound();
        return Ok(league);
    }

    /// <summary>
    /// Create a new league (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(LeagueDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateLeagueRequest request)
    {
        var league = await _sportService.CreateLeagueAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = league.Id }, league);
    }

    /// <summary>
    /// Update a league (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(LeagueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeagueRequest request)
    {
        var league = await _sportService.UpdateLeagueAsync(id, request);
        if (league == null) return NotFound();
        return Ok(league);
    }

    /// <summary>
    /// Delete a league (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _sportService.DeleteLeagueAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

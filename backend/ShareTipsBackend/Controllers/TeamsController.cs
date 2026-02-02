using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly ISportService _sportService;

    public TeamsController(ISportService sportService)
    {
        _sportService = sportService;
    }

    /// <summary>
    /// Get all teams (optionally filter by sport)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TeamDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? sport = null)
    {
        var teams = await _sportService.GetAllTeamsAsync(sport);
        return Ok(teams);
    }

    /// <summary>
    /// Get team by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var team = await _sportService.GetTeamByIdAsync(id);
        if (team == null) return NotFound();
        return Ok(team);
    }

    /// <summary>
    /// Create a new team (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateTeamRequest request)
    {
        var team = await _sportService.CreateTeamAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = team.Id }, team);
    }

    /// <summary>
    /// Update a team (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTeamRequest request)
    {
        var team = await _sportService.UpdateTeamAsync(id, request);
        if (team == null) return NotFound();
        return Ok(team);
    }

    /// <summary>
    /// Delete a team (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _sportService.DeleteTeamAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

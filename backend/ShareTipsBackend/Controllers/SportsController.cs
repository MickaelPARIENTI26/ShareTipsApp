using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SportsController : ControllerBase
{
    private readonly ISportService _sportService;

    public SportsController(ISportService sportService)
    {
        _sportService = sportService;
    }

    /// <summary>
    /// Get all sports
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var sports = await _sportService.GetAllSportsAsync();
        return Ok(sports);
    }

    /// <summary>
    /// Get sport by code
    /// </summary>
    [HttpGet("{code}")]
    [ProducesResponseType(typeof(SportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode(string code)
    {
        var sport = await _sportService.GetSportByCodeAsync(code);
        if (sport == null) return NotFound();
        return Ok(sport);
    }

    /// <summary>
    /// Create a new sport (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SportDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateSportRequest request)
    {
        var sport = await _sportService.CreateSportAsync(request);
        return CreatedAtAction(nameof(GetByCode), new { code = sport.Code }, sport);
    }

    /// <summary>
    /// Update a sport (Admin only)
    /// </summary>
    [HttpPut("{code}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string code, [FromBody] UpdateSportRequest request)
    {
        var sport = await _sportService.UpdateSportAsync(code, request);
        if (sport == null) return NotFound();
        return Ok(sport);
    }

    /// <summary>
    /// Delete a sport (Admin only)
    /// </summary>
    [HttpDelete("{code}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string code)
    {
        var result = await _sportService.DeleteSportAsync(code);
        if (!result) return NotFound();
        return NoContent();
    }
}

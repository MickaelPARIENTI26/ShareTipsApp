using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchesController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    /// <summary>
    /// Get upcoming matches (next N days)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MatchListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpcoming(
        [FromQuery] string? sport = null,
        [FromQuery] Guid? leagueId = null,
        [FromQuery] int days = 7)
    {
        var matches = await _matchService.GetUpcomingMatchesAsync(sport, leagueId, days);
        return Ok(matches);
    }

    /// <summary>
    /// Get upcoming matches with full market details (optimized for frontend)
    /// Single query instead of N+1 calls
    /// </summary>
    [HttpGet("with-markets")]
    [ProducesResponseType(typeof(IEnumerable<MatchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpcomingWithMarkets(
        [FromQuery] string? sport = null,
        [FromQuery] Guid? leagueId = null,
        [FromQuery] int days = 7)
    {
        var matches = await _matchService.GetUpcomingMatchesWithMarketsAsync(sport, leagueId, days);
        return Ok(matches);
    }

    /// <summary>
    /// Get match details with markets and odds
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var match = await _matchService.GetMatchByIdAsync(id);
        if (match == null) return NotFound();
        return Ok(match);
    }

    /// <summary>
    /// Create a new match (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MatchDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateMatchRequest request)
    {
        var match = await _matchService.CreateMatchAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = match.Id }, match);
    }

    /// <summary>
    /// Update match (status, scores, etc.) (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MatchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMatchRequest request)
    {
        var match = await _matchService.UpdateMatchAsync(id, request);
        if (match == null) return NotFound();
        return Ok(match);
    }

    /// <summary>
    /// Delete a match (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _matchService.DeleteMatchAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // ==================== Markets ====================

    /// <summary>
    /// Add a market to a match (Admin only)
    /// </summary>
    [HttpPost("markets")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MarketDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMarket([FromBody] CreateMarketRequest request)
    {
        var market = await _matchService.CreateMarketAsync(request);
        return Created($"/api/matches/{request.MatchId}", market);
    }

    /// <summary>
    /// Update odds for a selection (Admin only)
    /// </summary>
    [HttpPatch("odds")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOdds([FromBody] UpdateOddsRequest request)
    {
        var result = await _matchService.UpdateOddsAsync(request);
        if (!result) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Delete/deactivate a market (Admin only)
    /// </summary>
    [HttpDelete("markets/{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMarket(Guid id)
    {
        var result = await _matchService.DeleteMarketAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}

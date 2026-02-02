using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RankingController : ControllerBase
{
    private readonly IRankingService _rankingService;

    public RankingController(IRankingService rankingService)
    {
        _rankingService = rankingService;
    }

    /// <summary>
    /// Get tipster rankings for a given period
    /// </summary>
    /// <param name="period">Period: daily, weekly, or monthly</param>
    /// <param name="limit">Maximum number of results (default 100)</param>
    [HttpGet]
    [ProducesResponseType(typeof(RankingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRanking(
        [FromQuery] string period = "weekly",
        [FromQuery] int limit = 100)
    {
        try
        {
            var ranking = await _rankingService.GetRankingAsync(period, limit);
            return Ok(ranking);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

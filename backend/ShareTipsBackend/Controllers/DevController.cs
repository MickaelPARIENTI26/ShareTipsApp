using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.ExternalApis;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Development-only endpoints for testing API sync without admin authentication.
/// These endpoints are only available in Development environment.
/// </summary>
[ApiController]
[Route("api/dev")]
[AllowAnonymous]
public class DevController : ControllerBase
{
    private readonly IOddsSyncService _syncService;
    private readonly TheOddsApiService _oddsApi;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<DevController> _logger;
    private readonly IWebHostEnvironment _env;

    public DevController(
        IOddsSyncService syncService,
        TheOddsApiService oddsApi,
        IOptions<TheOddsApiConfig> config,
        ILogger<DevController> logger,
        IWebHostEnvironment env)
    {
        _syncService = syncService;
        _oddsApi = oddsApi;
        _config = config.Value;
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// Get current API quota status (FREE - no API credits)
    /// </summary>
    [HttpGet("quota")]
    public IActionResult GetQuota()
    {
        if (!_env.IsDevelopment()) return NotFound();

        return Ok(new
        {
            RemainingCredits = _syncService.GetRemainingQuota(),
            EnabledLeagues = _config.EnabledSportKeys,
            EnabledMarkets = _config.EnabledMarkets,
            EstimatedSyncCost = _config.EnabledSportKeys.Count * _config.EnabledMarkets.Count
        });
    }

    /// <summary>
    /// Get available sports from The Odds API (FREE - no API credits)
    /// </summary>
    [HttpGet("sports")]
    public async Task<IActionResult> GetAvailableSports([FromQuery] string? filter = null)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var sports = await _oddsApi.GetSportsAsync();

        // Filter to show only active sports, optionally filtered by keyword
        var filteredSports = sports
            .Where(s => s.Active)
            .Where(s => string.IsNullOrEmpty(filter) ||
                        s.Key.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        s.Title.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                        s.Group.Contains(filter, StringComparison.OrdinalIgnoreCase))
            .OrderBy(s => s.Group)
            .ThenBy(s => s.Title)
            .ToList();

        return Ok(new
        {
            TotalActive = sports.Count(s => s.Active),
            FilteredCount = filteredSports.Count,
            Sports = filteredSports
        });
    }

    /// <summary>
    /// Get upcoming events for a specific sport (FREE - no API credits)
    /// </summary>
    [HttpGet("events/{sportKey}")]
    public async Task<IActionResult> GetEvents(string sportKey)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var events = await _oddsApi.GetEventsAsync(sportKey);
        return Ok(new
        {
            SportKey = sportKey,
            EventCount = events.Count,
            Events = events.OrderBy(e => e.CommenceTime).ToList()
        });
    }

    /// <summary>
    /// Sync a specific league - loads matches and odds (COSTS API CREDITS)
    /// </summary>
    [HttpPost("sync/{sportKey}")]
    public async Task<IActionResult> SyncLeague(string sportKey)
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Manual sync triggered for {SportKey}", sportKey);
        var result = await _syncService.SyncLeagueAsync(sportKey);
        _logger.LogInformation("[DEV] Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync all enabled leagues (COSTS API CREDITS: leagues x markets)
    /// </summary>
    [HttpPost("sync/all")]
    public async Task<IActionResult> SyncAll()
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Manual sync triggered for all leagues");
        var result = await _syncService.SyncAllLeaguesAsync();
        _logger.LogInformation("[DEV] Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync scores for live/finished matches (COSTS API CREDITS)
    /// </summary>
    [HttpPost("sync/scores")]
    public async Task<IActionResult> SyncScores()
    {
        if (!_env.IsDevelopment()) return NotFound();

        _logger.LogInformation("[DEV] Scores sync triggered");
        var result = await _syncService.SyncScoresAsync();

        return Ok(result);
    }
}

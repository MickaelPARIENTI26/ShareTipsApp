using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.ExternalApis;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class OddsSyncController : ControllerBase
{
    private readonly IOddsSyncService _syncService;
    private readonly TheOddsApiService _oddsApi;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<OddsSyncController> _logger;

    public OddsSyncController(
        IOddsSyncService syncService,
        TheOddsApiService oddsApi,
        IOptions<TheOddsApiConfig> config,
        ILogger<OddsSyncController> logger)
    {
        _syncService = syncService;
        _oddsApi = oddsApi;
        _config = config.Value;
        _logger = logger;
    }

    /// <summary>
    /// Get current API quota status (FREE)
    /// </summary>
    [HttpGet("quota")]
    [ProducesResponseType(typeof(ExtendedQuotaStatusDto), StatusCodes.Status200OK)]
    public IActionResult GetQuota()
    {
        return Ok(new ExtendedQuotaStatusDto(
            _syncService.GetRemainingQuota(),
            _config.EnabledSportKeys,
            _config.EnabledMarkets,
            _config.EnabledPlayerProps,
            EstimateSyncCost(),
            EstimatePlayerPropsCost()
        ));
    }

    /// <summary>
    /// Get available sports from The Odds API (FREE - no quota cost)
    /// </summary>
    [HttpGet("sports")]
    [ProducesResponseType(typeof(List<OddsApiSport>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSports()
    {
        var sports = await _oddsApi.GetSportsAsync();
        // Filter to show only active soccer leagues
        var soccerSports = sports
            .Where(s => s.Active && s.Key.StartsWith("soccer_"))
            .OrderBy(s => s.Title)
            .ToList();

        return Ok(soccerSports);
    }

    /// <summary>
    /// Get upcoming events for a league (FREE - no quota cost)
    /// </summary>
    [HttpGet("events/{sportKey}")]
    [ProducesResponseType(typeof(List<OddsApiEvent>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEvents(string sportKey)
    {
        var events = await _oddsApi.GetEventsAsync(sportKey);
        return Ok(new
        {
            SportKey = sportKey,
            EventCount = events.Count,
            Events = events.Take(20) // Limit for preview
        });
    }

    /// <summary>
    /// Sync all enabled leagues (COSTS QUOTA: leagues × markets credits)
    /// </summary>
    [HttpPost("sync/all")]
    [ProducesResponseType(typeof(OddsSyncResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncAll()
    {
        _logger.LogInformation("Manual sync triggered for all leagues");

        var result = await _syncService.SyncAllLeaguesAsync();

        _logger.LogInformation("Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync a specific league (COSTS QUOTA: markets credits)
    /// </summary>
    [HttpPost("sync/{sportKey}")]
    [ProducesResponseType(typeof(OddsSyncResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncLeague(string sportKey)
    {
        _logger.LogInformation("Manual sync triggered for {SportKey}", sportKey);

        var result = await _syncService.SyncLeagueAsync(sportKey);

        _logger.LogInformation("Sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Sync scores for live/finished matches (COSTS QUOTA)
    /// </summary>
    [HttpPost("sync/scores")]
    [ProducesResponseType(typeof(OddsSyncResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncScores()
    {
        _logger.LogInformation("Scores sync triggered");

        var result = await _syncService.SyncScoresAsync();

        return Ok(result);
    }

    /// <summary>
    /// Sync player props (goalscorers, shots, cards) for a league
    /// COSTS QUOTA: player_props × events (expensive!)
    /// </summary>
    [HttpPost("sync/player-props/{sportKey}")]
    [ProducesResponseType(typeof(OddsSyncResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> SyncPlayerProps(string sportKey)
    {
        _logger.LogInformation("Player props sync triggered for {SportKey}", sportKey);

        var result = await _syncService.SyncPlayerPropsAsync(sportKey);

        _logger.LogInformation("Player props sync completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Clean up invalid markets (e.g., remove football-only markets from basketball matches)
    /// FREE - No API quota cost
    /// </summary>
    [HttpPost("cleanup/invalid-markets")]
    [ProducesResponseType(typeof(CleanupResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> CleanupInvalidMarkets()
    {
        _logger.LogInformation("Cleanup of invalid markets triggered");

        var result = await _syncService.CleanupInvalidMarketsAsync();

        _logger.LogInformation("Cleanup completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Refresh all market labels to use correct sport-specific terminology
    /// FREE - No API quota cost
    /// </summary>
    [HttpPost("cleanup/refresh-labels")]
    [ProducesResponseType(typeof(CleanupResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RefreshLabels()
    {
        _logger.LogInformation("Label refresh triggered");

        var result = await _syncService.RefreshAllMarketLabelsAsync();

        _logger.LogInformation("Label refresh completed: {Result}", result.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Full cleanup + resync: Clean invalid markets, refresh labels, then resync all
    /// COSTS QUOTA: leagues × markets credits
    /// </summary>
    [HttpPost("cleanup/full")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> FullCleanupAndResync()
    {
        _logger.LogInformation("Full cleanup and resync triggered");

        // 1. Clean up invalid markets
        var cleanupResult = await _syncService.CleanupInvalidMarketsAsync();
        _logger.LogInformation("Cleanup phase completed: {Result}", cleanupResult.ToString());

        // 2. Refresh labels
        var labelResult = await _syncService.RefreshAllMarketLabelsAsync();
        _logger.LogInformation("Label refresh phase completed: {Result}", labelResult.ToString());

        // 3. Resync all leagues
        var syncResult = await _syncService.SyncAllLeaguesAsync();
        _logger.LogInformation("Sync phase completed: {Result}", syncResult.ToString());

        return Ok(new
        {
            Cleanup = new
            {
                cleanupResult.MarketsRemoved,
                cleanupResult.SelectionsRemoved,
                cleanupResult.Details
            },
            LabelRefresh = new
            {
                labelResult.LabelsUpdated
            },
            Sync = new
            {
                syncResult.MatchesCreated,
                syncResult.MatchesUpdated,
                syncResult.MarketsCreated,
                syncResult.MarketsUpdated,
                syncResult.ApiCreditsUsed,
                syncResult.RemainingQuota,
                syncResult.Errors
            }
        });
    }

    private int EstimateSyncCost()
    {
        // Cost = leagues × markets × regions (1 region = eu)
        return _config.EnabledSportKeys.Count * _config.EnabledMarkets.Count;
    }

    private int EstimatePlayerPropsCost()
    {
        // Cost = player_props × events (estimate 10 events per league)
        return _config.EnabledPlayerProps.Count * 10;
    }
}

public record QuotaStatusDto(
    int? RemainingCredits,
    List<string> EnabledLeagues,
    List<string> EnabledMarkets,
    int EstimatedSyncCost
);

public record ExtendedQuotaStatusDto(
    int? RemainingCredits,
    List<string> EnabledLeagues,
    List<string> EnabledMarkets,
    List<string> EnabledPlayerProps,
    int EstimatedSyncCost,
    int EstimatedPlayerPropsCost
);

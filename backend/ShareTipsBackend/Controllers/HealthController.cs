using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using System.Reflection;

namespace ShareTipsBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private static readonly DateTime StartTime = DateTime.UtcNow;

    public HealthController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Basic health check - returns 200 if API is running
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        return Ok(new HealthResponse
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Detailed health check - includes database connectivity
    /// </summary>
    [HttpGet("detailed")]
    [ProducesResponseType(typeof(DetailedHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DetailedHealthResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetDetailed()
    {
        var response = new DetailedHealthResponse
        {
            Timestamp = DateTime.UtcNow,
            Version = GetVersion(),
            Uptime = DateTime.UtcNow - StartTime,
            Checks = new Dictionary<string, HealthCheckResult>()
        };

        // Database check
        var dbCheck = await CheckDatabaseAsync();
        response.Checks["database"] = dbCheck;

        // Overall status
        response.Status = response.Checks.Values.All(c => c.Status == "healthy")
            ? "healthy"
            : "unhealthy";

        var statusCode = response.Status == "healthy"
            ? StatusCodes.Status200OK
            : StatusCodes.Status503ServiceUnavailable;

        return StatusCode(statusCode, response);
    }

    /// <summary>
    /// Liveness probe for Kubernetes - just checks if API is running
    /// </summary>
    [HttpGet("live")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Live()
    {
        return Ok();
    }

    /// <summary>
    /// Readiness probe for Kubernetes - checks if API can serve traffic
    /// </summary>
    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Ready()
    {
        var dbCheck = await CheckDatabaseAsync();
        if (dbCheck.Status != "healthy")
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "not ready", reason = dbCheck.Message });
        }
        return Ok(new { status = "ready" });
    }

    private async Task<HealthCheckResult> CheckDatabaseAsync()
    {
        var result = new HealthCheckResult();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Simple query to check database connectivity
            await _context.Database.CanConnectAsync();
            sw.Stop();

            result.Status = "healthy";
            result.Message = "Database connection successful";
            result.ResponseTime = sw.ElapsedMilliseconds;
        }
        catch (Exception ex)
        {
            sw.Stop();
            result.Status = "unhealthy";
            result.Message = $"Database connection failed: {ex.Message}";
            result.ResponseTime = sw.ElapsedMilliseconds;
        }

        return result;
    }

    private static string GetVersion()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version;
        return version?.ToString() ?? "1.0.0";
    }
}

public class HealthResponse
{
    public string Status { get; set; } = "healthy";
    public DateTime Timestamp { get; set; }
}

public class DetailedHealthResponse
{
    public string Status { get; set; } = "healthy";
    public DateTime Timestamp { get; set; }
    public string Version { get; set; } = "1.0.0";
    public TimeSpan Uptime { get; set; }
    public Dictionary<string, HealthCheckResult> Checks { get; set; } = new();
}

public class HealthCheckResult
{
    public string Status { get; set; } = "unknown";
    public string? Message { get; set; }
    public long? ResponseTime { get; set; }
}

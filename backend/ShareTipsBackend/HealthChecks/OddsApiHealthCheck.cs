using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using ShareTipsBackend.Services.ExternalApis;

namespace ShareTipsBackend.HealthChecks;

public class OddsApiHealthCheck : IHealthCheck
{
    private readonly HttpClient _httpClient;
    private readonly TheOddsApiConfig _config;
    private readonly ILogger<OddsApiHealthCheck> _logger;

    public OddsApiHealthCheck(
        IHttpClientFactory httpClientFactory,
        IOptions<TheOddsApiConfig> config,
        ILogger<OddsApiHealthCheck> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _config = config.Value;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_config.ApiKey))
        {
            return HealthCheckResult.Degraded("API key not configured");
        }

        try
        {
            // Use a simple endpoint to check if the API is reachable
            var url = $"{_config.BaseUrl}/sports?apiKey={_config.ApiKey}";

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var response = await _httpClient.GetAsync(url, cts.Token);

            if (response.IsSuccessStatusCode)
            {
                // Check remaining quota from headers
                if (response.Headers.TryGetValues("x-requests-remaining", out var remainingValues))
                {
                    var remaining = remainingValues.FirstOrDefault();
                    if (int.TryParse(remaining, out var remainingCount))
                    {
                        if (remainingCount < 10)
                        {
                            return HealthCheckResult.Degraded(
                                $"Low API quota remaining: {remainingCount} requests",
                                data: new Dictionary<string, object> { ["remainingRequests"] = remainingCount });
                        }

                        return HealthCheckResult.Healthy(
                            $"API responding normally. Remaining requests: {remainingCount}",
                            data: new Dictionary<string, object> { ["remainingRequests"] = remainingCount });
                    }
                }

                return HealthCheckResult.Healthy("API responding normally");
            }

            if ((int)response.StatusCode == 429)
            {
                return HealthCheckResult.Degraded("API rate limit exceeded");
            }

            if ((int)response.StatusCode == 401)
            {
                return HealthCheckResult.Unhealthy("Invalid API key");
            }

            return HealthCheckResult.Degraded($"API returned status code: {response.StatusCode}");
        }
        catch (TaskCanceledException)
        {
            return HealthCheckResult.Degraded("API request timed out");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Odds API health check failed");
            return HealthCheckResult.Unhealthy("Unable to reach API", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Odds API health check");
            return HealthCheckResult.Unhealthy("Unexpected error", ex);
        }
    }
}

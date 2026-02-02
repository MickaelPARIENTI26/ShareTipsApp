using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.BackgroundServices;

public class TicketLockingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TicketLockingService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public TicketLockingService(IServiceProvider serviceProvider, ILogger<TicketLockingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Ticket Locking Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await LockTicketsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while locking tickets");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Ticket Locking Service stopped");
    }

    private async Task LockTicketsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var ticketService = scope.ServiceProvider.GetRequiredService<ITicketService>();

        await ticketService.LockTicketsBeforeMatchAsync();
        _logger.LogDebug("Ticket locking check completed");
    }
}

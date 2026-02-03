using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.BackgroundServices;

public class MatchResultService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MatchResultService> _logger;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public MatchResultService(
        IServiceProvider serviceProvider,
        ILogger<MatchResultService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Check if automatic sync is disabled (for dev/testing to conserve API credits)
        var autoSyncEnabled = _configuration.GetValue<bool>("MatchResultService:AutoSyncEnabled", true);

        if (!autoSyncEnabled)
        {
            _logger.LogWarning("Match Result Service: Automatic API sync is DISABLED. Use manual endpoints to trigger sync.");
            // Still update ticket results from existing match data, just don't call API
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await UpdateTicketResultsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while updating ticket results");
                }
                await Task.Delay(_interval, stoppingToken);
            }
            return;
        }

        _logger.LogInformation("Match Result Service started with automatic API sync");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncScoresFromApiAsync();
                await UpdateTicketResultsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating match/ticket results");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Match Result Service stopped");
    }

    /// <summary>
    /// Sync scores from The Odds API for all enabled leagues
    /// </summary>
    private async Task SyncScoresFromApiAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var oddsSyncService = scope.ServiceProvider.GetRequiredService<IOddsSyncService>();

        try
        {
            var result = await oddsSyncService.SyncScoresAsync();
            if (result.MatchesUpdated > 0)
            {
                _logger.LogInformation("Synced scores: {MatchesUpdated} matches updated, API quota remaining: {Quota}",
                    result.MatchesUpdated, result.RemainingQuota);
            }
            if (result.Errors.Any())
            {
                foreach (var error in result.Errors)
                {
                    _logger.LogWarning("Score sync error: {Error}", error);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to sync scores from API");
        }
    }

    private async Task UpdateTicketResultsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        // Find locked tickets where all matches are finished
        var lockedTickets = await context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Purchases)
            .Include(t => t.Creator)
            .Where(t => t.Status == TicketStatus.Locked && t.DeletedAt == null)
            .ToListAsync();

        foreach (var ticket in lockedTickets)
        {
            // Get all matches for this ticket
            var matchIds = ticket.Selections.Select(s => s.MatchId).Distinct().ToList();
            var matches = await context.Matches
                .Where(m => matchIds.Contains(m.Id))
                .ToListAsync();

            // Check if all matches are finished
            if (matches.All(m => m.Status == MatchStatus.Finished))
            {
                ticket.Status = TicketStatus.Finished;

                // Determine result based on selections
                // In production, you would compare selections with actual match results
                // For now, we use a placeholder logic
                var allWin = await DetermineTicketResultAsync(context, ticket);

                ticket.Result = allWin ? TicketResult.Win : TicketResult.Lose;

                // If ticket won and was purchased, credit the buyers
                if (ticket.Result == TicketResult.Win)
                {
                    await ProcessWinningsAsync(context, ticket);
                }

                // Notify buyers and active subscribers about the result
                await NotifyTicketResultAsync(context, notificationService, ticket);

                _logger.LogInformation("Ticket {TicketId} finished with result: {Result}",
                    ticket.Id, ticket.Result);
            }
        }

        await context.SaveChangesAsync();
    }

    private async Task NotifyTicketResultAsync(
        ApplicationDbContext context,
        INotificationService notificationService,
        Ticket ticket)
    {
        var isWin = ticket.Result == TicketResult.Win;
        var notificationType = isWin ? NotificationType.TicketWon : NotificationType.TicketLost;
        var title = isWin ? "Pronostic validé 🎉" : "Pronostic non validé ❌";
        var tipsterName = ticket.Creator?.Username ?? "Un tipster";
        var message = isWin
            ? $"Le pronostic de {tipsterName} est validé !"
            : $"Le pronostic de {tipsterName} n'est pas validé.";

        // Get buyers of the ticket
        var buyerIds = ticket.Purchases
            .Select(p => p.BuyerId)
            .ToList();

        // Get active subscribers of the tipster
        var now = DateTime.UtcNow;
        var subscriberIds = await context.Subscriptions
            .Where(s => s.TipsterId == ticket.CreatorId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > now)
            .Select(s => s.SubscriberId)
            .ToListAsync();

        // Combine without duplicates
        var userIdsToNotify = buyerIds
            .Union(subscriberIds)
            .Distinct()
            .ToList();

        if (userIdsToNotify.Count == 0)
            return;

        await notificationService.NotifyManyAsync(
            userIdsToNotify,
            notificationType,
            title,
            message,
            new { ticketId = ticket.Id, tipsterId = ticket.CreatorId });
    }

    private async Task<bool> DetermineTicketResultAsync(ApplicationDbContext context, Ticket ticket)
    {
        // Get all matches for this ticket's selections (include teams for name matching)
        var matchIds = ticket.Selections.Select(s => s.MatchId).Distinct().ToList();
        var matches = await context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Where(m => matchIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id);

        // Check each selection against actual match result
        foreach (var selection in ticket.Selections)
        {
            if (!matches.TryGetValue(selection.MatchId, out var match))
            {
                _logger.LogWarning("Match {MatchId} not found for selection {SelectionId}",
                    selection.MatchId, selection.Id);
                return false; // Match not found = lose
            }

            // Match must have scores to determine result
            if (match.HomeScore == null || match.AwayScore == null)
            {
                _logger.LogWarning("Match {MatchId} has no scores yet", match.Id);
                return false; // No scores = can't determine, treat as lose
            }

            var isSelectionCorrect = IsSelectionCorrect(selection, match);
            if (!isSelectionCorrect)
            {
                _logger.LogInformation("Selection {SelectionId} lost: {Label} on match {MatchId} ({HomeScore}-{AwayScore})",
                    selection.Id, selection.SelectionLabel, match.Id, match.HomeScore, match.AwayScore);
                return false; // One wrong selection = entire ticket loses
            }
        }

        // All selections correct = ticket wins
        return true;
    }

    private bool IsSelectionCorrect(TicketSelection selection, Match match)
    {
        var homeScore = match.HomeScore!.Value;
        var awayScore = match.AwayScore!.Value;
        var label = selection.SelectionLabel.ToLowerInvariant();
        var marketType = selection.MarketType.ToLowerInvariant();
        var homeTeamLower = (match.HomeTeam?.Name ?? "").ToLowerInvariant();
        var awayTeamLower = (match.AwayTeam?.Name ?? "").ToLowerInvariant();

        // Head-to-head (1X2) market
        if (marketType == "h2h" || marketType == "1x2")
        {
            // Check for home win
            if (label.Contains("home") || label == "1" || (homeTeamLower.Length > 0 && label.Contains(homeTeamLower)))
            {
                return homeScore > awayScore;
            }

            // Check for away win
            if (label.Contains("away") || label == "2" || (awayTeamLower.Length > 0 && label.Contains(awayTeamLower)))
            {
                return awayScore > homeScore;
            }

            // Check for draw
            if (label.Contains("draw") || label.Contains("nul") || label == "x")
            {
                return homeScore == awayScore;
            }
        }

        // Totals (Over/Under) market
        if (marketType == "totals" || marketType.Contains("over") || marketType.Contains("under"))
        {
            var totalGoals = homeScore + awayScore;

            // Extract threshold from label (e.g., "Over 2.5" → 2.5)
            var match2 = System.Text.RegularExpressions.Regex.Match(label, @"(\d+\.?\d*)");
            if (match2.Success && decimal.TryParse(match2.Value, out var threshold))
            {
                if (label.Contains("over") || label.Contains("+"))
                {
                    return totalGoals > threshold;
                }
                if (label.Contains("under") || label.Contains("-"))
                {
                    return totalGoals < threshold;
                }
            }
        }

        // Double chance market
        if (marketType == "double_chance")
        {
            if (label.Contains("1x") || (label.Contains("home") && label.Contains("draw")))
            {
                return homeScore >= awayScore; // Home or draw
            }
            if (label.Contains("x2") || (label.Contains("away") && label.Contains("draw")))
            {
                return awayScore >= homeScore; // Away or draw
            }
            if (label.Contains("12") || label.Contains("no draw"))
            {
                return homeScore != awayScore; // Home or away (no draw)
            }
        }

        // Both teams to score
        if (marketType == "btts" || marketType.Contains("both"))
        {
            var bothScored = homeScore > 0 && awayScore > 0;
            if (label.Contains("yes") || label.Contains("oui"))
            {
                return bothScored;
            }
            if (label.Contains("no") || label.Contains("non"))
            {
                return !bothScored;
            }
        }

        _logger.LogWarning("Unknown market type or selection: {MarketType} / {Label}", marketType, label);
        return false; // Unknown market = treat as lose for safety
    }

    private async Task ProcessWinningsAsync(ApplicationDbContext context, Ticket ticket)
    {
        // Credit buyers for winning tickets
        foreach (var purchase in ticket.Purchases)
        {
            var buyerWallet = await context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == purchase.BuyerId);

            if (buyerWallet != null)
            {
                // Calculate winnings based on odds (in cents)
                var winningsCents = (int)Math.Floor(purchase.PriceCents * ticket.AvgOdds);

                buyerWallet.TipsterBalanceCents += winningsCents;
                buyerWallet.UpdatedAt = DateTime.UtcNow;

                // Create WIN transaction
                var winTransaction = new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = buyerWallet.Id,
                    Type = TransactionType.Win,
                    AmountCents = winningsCents,
                    ReferenceId = ticket.Id,
                    Status = TransactionStatus.Completed,
                    CreatedAt = DateTime.UtcNow
                };
                context.WalletTransactions.Add(winTransaction);

                _logger.LogInformation("Credited {WinningsCents} cents to user {UserId} for winning ticket {TicketId}",
                    winningsCents, purchase.BuyerId, ticket.Id);
            }
        }
    }
}

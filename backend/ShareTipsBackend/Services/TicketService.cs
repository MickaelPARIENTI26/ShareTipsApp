using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ICacheService _cache;
    private readonly IGamificationService _gamificationService;

    public TicketService(
        ApplicationDbContext context,
        INotificationService notificationService,
        ICacheService cache,
        IGamificationService gamificationService)
    {
        _context = context;
        _notificationService = notificationService;
        _cache = cache;
        _gamificationService = gamificationService;
    }

    public async Task<TicketDto?> GetByIdAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Creator)
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (ticket == null) return null;

        var matchInfo = await ResolveMatchInfoAsync(new[] { ticket });
        return MapToDto(ticket, matchInfo: matchInfo);
    }

    public async Task<PaginatedResult<TicketDto>> GetByUserIdPaginatedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Creator)
            .Where(t => t.CreatorId == userId && t.DeletedAt == null)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync();

        var tickets = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var matchInfo = await ResolveMatchInfoAsync(tickets);
        var dtos = tickets.Select(t => MapToDto(t, matchInfo: matchInfo));

        return PaginatedResult<TicketDto>.Create(dtos, page, pageSize, totalCount);
    }

    public async Task<PaginatedResult<TicketDto>> GetPublicTicketsPaginatedAsync(
        int page, int pageSize, string? sports, decimal? minOdds, decimal? maxOdds,
        int? minConfidence = null, int? maxConfidence = null,
        int? minSelections = null, int? maxSelections = null,
        Guid? followedByUserId = null, Guid? creatorId = null, string? sortBy = null,
        Guid? excludeUserId = null, Guid? currentUserId = null, string? ticketType = null)
    {
        var query = _context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Creator)
            .Where(t => t.DeletedAt == null && t.Status == TicketStatus.Open)
            .AsQueryable();

        // Show ALL tickets (public + private) from other users
        if (excludeUserId.HasValue)
        {
            query = query.Where(t => t.CreatorId != excludeUserId.Value);
        }

        // Apply filters
        if (!string.IsNullOrEmpty(sports))
        {
            var sportList = sports.Split(',', StringSplitOptions.RemoveEmptyEntries);
            query = query.Where(t => t.Sports.Any(s => sportList.Contains(s)));
        }

        if (minOdds.HasValue)
        {
            query = query.Where(t => t.AvgOdds >= minOdds.Value);
        }

        if (maxOdds.HasValue)
        {
            query = query.Where(t => t.AvgOdds <= maxOdds.Value);
        }

        if (minConfidence.HasValue)
        {
            query = query.Where(t => t.ConfidenceIndex >= minConfidence.Value);
        }

        if (maxConfidence.HasValue)
        {
            query = query.Where(t => t.ConfidenceIndex <= maxConfidence.Value);
        }

        if (minSelections.HasValue)
        {
            query = query.Where(t => t.Selections.Count >= minSelections.Value);
        }

        if (maxSelections.HasValue)
        {
            query = query.Where(t => t.Selections.Count <= maxSelections.Value);
        }

        if (!string.IsNullOrEmpty(ticketType))
        {
            if (ticketType.Equals("public", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => t.IsPublic);
            else if (ticketType.Equals("private", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => !t.IsPublic);
        }

        if (creatorId.HasValue)
        {
            query = query.Where(t => t.CreatorId == creatorId.Value);
        }

        if (followedByUserId.HasValue)
        {
            // Use UserFollows (free following) instead of Subscriptions (paid)
            var followedTipsterIds = _context.UserFollows
                .Where(f => f.FollowerUserId == followedByUserId.Value)
                .Select(f => f.FollowedUserId);

            query = query.Where(t => followedTipsterIds.Contains(t.CreatorId));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting (default: most recent first)
        IOrderedQueryable<Ticket> orderedQuery = sortBy?.ToLower() switch
        {
            "odds" => query.OrderByDescending(t => t.AvgOdds),
            "confidence" => query.OrderByDescending(t => t.ConfidenceIndex),
            _ => query.OrderByDescending(t => t.CreatedAt),
        };

        // Apply pagination
        var tickets = await orderedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Extract IDs from paginated results for optimized lookups
        var ticketIds = tickets.Select(t => t.Id).ToList();
        var creatorIds = tickets.Select(t => t.CreatorId).Distinct().ToList();

        // Run auxiliary queries SEQUENTIALLY (DbContext is not thread-safe)
        var purchasedIds = currentUserId.HasValue
            ? (await _context.TicketPurchases
                .Where(p => p.BuyerId == currentUserId.Value && ticketIds.Contains(p.TicketId))
                .Select(p => p.TicketId)
                .ToListAsync()).ToHashSet()
            : new HashSet<Guid>();

        var subscribedTipsterIds = currentUserId.HasValue
            ? (await _context.Subscriptions
                .Where(s => s.SubscriberId == currentUserId.Value
                    && creatorIds.Contains(s.TipsterId)
                    && s.Status == SubscriptionStatus.Active
                    && s.EndDate > DateTime.UtcNow)
                .Select(s => s.TipsterId)
                .ToListAsync()).ToHashSet()
            : new HashSet<Guid>();

        var matchInfo = await ResolveMatchInfoAsync(tickets);

        // Map to DTOs, stripping selections for private tickets without access
        var dtos = tickets.Select(t =>
        {
            var isPurchased = purchasedIds.Contains(t.Id);
            var isSubscribed = subscribedTipsterIds.Contains(t.CreatorId);
            var hasAccess = isPurchased || isSubscribed;
            var dto = MapToDto(t, isPurchased, matchInfo, isSubscribed);
            if (!t.IsPublic && !hasAccess)
                return dto with { Selections = new List<TicketSelectionDto>() };
            return dto;
        });

        return PaginatedResult<TicketDto>.Create(dtos, page, pageSize, totalCount);
    }

    public async Task<TicketFilterMetaDto> GetFilterMetaAsync(Guid? excludeUserId = null)
    {
        // Cache filter meta globally (excludeUserId is typically the current user, but meta is similar for all)
        return await _cache.GetOrCreateAsync(
            CacheKeys.TicketFilterMeta,
            async () =>
            {
                var query = _context.Tickets
                    .Where(t => t.DeletedAt == null && t.Status == TicketStatus.Open);

                // Note: We cache without excludeUserId filter for simplicity
                // The difference is minimal and not worth separate cache entries

                var stats = await query
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        MinOdds = g.Min(t => t.AvgOdds),
                        MaxOdds = g.Max(t => t.AvgOdds),
                        MinConf = g.Min(t => t.ConfidenceIndex),
                        MaxConf = g.Max(t => t.ConfidenceIndex),
                        MinSelections = g.Min(t => t.Selections.Count),
                        MaxSelections = g.Max(t => t.Selections.Count),
                    })
                    .FirstOrDefaultAsync();

                var availableSports = await query
                    .SelectMany(t => t.Sports)
                    .Distinct()
                    .ToArrayAsync();

                if (stats == null)
                    return new TicketFilterMetaDto(1, 50, 0, 10, Array.Empty<string>(), 1, 20);

                return new TicketFilterMetaDto(
                    stats.MinOdds, stats.MaxOdds,
                    stats.MinConf, stats.MaxConf,
                    availableSports,
                    stats.MinSelections, stats.MaxSelections);
            },
            CacheKeys.TicketFilterMetaTtl);
    }

    public async Task<TicketDto> CreateAsync(Guid creatorId, CreateTicketDto dto)
    {
        // Validate selections
        if (dto.Selections == null || dto.Selections.Count == 0)
        {
            throw new ArgumentException("At least one selection is required");
        }

        // Calculate average odds
        var oddsValues = dto.Selections.Select(s => s.Odds).ToList();
        var avgOdds = CalculateAverageOdds(oddsValues);

        // Get first match time from selections
        var matchIds = dto.Selections.Select(s => s.MatchId).Distinct().ToList();
        var matches = await _context.Matches
            .Where(m => matchIds.Contains(m.Id))
            .ToListAsync();

        var firstMatchTime = matches.Any()
            ? matches.Min(m => m.StartTime)
            : DateTime.UtcNow.AddDays(1);

        var lastMatchTime = matches.Any()
            ? matches.Max(m => m.StartTime)
            : firstMatchTime;

        // Extract sports from selections
        var sports = dto.Selections.Select(s => s.Sport).Distinct().ToArray();

        // Create ticket
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            CreatorId = creatorId,
            Title = dto.Title,
            IsPublic = dto.IsPublic,
            PriceCents = (int)(dto.PriceEur * 100),
            ConfidenceIndex = dto.ConfidenceIndex,
            AvgOdds = avgOdds,
            Sports = sports,
            FirstMatchTime = firstMatchTime,
            LastMatchTime = lastMatchTime,
            Status = TicketStatus.Open,
            Result = TicketResult.Pending,
            CreatedAt = DateTime.UtcNow,
            Selections = dto.Selections.Select(s => new TicketSelection
            {
                Id = Guid.NewGuid(),
                MatchId = s.MatchId,
                MarketType = s.MarketType,
                SelectionLabel = s.SelectionCode,
                Odds = s.Odds,
                MatchLabel = s.MatchLabel,
                LeagueName = s.LeagueName
            }).ToList()
        };

        // Check if first match is already started - lock immediately
        if (firstMatchTime <= DateTime.UtcNow)
        {
            ticket.Status = TicketStatus.Locked;
        }

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        await _context.Entry(ticket)
            .Reference(t => t.Creator)
            .LoadAsync();

        // Award XP for creating a ticket
        await _gamificationService.AwardXpAsync(
            creatorId,
            XpActionType.CreateTicket,
            $"Création du ticket: {ticket.Title}",
            ticket.Id);

        // Notify followers and active subscribers
        await NotifyFollowersAndSubscribersAsync(ticket);

        return MapToDto(ticket);
    }

    private async Task NotifyFollowersAndSubscribersAsync(Ticket ticket)
    {
        var creatorId = ticket.CreatorId;
        var creatorUsername = ticket.Creator?.Username ?? "Un tipster";

        // Get all followers of the creator
        var followerIds = await _context.UserFollows
            .Where(f => f.FollowedUserId == creatorId)
            .Select(f => f.FollowerUserId)
            .ToListAsync();

        // Get all active subscribers of the creator
        var now = DateTime.UtcNow;
        var subscriberIds = await _context.Subscriptions
            .Where(s => s.TipsterId == creatorId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > now)
            .Select(s => s.SubscriberId)
            .ToListAsync();

        // Combine without duplicates
        var userIdsToNotify = followerIds
            .Union(subscriberIds)
            .Distinct()
            .ToList();

        if (userIdsToNotify.Count == 0)
            return;

        await _notificationService.NotifyManyAsync(
            userIdsToNotify,
            NotificationType.NewTicket,
            "Nouveau ticket publié",
            $"{creatorUsername} a publié un nouveau ticket",
            new { ticketId = ticket.Id, tipsterId = creatorId });
    }

    public async Task<TicketDto?> UpdateAsync(Guid ticketId, Guid userId, UpdateTicketDto dto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Selections)
            .Include(t => t.Creator)
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (ticket == null)
        {
            return null;
        }

        // Business rule: Only creator can update
        if (ticket.CreatorId != userId)
        {
            throw new UnauthorizedAccessException("Only the creator can update this ticket");
        }

        // Business rule: Cannot update tickets that have been purchased
        var hasPurchases = await _context.TicketPurchases
            .AnyAsync(p => p.TicketId == ticketId);

        if (hasPurchases)
        {
            throw new InvalidOperationException("Cannot update a ticket that has been purchased");
        }

        // Business rule: Ticket must be OPEN
        if (ticket.Status != TicketStatus.Open)
        {
            throw new InvalidOperationException("Cannot update a ticket that is not open");
        }

        // Business rule: Cannot update after first match has started
        if (ticket.FirstMatchTime <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Cannot update a ticket after the first match has started");
        }

        // Update fields if provided
        if (dto.Title != null)
        {
            ticket.Title = dto.Title;
        }

        if (dto.IsPublic.HasValue)
        {
            ticket.IsPublic = dto.IsPublic.Value;
        }

        if (dto.PriceEur.HasValue)
        {
            ticket.PriceCents = (int)(dto.PriceEur.Value * 100);
        }

        if (dto.ConfidenceIndex.HasValue)
        {
            ticket.ConfidenceIndex = dto.ConfidenceIndex.Value;
        }

        // Update selections if provided
        if (dto.Selections != null && dto.Selections.Count > 0)
        {
            // Remove existing selections
            _context.TicketSelections.RemoveRange(ticket.Selections);

            // Add new selections
            ticket.Selections = dto.Selections.Select(s => new TicketSelection
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                MatchId = s.MatchId,
                MarketType = s.MarketType,
                SelectionLabel = s.SelectionCode,
                Odds = s.Odds,
                MatchLabel = s.MatchLabel,
                LeagueName = s.LeagueName
            }).ToList();

            // Recalculate average odds
            var oddsValues = dto.Selections.Select(s => s.Odds).ToList();
            ticket.AvgOdds = CalculateAverageOdds(oddsValues);

            // Recalculate first match time
            var matchIds = dto.Selections.Select(s => s.MatchId).Distinct().ToList();
            var matches = await _context.Matches
                .Where(m => matchIds.Contains(m.Id))
                .ToListAsync();

            ticket.FirstMatchTime = matches.Any()
                ? matches.Min(m => m.StartTime)
                : DateTime.UtcNow.AddDays(1);

            ticket.LastMatchTime = matches.Any()
                ? matches.Max(m => m.StartTime)
                : ticket.FirstMatchTime;

            // Recalculate sports
            ticket.Sports = dto.Selections.Select(s => s.Sport).Distinct().ToArray();
        }

        await _context.SaveChangesAsync();

        return MapToDto(ticket);
    }

    public async Task<bool> DeleteAsync(Guid ticketId, Guid userId)
    {
        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (ticket == null)
        {
            return false;
        }

        // Business rule: Only creator can delete
        if (ticket.CreatorId != userId)
        {
            throw new UnauthorizedAccessException("Only the creator can delete this ticket");
        }

        // Business rule: Cannot delete tickets that have been purchased
        var hasPurchases = await _context.TicketPurchases
            .AnyAsync(p => p.TicketId == ticketId);

        if (hasPurchases)
        {
            throw new InvalidOperationException("Cannot delete a ticket that has been purchased");
        }

        // Business rule: Cannot delete ticket after first match has started
        if (ticket.FirstMatchTime <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Cannot delete a ticket after the first match has started");
        }

        // Soft delete
        ticket.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task LockTicketsBeforeMatchAsync()
    {
        var now = DateTime.UtcNow;

        // Find all open tickets where first match has started
        var ticketsToLock = await _context.Tickets
            .Where(t => t.Status == TicketStatus.Open
                && t.FirstMatchTime <= now
                && t.DeletedAt == null)
            .ToListAsync();

        foreach (var ticket in ticketsToLock)
        {
            ticket.Status = TicketStatus.Locked;
        }

        if (ticketsToLock.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    public decimal CalculateAverageOdds(IEnumerable<decimal> odds)
    {
        var oddsList = odds.ToList();
        if (!oddsList.Any())
        {
            return 0;
        }

        // Calculate average odds (moyenne des cotes)
        var averageOdds = oddsList.Average();

        // Return the average odds rounded to 2 decimal places
        return Math.Round(averageOdds, 2);
    }

    private async Task<Dictionary<Guid, MatchInfo>> ResolveMatchInfoAsync(
        IEnumerable<Ticket> tickets)
    {
        var matchIds = tickets
            .SelectMany(t => t.Selections)
            .Select(s => s.MatchId)
            .Distinct()
            .ToList();

        if (matchIds.Count == 0)
            return new Dictionary<Guid, MatchInfo>();

        return await _context.Matches
            .Include(m => m.HomeTeam)
            .Include(m => m.AwayTeam)
            .Include(m => m.League)
            .Where(m => matchIds.Contains(m.Id))
            .ToDictionaryAsync(
                m => m.Id,
                m => new MatchInfo(
                    $"{m.HomeTeam?.Name ?? "?"} vs {m.AwayTeam?.Name ?? "?"}",
                    m.League?.Name,
                    m.StartTime,
                    m.Status.ToString(),
                    m.HomeScore,
                    m.AwayScore,
                    m.HomeTeam?.Name,
                    m.AwayTeam?.Name
                ));
    }

    private record MatchInfo(
        string Label,
        string? League,
        DateTime StartTime,
        string Status,
        int? HomeScore,
        int? AwayScore,
        string? HomeTeamName,
        string? AwayTeamName
    );

    private static TicketDto MapToDto(
        Ticket ticket,
        bool isPurchasedByCurrentUser = false,
        Dictionary<Guid, MatchInfo>? matchInfo = null,
        bool isSubscribedToCreator = false)
    {
        return new TicketDto(
            ticket.Id,
            ticket.CreatorId,
            ticket.Creator?.Username ?? "Unknown",
            ticket.Title,
            ticket.IsPublic,
            ticket.PriceCents / 100m, // Convert cents to EUR for DTO
            ticket.ConfidenceIndex,
            ticket.AvgOdds,
            ticket.Sports,
            ticket.FirstMatchTime,
            // Use FirstMatchTime as fallback if LastMatchTime is not set (legacy data)
            ticket.LastMatchTime > DateTime.MinValue ? ticket.LastMatchTime : ticket.FirstMatchTime,
            ticket.Status.ToString(),
            ticket.Result.ToString(),
            ticket.CreatedAt,
            ticket.Selections.Select(s =>
            {
                var label = s.MatchLabel;
                var league = s.LeagueName;
                DateTime? startTime = null;
                string? matchStatus = null;
                int? homeScore = null;
                int? awayScore = null;
                string selectionResult = "Pending";

                if (matchInfo != null && matchInfo.TryGetValue(s.MatchId, out var info))
                {
                    label ??= info.Label;
                    league ??= info.League;
                    startTime = info.StartTime;
                    matchStatus = info.Status;
                    homeScore = info.HomeScore;
                    awayScore = info.AwayScore;

                    // Calculate selection result if match is finished and has scores
                    if (info.Status == "Finished" && info.HomeScore.HasValue && info.AwayScore.HasValue)
                    {
                        selectionResult = IsSelectionCorrect(s.MarketType, s.SelectionLabel, info)
                            ? "Win"
                            : "Lose";
                    }
                }

                return new TicketSelectionDto(
                    s.Id,
                    s.MatchId,
                    s.MarketType,
                    s.SelectionLabel,
                    s.Odds,
                    s.PlayerName,
                    label,
                    league,
                    startTime,
                    matchStatus,
                    homeScore,
                    awayScore,
                    selectionResult
                );
            }).ToList(),
            ticket.Selections.Count,
            isPurchasedByCurrentUser,
            isSubscribedToCreator
        );
    }

    private static bool IsSelectionCorrect(string marketType, string selectionLabel, MatchInfo match)
    {
        var homeScore = match.HomeScore!.Value;
        var awayScore = match.AwayScore!.Value;
        var label = selectionLabel.ToLowerInvariant();
        var market = marketType.ToLowerInvariant();
        var homeTeamLower = (match.HomeTeamName ?? "").ToLowerInvariant();
        var awayTeamLower = (match.AwayTeamName ?? "").ToLowerInvariant();

        // Head-to-head (1X2) market
        if (market == "h2h" || market == "1x2")
        {
            if (label.Contains("home") || label == "1" || (homeTeamLower.Length > 0 && label.Contains(homeTeamLower)))
                return homeScore > awayScore;
            if (label.Contains("away") || label == "2" || (awayTeamLower.Length > 0 && label.Contains(awayTeamLower)))
                return awayScore > homeScore;
            if (label.Contains("draw") || label.Contains("nul") || label == "x")
                return homeScore == awayScore;
        }

        // Totals (Over/Under) market
        if (market == "totals" || market.Contains("over") || market.Contains("under"))
        {
            var totalGoals = homeScore + awayScore;
            var regex = System.Text.RegularExpressions.Regex.Match(label, @"(\d+\.?\d*)");
            if (regex.Success && decimal.TryParse(regex.Value, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var threshold))
            {
                if (label.Contains("over") || label.Contains("+"))
                    return totalGoals > threshold;
                if (label.Contains("under") || label.Contains("-"))
                    return totalGoals < threshold;
            }
        }

        // Double chance market
        if (market == "double_chance")
        {
            if (label.Contains("1x") || (label.Contains("home") && label.Contains("draw")))
                return homeScore >= awayScore;
            if (label.Contains("x2") || (label.Contains("away") && label.Contains("draw")))
                return awayScore >= homeScore;
            if (label.Contains("12") || label.Contains("no draw"))
                return homeScore != awayScore;
        }

        // Both teams to score
        if (market == "btts" || market.Contains("both"))
        {
            var bothScored = homeScore > 0 && awayScore > 0;
            if (label.Contains("yes") || label.Contains("oui"))
                return bothScored;
            if (label.Contains("no") || label.Contains("non"))
                return !bothScored;
        }

        return false; // Unknown market = treat as lose
    }
}

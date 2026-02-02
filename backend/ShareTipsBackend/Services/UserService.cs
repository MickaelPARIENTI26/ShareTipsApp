using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UserService> _logger;

    public UserService(
        ApplicationDbContext context,
        ILogger<UserService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GDPR: Export all user data
    public async Task<UserDataExportDto> ExportUserDataAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Wallet)
            .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
            ?? throw new KeyNotFoundException("User not found");

        // Personal data
        var personalData = new UserPersonalDataDto(
            user.Id,
            user.Email,
            user.Username,
            user.DateOfBirth,
            user.IsVerified,
            user.CreatedAt,
            user.UpdatedAt
        );

        // Wallet
        var wallet = user.Wallet != null
            ? new WalletExportDto(user.Wallet.BalanceCredits, user.Wallet.LockedCredits, user.Wallet.CreatedAt)
            : new WalletExportDto(0, 0, user.CreatedAt);

        // Tickets created
        var tickets = await _context.Tickets
            .Where(t => t.CreatorId == userId && t.DeletedAt == null)
            .Select(t => new TicketExportDto(
                t.Id,
                t.Title,
                t.AvgOdds,
                t.ConfidenceIndex,
                t.IsPublic,
                t.PriceCredits,
                t.Status.ToString(),
                t.Result.ToString(),
                t.CreatedAt
            ))
            .ToListAsync();

        // Purchases
        var purchases = await _context.TicketPurchases
            .Where(p => p.BuyerId == userId)
            .Include(p => p.Ticket)
            .Select(p => new PurchaseExportDto(
                p.TicketId,
                p.Ticket!.Title,
                p.Ticket.Creator!.Username,
                p.PriceCredits,
                p.CreatedAt
            ))
            .ToListAsync();

        // Subscriptions (as subscriber)
        var subscriptions = await _context.Subscriptions
            .Where(s => s.SubscriberId == userId)
            .Include(s => s.Tipster)
            .Select(s => new SubscriptionExportDto(
                s.Tipster!.Username,
                s.PriceCredits,
                s.StartDate,
                s.EndDate,
                s.Status.ToString()
            ))
            .ToListAsync();

        // Following
        var following = await _context.UserFollows
            .Where(f => f.FollowerUserId == userId)
            .Include(f => f.Followed)
            .Select(f => new FollowExportDto(
                f.Followed!.Username,
                f.CreatedAt
            ))
            .ToListAsync();

        // Followers
        var followers = await _context.UserFollows
            .Where(f => f.FollowedUserId == userId)
            .Include(f => f.Follower)
            .Select(f => new FollowExportDto(
                f.Follower!.Username,
                f.CreatedAt
            ))
            .ToListAsync();

        // Consents
        var consents = await _context.UserConsents
            .Where(c => c.UserId == userId)
            .Select(c => new ConsentExportDto(
                c.ConsentType,
                c.Version,
                c.ConsentedAt
            ))
            .ToListAsync();

        // Notifications
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(100) // Limit to last 100
            .Select(n => new NotificationExportDto(
                n.Type.ToString(),
                n.Title,
                n.Message,
                n.IsRead,
                n.CreatedAt
            ))
            .ToListAsync();

        return new UserDataExportDto(
            personalData,
            wallet,
            tickets,
            purchases,
            subscriptions,
            following,
            followers,
            consents,
            notifications,
            DateTime.UtcNow
        );
    }

    // GDPR: Delete user account and anonymize data
    public async Task DeleteAccountAsync(Guid userId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var user = await _context.Users
                .Include(u => u.Wallet)
                .FirstOrDefaultAsync(u => u.Id == userId && u.DeletedAt == null)
                ?? throw new KeyNotFoundException("User not found");

            // Check for pending withdrawals
            var hasPendingWithdrawals = await _context.WithdrawalRequests
                .AnyAsync(w => w.UserId == userId && w.Status == WithdrawalStatus.Pending);
            if (hasPendingWithdrawals)
            {
                throw new InvalidOperationException("Cannot delete account with pending withdrawal requests");
            }

            // 1. Revoke all refresh tokens
            var tokens = await _context.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync();
            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            // 2. Delete notifications
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            // 3. Delete notification preferences
            var notifPrefs = await _context.NotificationPreferences
                .FirstOrDefaultAsync(np => np.UserId == userId);
            if (notifPrefs != null)
            {
                _context.NotificationPreferences.Remove(notifPrefs);
            }

            // 4. Delete consents
            var consents = await _context.UserConsents
                .Where(c => c.UserId == userId)
                .ToListAsync();
            _context.UserConsents.RemoveRange(consents);

            // 5. Delete favorites
            var favorites = await _context.FavoriteTickets
                .Where(f => f.UserId == userId)
                .ToListAsync();
            _context.FavoriteTickets.RemoveRange(favorites);

            // 6. Delete follows (both directions)
            var follows = await _context.UserFollows
                .Where(f => f.FollowerUserId == userId || f.FollowedUserId == userId)
                .ToListAsync();
            _context.UserFollows.RemoveRange(follows);

            // 7. Soft-delete user's tickets (they remain for buyers' reference)
            var tickets = await _context.Tickets
                .Where(t => t.CreatorId == userId && t.DeletedAt == null)
                .ToListAsync();
            foreach (var ticket in tickets)
            {
                ticket.DeletedAt = DateTime.UtcNow;
            }

            // 8. Delete wallet (credits are forfeited)
            if (user.Wallet != null)
            {
                _context.Wallets.Remove(user.Wallet);
            }

            // 9. Anonymize user data (soft delete with anonymization)
            user.Email = $"deleted_{userId}@deleted.local";
            user.Username = $"deleted_{userId.ToString()[..8]}";
            user.PasswordHash = "";
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
            user.StripeAccountId = null;
            user.DateOfBirth = DateOnly.MinValue; // GDPR: Anonymize date of birth
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Account deletion failed: UserId={UserId}", userId);
            await transaction.RollbackAsync();
            throw;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Utilities;

namespace ShareTipsBackend.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ApplicationDbContext _context;
    private readonly IConsentService _consentService;
    private readonly IStripeConnectService _stripeService;
    private readonly ILogger<SubscriptionService> _logger;
    private const decimal PlatformFeePercent = 0.10m; // 10% commission

    public SubscriptionService(
        ApplicationDbContext context,
        IConsentService consentService,
        IStripeConnectService stripeService,
        ILogger<SubscriptionService> logger)
    {
        _context = context;
        _consentService = consentService;
        _stripeService = stripeService;
        _logger = logger;
    }

    public async Task<SubscriptionResultDto> SubscribeAsync(Guid subscriberId, Guid tipsterId, int priceCredits)
    {
        // Check consent first
        var hasConsent = await _consentService.HasConsentAsync(subscriberId, ConsentTypes.NoGuarantee);
        if (!hasConsent)
        {
            return new SubscriptionResultDto(false, "Consent required", null, 0);
        }

        // Business rule: Cannot subscribe to yourself
        if (subscriberId == tipsterId)
        {
            return new SubscriptionResultDto(false, "Cannot subscribe to yourself", null, 0);
        }

        // Check if tipster exists
        var tipster = await _context.Users.FindAsync(tipsterId);
        if (tipster == null)
        {
            return new SubscriptionResultDto(false, "Tipster not found", null, 0);
        }

        // Check if already subscribed (active subscription)
        var existingSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > DateTime.UtcNow);

        if (existingSubscription != null)
        {
            return new SubscriptionResultDto(false, "Already subscribed to this tipster", null, 0);
        }

        // Check for previous expired/cancelled subscription (unique index on SubscriberId+TipsterId)
        var previousSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && (s.Status == SubscriptionStatus.Expired || s.Status == SubscriptionStatus.Cancelled));

        // Free follow: skip wallet operations entirely
        if (priceCredits <= 0)
        {
            var now = DateTime.UtcNow;

            Subscription subscription;
            if (previousSubscription != null)
            {
                // Reactivate existing record
                previousSubscription.PriceCredits = 0;
                previousSubscription.CommissionCredits = 0;
                previousSubscription.StartDate = now;
                previousSubscription.EndDate = now.AddMonths(1);
                previousSubscription.Status = SubscriptionStatus.Active;
                previousSubscription.CancelledAt = null;
                // Reset notification flags for new subscription period
                previousSubscription.NotifiedExpiringJ3 = false;
                previousSubscription.NotifiedExpiringJ1 = false;
                previousSubscription.NotifiedExpired = false;
                subscription = previousSubscription;
            }
            else
            {
                subscription = new Subscription
                {
                    Id = Guid.NewGuid(),
                    SubscriberId = subscriberId,
                    TipsterId = tipsterId,
                    PriceCredits = 0,
                    CommissionCredits = 0,
                    StartDate = now,
                    EndDate = now.AddMonths(1),
                    Status = SubscriptionStatus.Active,
                    CreatedAt = now
                };
                _context.Subscriptions.Add(subscription);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Race condition: another request already created the subscription
                return new SubscriptionResultDto(false, "Already subscribed to this tipster", null, 0);
            }

            var subscriber = await _context.Users.FindAsync(subscriberId);
            var subscriptionDto = new SubscriptionDto(
                subscription.Id,
                subscriberId,
                subscriber?.Username ?? "Unknown",
                tipsterId,
                tipster.Username,
                0,
                0,
                subscription.StartDate,
                subscription.EndDate,
                subscription.Status.ToString(),
                subscription.CreatedAt
            );

            return new SubscriptionResultDto(true, "Subscription successful", subscriptionDto, 0);
        }

        // Paid subscription: use transaction for atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Lock wallets in consistent order to prevent deadlocks
            var (subscriberWallet, tipsterWallet) = await WalletOperations.LockWalletsInOrderAsync(
                _context, subscriberId, tipsterId);

            if (subscriberWallet == null)
            {
                return new SubscriptionResultDto(false, "Subscriber wallet not found", null, 0);
            }

            if (tipsterWallet == null)
            {
                return new SubscriptionResultDto(false, "Tipster wallet not found", null, subscriberWallet.BalanceCredits);
            }

            var availableBalance = subscriberWallet.BalanceCredits - subscriberWallet.LockedCredits;

            // Business rule: Sufficient credits
            if (availableBalance < priceCredits)
            {
                return new SubscriptionResultDto(false, "Insufficient credits", null, subscriberWallet.BalanceCredits);
            }

            // Calculate amounts using shared utility
            var (commissionCredits, tipsterCredits) = WalletOperations.CalculateCommission(priceCredits);

            // 3. Create or reactivate subscription record (need Id for ReferenceId)
            var paidNow = DateTime.UtcNow;
            Subscription paidSubscription;
            if (previousSubscription != null)
            {
                // Reactivate existing record
                previousSubscription.PriceCredits = priceCredits;
                previousSubscription.CommissionCredits = commissionCredits;
                previousSubscription.StartDate = paidNow;
                previousSubscription.EndDate = paidNow.AddMonths(1);
                previousSubscription.Status = SubscriptionStatus.Active;
                previousSubscription.CancelledAt = null;
                // Reset notification flags for new subscription period
                previousSubscription.NotifiedExpiringJ3 = false;
                previousSubscription.NotifiedExpiringJ1 = false;
                previousSubscription.NotifiedExpired = false;
                paidSubscription = previousSubscription;
            }
            else
            {
                paidSubscription = new Subscription
                {
                    Id = Guid.NewGuid(),
                    SubscriberId = subscriberId,
                    TipsterId = tipsterId,
                    PriceCredits = priceCredits,
                    CommissionCredits = commissionCredits,
                    StartDate = paidNow,
                    EndDate = paidNow.AddMonths(1),
                    Status = SubscriptionStatus.Active,
                    CreatedAt = paidNow
                };
                _context.Subscriptions.Add(paidSubscription);
            }

            // 4. Create subscriber transaction (SUBSCRIPTION_PURCHASE)
            var subscriberTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = subscriberWallet.Id,
                Type = TransactionType.SubscriptionPurchase,
                AmountCredits = -priceCredits,
                ReferenceId = paidSubscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = paidNow
            };
            _context.WalletTransactions.Add(subscriberTransaction);

            // 5. Create tipster transaction (SUBSCRIPTION_SALE)
            var tipsterTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = tipsterWallet.Id,
                Type = TransactionType.SubscriptionSale,
                AmountCredits = tipsterCredits,
                ReferenceId = paidSubscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = paidNow
            };
            _context.WalletTransactions.Add(tipsterTransaction);

            // 6. Create commission transaction
            var commissionTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = tipsterWallet.Id,
                Type = TransactionType.Commission,
                AmountCredits = -commissionCredits,
                ReferenceId = paidSubscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = paidNow
            };
            _context.WalletTransactions.Add(commissionTransaction);

            // Save and commit
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Load subscriber info for response
            var paidSubscriber = await _context.Users.FindAsync(subscriberId);

            var paidSubscriptionDto = new SubscriptionDto(
                paidSubscription.Id,
                subscriberId,
                paidSubscriber?.Username ?? "Unknown",
                tipsterId,
                tipster.Username,
                priceCredits,
                commissionCredits,
                paidSubscription.StartDate,
                paidSubscription.EndDate,
                paidSubscription.Status.ToString(),
                paidSubscription.CreatedAt
            );

            return new SubscriptionResultDto(true, "Subscription successful", paidSubscriptionDto, subscriberWallet.BalanceCredits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Subscription operation failed");
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<SubscriptionResultDto> SubscribeWithPlanAsync(Guid subscriberId, Guid planId)
    {
        // Check consent first
        var hasConsent = await _consentService.HasConsentAsync(subscriberId, ConsentTypes.NoGuarantee);
        if (!hasConsent)
        {
            return new SubscriptionResultDto(false, "Consent required", null, 0);
        }

        // Fetch the subscription plan
        var plan = await _context.SubscriptionPlans
            .Include(p => p.Tipster)
            .FirstOrDefaultAsync(p => p.Id == planId && p.IsActive);

        if (plan == null)
        {
            return new SubscriptionResultDto(false, "Plan not found or inactive", null, 0);
        }

        var tipsterId = plan.TipsterUserId;

        // Business rule: Cannot subscribe to yourself
        if (subscriberId == tipsterId)
        {
            return new SubscriptionResultDto(false, "Cannot subscribe to yourself", null, 0);
        }

        // Check if already subscribed (active subscription)
        var existingSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > DateTime.UtcNow);

        if (existingSubscription != null)
        {
            return new SubscriptionResultDto(false, "Already subscribed to this tipster", null, 0);
        }

        // Check for previous expired/cancelled subscription
        var previousSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && (s.Status == SubscriptionStatus.Expired || s.Status == SubscriptionStatus.Cancelled));

        var priceCredits = plan.PriceCredits;
        var durationDays = plan.DurationInDays;

        // Use transaction for atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Lock wallets in consistent order to prevent deadlocks
            var (subscriberWallet, tipsterWallet) = await WalletOperations.LockWalletsInOrderAsync(
                _context, subscriberId, tipsterId);

            if (subscriberWallet == null)
            {
                return new SubscriptionResultDto(false, "Subscriber wallet not found", null, 0);
            }

            if (tipsterWallet == null)
            {
                return new SubscriptionResultDto(false, "Tipster wallet not found", null, subscriberWallet.BalanceCredits);
            }

            var availableBalance = subscriberWallet.BalanceCredits - subscriberWallet.LockedCredits;

            // Business rule: Sufficient credits
            if (availableBalance < priceCredits)
            {
                return new SubscriptionResultDto(false, "Insufficient credits", null, subscriberWallet.BalanceCredits);
            }

            // Calculate amounts using shared utility
            var (commissionCredits, tipsterCredits) = WalletOperations.CalculateCommission(priceCredits);

            // 3. Create or reactivate subscription record
            var now = DateTime.UtcNow;
            Subscription subscription;
            if (previousSubscription != null)
            {
                // Reactivate existing record
                previousSubscription.SubscriptionPlanId = planId;
                previousSubscription.PriceCredits = priceCredits;
                previousSubscription.CommissionCredits = commissionCredits;
                previousSubscription.StartDate = now;
                previousSubscription.EndDate = now.AddDays(durationDays);
                previousSubscription.Status = SubscriptionStatus.Active;
                previousSubscription.CancelledAt = null;
                previousSubscription.NotifiedExpiringJ3 = false;
                previousSubscription.NotifiedExpiringJ1 = false;
                previousSubscription.NotifiedExpired = false;
                subscription = previousSubscription;
            }
            else
            {
                subscription = new Subscription
                {
                    Id = Guid.NewGuid(),
                    SubscriberId = subscriberId,
                    TipsterId = tipsterId,
                    SubscriptionPlanId = planId,
                    PriceCredits = priceCredits,
                    CommissionCredits = commissionCredits,
                    StartDate = now,
                    EndDate = now.AddDays(durationDays),
                    Status = SubscriptionStatus.Active,
                    CreatedAt = now
                };
                _context.Subscriptions.Add(subscription);
            }

            // 4. Create subscriber transaction (SUBSCRIPTION_PURCHASE)
            var subscriberTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = subscriberWallet.Id,
                Type = TransactionType.SubscriptionPurchase,
                AmountCredits = -priceCredits,
                ReferenceId = subscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = now
            };
            _context.WalletTransactions.Add(subscriberTransaction);

            // 5. Create tipster transaction (SUBSCRIPTION_SALE)
            var tipsterTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = tipsterWallet.Id,
                Type = TransactionType.SubscriptionSale,
                AmountCredits = tipsterCredits,
                ReferenceId = subscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = now
            };
            _context.WalletTransactions.Add(tipsterTransaction);

            // 6. Create commission transaction
            var commissionTransaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = tipsterWallet.Id,
                Type = TransactionType.Commission,
                AmountCredits = -commissionCredits,
                ReferenceId = subscription.Id,
                Status = TransactionStatus.Completed,
                CreatedAt = now
            };
            _context.WalletTransactions.Add(commissionTransaction);

            // Save and commit
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Load subscriber info for response
            var subscriber = await _context.Users.FindAsync(subscriberId);

            var subscriptionDto = new SubscriptionDto(
                subscription.Id,
                subscriberId,
                subscriber?.Username ?? "Unknown",
                tipsterId,
                plan.Tipster?.Username ?? "Unknown",
                priceCredits,
                commissionCredits,
                subscription.StartDate,
                subscription.EndDate,
                subscription.Status.ToString(),
                subscription.CreatedAt
            );

            return new SubscriptionResultDto(true, "Subscription successful", subscriptionDto, subscriberWallet.BalanceCredits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Subscription operation failed");
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> UnsubscribeAsync(Guid subscriberId, Guid tipsterId)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active);

        if (subscription == null)
        {
            return false;
        }

        // Cancel subscription (no refund)
        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<SubscriptionDto>> GetMySubscriptionsAsync(Guid userId)
    {
        var subscriptions = await _context.Subscriptions
            .Include(s => s.Subscriber)
            .Include(s => s.Tipster)
            .Where(s => s.SubscriberId == userId && s.Status == SubscriptionStatus.Active && s.EndDate > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return subscriptions.Select(MapToDto);
    }

    public async Task<IEnumerable<SubscriptionDto>> GetMySubscribersAsync(Guid tipsterId)
    {
        var subscriptions = await _context.Subscriptions
            .Include(s => s.Subscriber)
            .Include(s => s.Tipster)
            .Where(s => s.TipsterId == tipsterId && s.Status == SubscriptionStatus.Active && s.EndDate > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return subscriptions.Select(MapToDto);
    }

    public async Task<bool> HasActiveSubscriptionAsync(Guid subscriberId, Guid tipsterId)
    {
        return await _context.Subscriptions
            .AnyAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > DateTime.UtcNow);
    }

    public async Task<SubscriptionStatusDto> GetSubscriptionStatusAsync(Guid subscriberId, Guid tipsterId)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > DateTime.UtcNow);

        if (subscription != null)
        {
            var remainingDays = (int)Math.Ceiling((subscription.EndDate - DateTime.UtcNow).TotalDays);
            return new SubscriptionStatusDto(true, subscription.EndDate, remainingDays);
        }

        // Check for expired or cancelled subscription
        var previousSub = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && (s.Status == SubscriptionStatus.Expired || s.Status == SubscriptionStatus.Cancelled));

        if (previousSub != null)
        {
            return new SubscriptionStatusDto(false, null, 0, WasSubscribed: true, PreviousEndDate: previousSub.EndDate);
        }

        return new SubscriptionStatusDto(false, null, 0);
    }

    public async Task<int> ExpireSubscriptionsAsync()
    {
        var now = DateTime.UtcNow;
        var expiredSubscriptions = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate <= now)
            .ToListAsync();

        foreach (var sub in expiredSubscriptions)
        {
            sub.Status = SubscriptionStatus.Expired;
        }

        if (expiredSubscriptions.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        return expiredSubscriptions.Count;
    }

    /// <summary>
    /// Initiate a Stripe-based subscription with a plan
    /// </summary>
    public async Task<PaymentIntentResultDto> InitiateSubscriptionWithPlanAsync(Guid subscriberId, Guid planId)
    {
        // Check consent first
        var hasConsent = await _consentService.HasConsentAsync(subscriberId, ConsentTypes.NoGuarantee);
        if (!hasConsent)
        {
            return new PaymentIntentResultDto(false, null, null, "Consentement requis");
        }

        // Fetch the subscription plan
        var plan = await _context.SubscriptionPlans
            .Include(p => p.Tipster)
            .FirstOrDefaultAsync(p => p.Id == planId && p.IsActive);

        if (plan == null)
        {
            return new PaymentIntentResultDto(false, null, null, "Plan introuvable ou inactif");
        }

        var tipsterId = plan.TipsterUserId;

        // Business rule: Cannot subscribe to yourself
        if (subscriberId == tipsterId)
        {
            return new PaymentIntentResultDto(false, null, null, "Impossible de s'abonner à soi-même");
        }

        // Check if already subscribed (active subscription)
        var existingSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && s.Status == SubscriptionStatus.Active
                && s.EndDate > DateTime.UtcNow);

        if (existingSubscription != null)
        {
            return new PaymentIntentResultDto(false, null, null, "Déjà abonné à ce tipster");
        }

        // Use EUR cents price
        var priceCents = plan.PriceCents;
        if (priceCents <= 0)
        {
            // Fallback to credits conversion if PriceCents not set (1 credit = 10 cents)
            priceCents = plan.PriceCredits * 10;
        }

        // Free plan - just subscribe directly without payment
        if (priceCents <= 0)
        {
            var result = await SubscribeWithPlanAsync(subscriberId, planId);
            return new PaymentIntentResultDto(result.Success, null, null, result.Message);
        }

        var commissionCents = (int)Math.Ceiling(priceCents * PlatformFeePercent);
        var tipsterAmountCents = priceCents - commissionCents;

        // Check for previous expired/cancelled subscription
        var previousSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId
                && s.TipsterId == tipsterId
                && (s.Status == SubscriptionStatus.Expired || s.Status == SubscriptionStatus.Cancelled));

        // Create pending subscription record
        var now = DateTime.UtcNow;
        Subscription subscription;
        if (previousSubscription != null)
        {
            // Reactivate existing record but keep as Pending
            previousSubscription.SubscriptionPlanId = planId;
            previousSubscription.PriceCents = priceCents;
            previousSubscription.CommissionCents = commissionCents;
            previousSubscription.TipsterAmountCents = tipsterAmountCents;
            // Legacy fields for backward compatibility
            previousSubscription.PriceCredits = priceCents / 10;
            previousSubscription.CommissionCredits = commissionCents / 10;
            previousSubscription.StartDate = now;
            previousSubscription.EndDate = now.AddDays(plan.DurationInDays);
            previousSubscription.Status = SubscriptionStatus.Pending;
            previousSubscription.CancelledAt = null;
            previousSubscription.NotifiedExpiringJ3 = false;
            previousSubscription.NotifiedExpiringJ1 = false;
            previousSubscription.NotifiedExpired = false;
            subscription = previousSubscription;
        }
        else
        {
            subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                SubscriberId = subscriberId,
                TipsterId = tipsterId,
                SubscriptionPlanId = planId,
                PriceCents = priceCents,
                CommissionCents = commissionCents,
                TipsterAmountCents = tipsterAmountCents,
                // Legacy fields for backward compatibility
                PriceCredits = priceCents / 10,
                CommissionCredits = commissionCents / 10,
                StartDate = now,
                EndDate = now.AddDays(plan.DurationInDays),
                Status = SubscriptionStatus.Pending,
                CreatedAt = now
            };
            _context.Subscriptions.Add(subscription);
        }

        await _context.SaveChangesAsync();

        // Create Stripe PaymentIntent
        var stripeResult = await _stripeService.CreatePaymentIntentAsync(
            subscriberId,
            tipsterId,
            priceCents,
            PaymentType.Subscription,
            subscription.Id,
            $"Abonnement: {plan.Title}"
        );

        if (stripeResult.Success && stripeResult.PaymentId.HasValue)
        {
            subscription.StripePaymentId = stripeResult.PaymentId;
            await _context.SaveChangesAsync();
        }
        else
        {
            // Remove failed subscription record
            if (previousSubscription == null)
            {
                _context.Subscriptions.Remove(subscription);
            }
            else
            {
                subscription.Status = SubscriptionStatus.Cancelled;
            }
            await _context.SaveChangesAsync();
        }

        return stripeResult;
    }

    /// <summary>
    /// Confirm a subscription after Stripe payment succeeded
    /// </summary>
    public async Task<SubscriptionResultDto> ConfirmSubscriptionAsync(Guid subscriptionId)
    {
        var subscription = await _context.Subscriptions
            .Include(s => s.StripePayment)
            .Include(s => s.Subscriber)
            .Include(s => s.Tipster)
            .FirstOrDefaultAsync(s => s.Id == subscriptionId);

        if (subscription == null)
        {
            return new SubscriptionResultDto(false, "Abonnement introuvable", null, 0);
        }

        if (subscription.StripePayment?.Status != StripePaymentStatus.Succeeded)
        {
            return new SubscriptionResultDto(false, "Paiement non confirmé", null, 0);
        }

        // Activate subscription
        subscription.Status = SubscriptionStatus.Active;
        await _context.SaveChangesAsync();

        var subscriptionDto = MapToDto(subscription);
        return new SubscriptionResultDto(true, "Abonnement activé", subscriptionDto, 0);
    }

    private static SubscriptionDto MapToDto(Subscription subscription)
    {
        return new SubscriptionDto(
            subscription.Id,
            subscription.SubscriberId,
            subscription.Subscriber?.Username ?? "Unknown",
            subscription.TipsterId,
            subscription.Tipster?.Username ?? "Unknown",
            subscription.PriceCredits,
            subscription.CommissionCredits,
            subscription.StartDate,
            subscription.EndDate,
            subscription.Status.ToString(),
            subscription.CreatedAt
        );
    }
}

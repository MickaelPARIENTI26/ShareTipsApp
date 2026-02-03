using Microsoft.EntityFrameworkCore;
using Stripe;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class StripeConnectService : IStripeConnectService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeConnectService> _logger;
    private const decimal PlatformFeePercent = 0.10m; // 10% commission
    private const int MinimumPayoutCents = 1000; // 10 EUR minimum

    public StripeConnectService(
        ApplicationDbContext context,
        IConfiguration config,
        ILogger<StripeConnectService> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    public async Task<OnboardingLinkDto> CreateConnectedAccountAsync(Guid userId, string email)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User not found");

        // Create Express account if not already done
        if (string.IsNullOrEmpty(user.StripeAccountId))
        {
            var accountOptions = new AccountCreateOptions
            {
                Type = "express",
                Country = "FR",
                Email = email,
                Capabilities = new AccountCapabilitiesOptions
                {
                    CardPayments = new AccountCapabilitiesCardPaymentsOptions { Requested = true },
                    Transfers = new AccountCapabilitiesTransfersOptions { Requested = true }
                },
                BusinessType = "individual",
                Metadata = new Dictionary<string, string> { { "user_id", userId.ToString() } }
            };

            var accountService = new AccountService();
            var account = await accountService.CreateAsync(accountOptions);

            user.StripeAccountId = account.Id;
            user.StripeOnboardingStatus = StripeOnboardingStatus.Pending;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created Stripe Connect account {AccountId} for user {UserId}", account.Id, userId);
        }

        // Create onboarding link
        var baseUrl = _config["App:BaseUrl"] ?? "https://sharetips.app";
        var linkOptions = new AccountLinkCreateOptions
        {
            Account = user.StripeAccountId,
            RefreshUrl = $"{baseUrl}/stripe/refresh",
            ReturnUrl = $"{baseUrl}/stripe/return",
            Type = "account_onboarding"
        };

        var linkService = new AccountLinkService();
        var accountLink = await linkService.CreateAsync(linkOptions);

        return new OnboardingLinkDto(accountLink.Url, accountLink.ExpiresAt);
    }

    public async Task<OnboardingLinkDto> RefreshAccountLinkAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User not found");

        if (string.IsNullOrEmpty(user.StripeAccountId))
            throw new InvalidOperationException("User has no Stripe account");

        var baseUrl = _config["App:BaseUrl"] ?? "https://sharetips.app";
        var linkOptions = new AccountLinkCreateOptions
        {
            Account = user.StripeAccountId,
            RefreshUrl = $"{baseUrl}/stripe/refresh",
            ReturnUrl = $"{baseUrl}/stripe/return",
            Type = "account_onboarding"
        };

        var linkService = new AccountLinkService();
        var accountLink = await linkService.CreateAsync(linkOptions);

        return new OnboardingLinkDto(accountLink.Url, accountLink.ExpiresAt);
    }

    public async Task<ConnectedAccountStatusDto> GetAccountStatusAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User not found");

        if (string.IsNullOrEmpty(user.StripeAccountId))
        {
            return new ConnectedAccountStatusDto(
                Status: "None",
                ChargesEnabled: false,
                PayoutsEnabled: false,
                RequirementsMessage: "Stripe account not created"
            );
        }

        var accountService = new AccountService();
        var account = await accountService.GetAsync(user.StripeAccountId);

        string? requirementsMessage = null;
        if (account.Requirements?.CurrentlyDue?.Count > 0)
        {
            requirementsMessage = $"Information required: {string.Join(", ", account.Requirements.CurrentlyDue)}";
        }

        return new ConnectedAccountStatusDto(
            Status: user.StripeOnboardingStatus.ToString(),
            ChargesEnabled: account.ChargesEnabled,
            PayoutsEnabled: account.PayoutsEnabled,
            RequirementsMessage: requirementsMessage
        );
    }

    public async Task UpdateAccountStatusFromWebhookAsync(string stripeAccountId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.StripeAccountId == stripeAccountId);

        if (user == null)
        {
            _logger.LogWarning("Received webhook for unknown Stripe account {AccountId}", stripeAccountId);
            return;
        }

        var accountService = new AccountService();
        var account = await accountService.GetAsync(stripeAccountId);

        if (account.ChargesEnabled && account.PayoutsEnabled)
        {
            user.StripeOnboardingStatus = StripeOnboardingStatus.Completed;
            _logger.LogInformation("User {UserId} completed Stripe onboarding", user.Id);
        }
        else if (account.DetailsSubmitted)
        {
            user.StripeOnboardingStatus = StripeOnboardingStatus.Pending;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<PaymentIntentResultDto> CreatePaymentIntentAsync(
        Guid buyerId,
        Guid sellerId,
        int amountCents,
        PaymentType type,
        Guid referenceId,
        string description)
    {
        var seller = await _context.Users.FindAsync(sellerId);

        if (seller?.StripeOnboardingStatus != StripeOnboardingStatus.Completed)
        {
            return new PaymentIntentResultDto(
                Success: false,
                ClientSecret: null,
                PaymentId: null,
                Message: "Le vendeur n'a pas configuré ses paiements Stripe"
            );
        }

        if (string.IsNullOrEmpty(seller.StripeAccountId))
        {
            return new PaymentIntentResultDto(
                Success: false,
                ClientSecret: null,
                PaymentId: null,
                Message: "Le vendeur n'a pas de compte Stripe"
            );
        }

        // Calculate commission (10%)
        var platformFeeCents = (int)Math.Ceiling(amountCents * PlatformFeePercent);
        var sellerAmountCents = amountCents - platformFeeCents;

        try
        {
            // Create PaymentIntent with automatic transfer
            var options = new PaymentIntentCreateOptions
            {
                Amount = amountCents,
                Currency = "eur",
                PaymentMethodTypes = new List<string> { "card" },
                TransferData = new PaymentIntentTransferDataOptions
                {
                    Destination = seller.StripeAccountId,
                    Amount = sellerAmountCents
                },
                Metadata = new Dictionary<string, string>
                {
                    { "buyer_id", buyerId.ToString() },
                    { "seller_id", sellerId.ToString() },
                    { "type", type.ToString() },
                    { "reference_id", referenceId.ToString() }
                },
                Description = description
            };

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            // Save to database
            var stripePayment = new StripePayment
            {
                Id = Guid.NewGuid(),
                BuyerId = buyerId,
                SellerId = sellerId,
                StripePaymentIntentId = paymentIntent.Id,
                AmountCents = amountCents,
                PlatformFeeCents = platformFeeCents,
                SellerAmountCents = sellerAmountCents,
                Type = type,
                ReferenceId = referenceId,
                Status = StripePaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.StripePayments.Add(stripePayment);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Created PaymentIntent {PaymentIntentId} for {Type} {ReferenceId}, amount: {Amount} cents",
                paymentIntent.Id, type, referenceId, amountCents);

            return new PaymentIntentResultDto(
                Success: true,
                ClientSecret: paymentIntent.ClientSecret,
                PaymentId: stripePayment.Id,
                Message: null
            );
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create PaymentIntent for {Type} {ReferenceId}", type, referenceId);
            return new PaymentIntentResultDto(
                Success: false,
                ClientSecret: null,
                PaymentId: null,
                Message: $"Erreur Stripe: {ex.Message}"
            );
        }
    }

    public async Task<bool> HandlePaymentSucceededAsync(string paymentIntentId)
    {
        var payment = await _context.StripePayments
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntentId);

        if (payment == null)
        {
            _logger.LogWarning("Payment not found for PaymentIntent {PaymentIntentId}", paymentIntentId);
            return false;
        }

        if (payment.Status == StripePaymentStatus.Succeeded)
        {
            _logger.LogInformation("Payment {PaymentId} already marked as succeeded", payment.Id);
            return true;
        }

        payment.Status = StripePaymentStatus.Succeeded;
        payment.CompletedAt = DateTime.UtcNow;

        // Credit tipster balance
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == payment.SellerId);
        if (wallet != null)
        {
            wallet.TipsterBalanceCents += payment.SellerAmountCents;
            wallet.TotalEarnedCents += payment.SellerAmountCents;
            wallet.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Payment {PaymentId} succeeded, credited {Amount} cents to seller {SellerId}",
            payment.Id, payment.SellerAmountCents, payment.SellerId);

        return true;
    }

    public async Task<bool> HandlePaymentFailedAsync(string paymentIntentId, string reason)
    {
        var payment = await _context.StripePayments
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntentId);

        if (payment == null)
        {
            _logger.LogWarning("Payment not found for PaymentIntent {PaymentIntentId}", paymentIntentId);
            return false;
        }

        payment.Status = StripePaymentStatus.Failed;
        payment.FailureReason = reason;
        await _context.SaveChangesAsync();

        _logger.LogWarning("Payment {PaymentId} failed: {Reason}", payment.Id, reason);

        return true;
    }

    public async Task<TipsterWalletDto> GetTipsterBalanceAsync(Guid tipsterId)
    {
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == tipsterId);

        if (wallet == null)
        {
            return new TipsterWalletDto(
                AvailableBalance: 0,
                PendingPayout: 0,
                TotalEarned: 0
            );
        }

        return new TipsterWalletDto(
            AvailableBalance: wallet.TipsterBalanceCents / 100m,
            PendingPayout: wallet.PendingPayoutCents / 100m,
            TotalEarned: wallet.TotalEarnedCents / 100m
        );
    }

    public async Task<PayoutResultDto> RequestPayoutAsync(Guid tipsterId, int? amountCents = null)
    {
        var user = await _context.Users.FindAsync(tipsterId);
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == tipsterId);

        if (user?.StripeOnboardingStatus != StripeOnboardingStatus.Completed)
        {
            return new PayoutResultDto(
                Success: false,
                Message: "Configurez d'abord vos paiements Stripe",
                Amount: null,
                PayoutId: null
            );
        }

        if (wallet == null)
        {
            return new PayoutResultDto(
                Success: false,
                Message: "Wallet non trouvé",
                Amount: null,
                PayoutId: null
            );
        }

        var amount = amountCents ?? wallet.TipsterBalanceCents;

        if (amount <= 0 || amount > wallet.TipsterBalanceCents)
        {
            return new PayoutResultDto(
                Success: false,
                Message: "Solde insuffisant",
                Amount: null,
                PayoutId: null
            );
        }

        if (amount < MinimumPayoutCents)
        {
            return new PayoutResultDto(
                Success: false,
                Message: "Minimum de retrait: 10 EUR",
                Amount: null,
                PayoutId: null
            );
        }

        try
        {
            // Create Stripe payout
            var options = new PayoutCreateOptions
            {
                Amount = amount,
                Currency = "eur",
                Metadata = new Dictionary<string, string> { { "tipster_id", tipsterId.ToString() } }
            };

            var service = new PayoutService();
            var payout = await service.CreateAsync(options, new RequestOptions
            {
                StripeAccount = user.StripeAccountId
            });

            // Save to database and update balance
            var stripePayout = new StripePayout
            {
                Id = Guid.NewGuid(),
                TipsterId = tipsterId,
                StripePayoutId = payout.Id,
                AmountCents = amount,
                Status = StripePayoutStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };
            _context.StripePayouts.Add(stripePayout);

            wallet.TipsterBalanceCents -= amount;
            wallet.PendingPayoutCents += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Created payout {PayoutId} for tipster {TipsterId}, amount: {Amount} cents",
                payout.Id, tipsterId, amount);

            return new PayoutResultDto(
                Success: true,
                Message: null,
                Amount: amount / 100m,
                PayoutId: payout.Id
            );
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Failed to create payout for tipster {TipsterId}", tipsterId);
            return new PayoutResultDto(
                Success: false,
                Message: $"Erreur Stripe: {ex.Message}",
                Amount: null,
                PayoutId: null
            );
        }
    }

    public async Task HandlePayoutWebhookAsync(string payoutId, string eventType)
    {
        var payout = await _context.StripePayouts
            .FirstOrDefaultAsync(p => p.StripePayoutId == payoutId);

        if (payout == null)
        {
            _logger.LogWarning("Payout not found for Stripe payout {PayoutId}", payoutId);
            return;
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == payout.TipsterId);

        switch (eventType)
        {
            case "payout.paid":
                payout.Status = StripePayoutStatus.Paid;
                payout.CompletedAt = DateTime.UtcNow;
                if (wallet != null)
                {
                    wallet.PendingPayoutCents -= payout.AmountCents;
                    wallet.UpdatedAt = DateTime.UtcNow;
                }
                _logger.LogInformation("Payout {PayoutId} completed successfully", payout.Id);
                break;

            case "payout.failed":
                payout.Status = StripePayoutStatus.Failed;
                payout.FailureReason = "Payout failed";
                if (wallet != null)
                {
                    // Return funds to available balance
                    wallet.PendingPayoutCents -= payout.AmountCents;
                    wallet.TipsterBalanceCents += payout.AmountCents;
                    wallet.UpdatedAt = DateTime.UtcNow;
                }
                _logger.LogWarning("Payout {PayoutId} failed", payout.Id);
                break;

            case "payout.canceled":
                payout.Status = StripePayoutStatus.Canceled;
                if (wallet != null)
                {
                    // Return funds to available balance
                    wallet.PendingPayoutCents -= payout.AmountCents;
                    wallet.TipsterBalanceCents += payout.AmountCents;
                    wallet.UpdatedAt = DateTime.UtcNow;
                }
                _logger.LogInformation("Payout {PayoutId} was canceled", payout.Id);
                break;
        }

        await _context.SaveChangesAsync();
    }
}

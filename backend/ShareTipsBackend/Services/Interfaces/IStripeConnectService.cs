using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IStripeConnectService
{
    // Onboarding tipster
    Task<OnboardingLinkDto> CreateConnectedAccountAsync(Guid userId, string email);
    Task<OnboardingLinkDto> RefreshAccountLinkAsync(Guid userId);
    Task<ConnectedAccountStatusDto> GetAccountStatusAsync(Guid userId);
    Task UpdateAccountStatusFromWebhookAsync(string stripeAccountId);

    // Payments
    Task<PaymentIntentResultDto> CreatePaymentIntentAsync(
        Guid buyerId,
        Guid sellerId,
        int amountCents,
        PaymentType type,
        Guid referenceId,
        string description);
    Task<bool> HandlePaymentSucceededAsync(string paymentIntentId);
    Task<bool> HandlePaymentFailedAsync(string paymentIntentId, string reason);

    // Tipster balance and payouts
    Task<TipsterWalletDto> GetTipsterBalanceAsync(Guid tipsterId);
    Task<PayoutResultDto> RequestPayoutAsync(Guid tipsterId, int? amountCents = null);
    Task HandlePayoutWebhookAsync(string payoutId, string status);
}

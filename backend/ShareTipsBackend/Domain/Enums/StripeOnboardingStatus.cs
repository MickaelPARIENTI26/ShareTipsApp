namespace ShareTipsBackend.Domain.Enums;

public enum StripeOnboardingStatus
{
    /// <summary>
    /// User has not started Stripe Connect onboarding
    /// </summary>
    None = 0,

    /// <summary>
    /// User has started onboarding but not completed it
    /// </summary>
    Pending = 1,

    /// <summary>
    /// User has completed Stripe Connect onboarding
    /// </summary>
    Completed = 2
}

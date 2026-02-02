using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class GiveConsentRequestValidator : AbstractValidator<GiveConsentRequest>
{
    private static readonly string[] ValidConsentTypes = { "terms", "privacy", "marketing", "data_processing" };

    public GiveConsentRequestValidator()
    {
        RuleFor(x => x.ConsentType)
            .NotEmpty().WithMessage("Consent type is required")
            .Must(BeValidConsentType).WithMessage($"Consent type must be one of: {string.Join(", ", ValidConsentTypes)}");
    }

    private static bool BeValidConsentType(string consentType)
    {
        return ValidConsentTypes.Contains(consentType, StringComparer.OrdinalIgnoreCase);
    }
}

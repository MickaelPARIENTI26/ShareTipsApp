using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class MarkReadDtoValidator : AbstractValidator<MarkReadDto>
{
    public MarkReadDtoValidator()
    {
        RuleFor(x => x.NotificationIds)
            .NotNull().WithMessage("NotificationIds is required")
            .NotEmpty().WithMessage("At least one notification ID is required")
            .Must(ids => ids.Length <= 100).WithMessage("Cannot mark more than 100 notifications at once");
    }
}

public class UpdateNotificationPreferencesDtoValidator : AbstractValidator<UpdateNotificationPreferencesDto>
{
    public UpdateNotificationPreferencesDtoValidator()
    {
        // Boolean fields don't need validation, but we keep the validator
        // for consistency and potential future rules
    }
}

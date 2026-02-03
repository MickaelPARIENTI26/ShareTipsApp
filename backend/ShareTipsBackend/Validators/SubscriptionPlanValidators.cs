using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class CreateSubscriptionPlanRequestValidator : AbstractValidator<CreateSubscriptionPlanRequest>
{
    public CreateSubscriptionPlanRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MinimumLength(3).WithMessage("Title must be at least 3 characters")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => x.Description != null);

        RuleFor(x => x.DurationInDays)
            .GreaterThan(0).WithMessage("Duration must be at least 1 day")
            .LessThanOrEqualTo(365).WithMessage("Duration must not exceed 365 days");

        RuleFor(x => x.PriceEur)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative")
            .LessThanOrEqualTo(1000m).WithMessage("Price must not exceed 1,000 EUR");
    }
}

public class UpdateSubscriptionPlanRequestValidator : AbstractValidator<UpdateSubscriptionPlanRequest>
{
    public UpdateSubscriptionPlanRequestValidator()
    {
        RuleFor(x => x.Title)
            .MinimumLength(3).WithMessage("Title must be at least 3 characters")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters")
            .When(x => x.Title != null);

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters")
            .When(x => x.Description != null);

        RuleFor(x => x.DurationInDays)
            .GreaterThan(0).WithMessage("Duration must be at least 1 day")
            .LessThanOrEqualTo(365).WithMessage("Duration must not exceed 365 days")
            .When(x => x.DurationInDays.HasValue);

        RuleFor(x => x.PriceEur)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative")
            .LessThanOrEqualTo(1000m).WithMessage("Price must not exceed 1,000 EUR")
            .When(x => x.PriceEur.HasValue);
    }
}

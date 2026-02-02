using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class CreateTicketDtoValidator : AbstractValidator<CreateTicketDto>
{
    public CreateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.PriceCredits)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative");

        RuleFor(x => x.ConfidenceIndex)
            .InclusiveBetween(1, 10).WithMessage("Confidence index must be between 1 and 10");

        RuleFor(x => x.Selections)
            .NotEmpty().WithMessage("At least one selection is required")
            .Must(s => s.Count <= 20).WithMessage("Maximum 20 selections allowed");

        RuleForEach(x => x.Selections).SetValidator(new CreateTicketSelectionDtoValidator());
    }
}

public class CreateTicketSelectionDtoValidator : AbstractValidator<CreateTicketSelectionDto>
{
    public CreateTicketSelectionDtoValidator()
    {
        RuleFor(x => x.MatchId)
            .NotEmpty().WithMessage("Match ID is required");

        RuleFor(x => x.Sport)
            .NotEmpty().WithMessage("Sport is required")
            .MaximumLength(50).WithMessage("Sport must not exceed 50 characters");

        RuleFor(x => x.MarketType)
            .NotEmpty().WithMessage("Market type is required")
            .MaximumLength(50).WithMessage("Market type must not exceed 50 characters");

        RuleFor(x => x.SelectionCode)
            .NotEmpty().WithMessage("Selection code is required")
            .MaximumLength(100).WithMessage("Selection code must not exceed 100 characters");

        RuleFor(x => x.Odds)
            .GreaterThan(1.0m).WithMessage("Odds must be greater than 1.0")
            .LessThanOrEqualTo(1000m).WithMessage("Odds must not exceed 1000");
    }
}

public class UpdateTicketDtoValidator : AbstractValidator<UpdateTicketDto>
{
    public UpdateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters")
            .When(x => x.Title != null);

        RuleFor(x => x.PriceCredits)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative")
            .When(x => x.PriceCredits.HasValue);

        RuleFor(x => x.ConfidenceIndex)
            .InclusiveBetween(1, 10).WithMessage("Confidence index must be between 1 and 10")
            .When(x => x.ConfidenceIndex.HasValue);

        RuleFor(x => x.Selections)
            .Must(s => s!.Count <= 20).WithMessage("Maximum 20 selections allowed")
            .When(x => x.Selections != null && x.Selections.Any());

        RuleForEach(x => x.Selections)
            .SetValidator(new CreateTicketSelectionDtoValidator())
            .When(x => x.Selections != null);
    }
}

using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class CreateWithdrawalRequestValidator : AbstractValidator<CreateWithdrawalRequest>
{
    public CreateWithdrawalRequestValidator()
    {
        RuleFor(x => x.AmountEur)
            .GreaterThan(0).WithMessage("Amount must be greater than 0")
            .LessThanOrEqualTo(100000).WithMessage("Amount must not exceed 100,000 EUR");
    }
}

public class ProcessWithdrawalRequestValidator : AbstractValidator<ProcessWithdrawalRequest>
{
    public ProcessWithdrawalRequestValidator()
    {
        RuleFor(x => x.AdminNotes)
            .MaximumLength(500).WithMessage("Admin notes must not exceed 500 characters")
            .When(x => x.AdminNotes != null);
    }
}

public class SubscribeRequestValidator : AbstractValidator<SubscribeRequest>
{
    public SubscribeRequestValidator()
    {
        RuleFor(x => x.TipsterId)
            .NotEmpty().WithMessage("Tipster ID is required");
    }
}

public class FavoriteToggleRequestValidator : AbstractValidator<FavoriteToggleRequest>
{
    public FavoriteToggleRequestValidator()
    {
        RuleFor(x => x.TicketId)
            .NotEmpty().WithMessage("Ticket ID is required");
    }
}

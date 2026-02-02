using FluentValidation;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Validators;

public class CreateWithdrawalRequestValidator : AbstractValidator<CreateWithdrawalRequest>
{
    public CreateWithdrawalRequestValidator()
    {
        RuleFor(x => x.AmountCredits)
            .GreaterThan(0).WithMessage("Amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Amount must not exceed 1,000,000 credits");
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
        RuleFor(x => x.PriceCredits)
            .GreaterThanOrEqualTo(0).WithMessage("Price must be 0 or greater")
            .LessThanOrEqualTo(100000).WithMessage("Price must not exceed 100,000 credits");
    }
}

public class CreditWalletRequestValidator : AbstractValidator<CreditWalletRequest>
{
    public CreditWalletRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Amount must not exceed 1,000,000 credits");

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Description must not exceed 255 characters")
            .When(x => x.Description != null);
    }
}

public class DebitWalletRequestValidator : AbstractValidator<DebitWalletRequest>
{
    public DebitWalletRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0")
            .LessThanOrEqualTo(1000000).WithMessage("Amount must not exceed 1,000,000 credits");

        RuleFor(x => x.Description)
            .MaximumLength(255).WithMessage("Description must not exceed 255 characters")
            .When(x => x.Description != null);
    }
}

public class DepositRequestValidator : AbstractValidator<DepositRequest>
{
    public DepositRequestValidator()
    {
        RuleFor(x => x.AmountEur)
            .GreaterThan(0).WithMessage("Amount must be greater than 0")
            .LessThanOrEqualTo(10000).WithMessage("Amount must not exceed 10,000 EUR");
    }
}

public class PurchaseTicketRequestValidator : AbstractValidator<PurchaseTicketRequest>
{
    public PurchaseTicketRequestValidator()
    {
        RuleFor(x => x.TicketId)
            .NotEmpty().WithMessage("Ticket ID is required");
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

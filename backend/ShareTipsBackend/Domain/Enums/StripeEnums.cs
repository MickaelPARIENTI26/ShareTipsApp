namespace ShareTipsBackend.Domain.Enums;

public enum StripePaymentStatus
{
    Pending,
    RequiresAction,
    Processing,
    Succeeded,
    Failed,
    Refunded
}

public enum StripePayoutStatus
{
    Pending,
    InTransit,
    Paid,
    Failed,
    Canceled
}

public enum PaymentType
{
    TicketPurchase,
    Subscription
}

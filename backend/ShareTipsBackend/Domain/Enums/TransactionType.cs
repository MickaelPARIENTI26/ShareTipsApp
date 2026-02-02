namespace ShareTipsBackend.Domain.Entities;

public enum TransactionType
{
    Deposit,
    Purchase,
    Sale,
    Commission,
    Win,
    WithdrawRequest,
    WithdrawApproved,
    WithdrawRejected,
    Refund,
    SubscriptionPurchase,
    SubscriptionSale
}

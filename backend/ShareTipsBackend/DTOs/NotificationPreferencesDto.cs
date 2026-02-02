namespace ShareTipsBackend.DTOs;

public record NotificationPreferencesDto(
    bool NewTicket,
    bool MatchStart,
    bool TicketResult,
    bool SubscriptionExpire
);

public record UpdateNotificationPreferencesDto(
    bool NewTicket,
    bool MatchStart,
    bool TicketResult,
    bool SubscriptionExpire
);

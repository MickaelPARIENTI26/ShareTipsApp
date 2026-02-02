namespace ShareTipsBackend.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string Username,
    int Credits,
    UserStatsDto? Stats
);

public record UserStatsDto(
    int TicketsCreated,
    int TicketsSold,
    decimal Roi,
    decimal AvgOdds,
    int FollowersCount
);

public record UserProfileDto(
    Guid Id,
    string Username,
    RankingDto? Ranking,
    UserStatsDto? Stats,
    int SubscriptionPriceCredits
);

public record RankingDto(
    int Daily,
    int Weekly,
    int Monthly
);

public record TipsterStatsDto(
    int TotalTicketsCreated,
    int TicketsSold,
    int UniqueBuyers,
    int WinningTickets,
    int LosingTickets,
    int PendingTickets,
    decimal WinRate,
    decimal WinLossRatio,
    decimal AverageOdds,
    decimal? AverageWinningOdds,
    decimal AverageConfidence,
    int RevenueGross,
    decimal RevenueNet,
    decimal? HighestWinningOdd,
    int LongestWinningStreak,
    int LongestLosingStreak
);

// GDPR Data Export DTOs
public record UserDataExportDto(
    UserPersonalDataDto PersonalData,
    WalletExportDto Wallet,
    List<TicketExportDto> TicketsCreated,
    List<PurchaseExportDto> Purchases,
    List<SubscriptionExportDto> Subscriptions,
    List<FollowExportDto> Following,
    List<FollowExportDto> Followers,
    List<ConsentExportDto> Consents,
    List<NotificationExportDto> Notifications,
    DateTime ExportedAt
);

public record UserPersonalDataDto(
    Guid Id,
    string Email,
    string Username,
    DateOnly DateOfBirth,
    bool IsVerified,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record WalletExportDto(
    int BalanceCredits,
    int LockedCredits,
    DateTime CreatedAt
);

public record TicketExportDto(
    Guid Id,
    string Title,
    decimal AvgOdds,
    int ConfidenceIndex,
    bool IsPublic,
    int PriceCredits,
    string Status,
    string Result,
    DateTime CreatedAt
);

public record PurchaseExportDto(
    Guid TicketId,
    string TicketTitle,
    string SellerUsername,
    int PriceCredits,
    DateTime PurchasedAt
);

public record SubscriptionExportDto(
    string TipsterUsername,
    int PriceCredits,
    DateTime StartDate,
    DateTime EndDate,
    string Status
);

public record FollowExportDto(
    string Username,
    DateTime FollowedAt
);

public record ConsentExportDto(
    string ConsentType,
    int Version,
    DateTime ConsentedAt
);

public record NotificationExportDto(
    string Type,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

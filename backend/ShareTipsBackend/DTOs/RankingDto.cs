namespace ShareTipsBackend.DTOs;

public record RankingEntryDto(
    int Rank,
    Guid UserId,
    string Username,
    decimal ROI,
    decimal WinRate,
    decimal AvgOdds,
    int TotalTickets,
    int WinCount,
    int LoseCount
);

public record RankingResponseDto(
    string Period,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    IEnumerable<RankingEntryDto> Rankings
);

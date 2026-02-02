using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IRankingService
{
    Task<RankingResponseDto> GetRankingAsync(string period, int limit = 100);
}

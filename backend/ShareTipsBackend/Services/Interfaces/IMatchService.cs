using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IMatchService
{
    // Matches
    Task<IEnumerable<MatchListDto>> GetUpcomingMatchesAsync(string? sportCode = null, Guid? leagueId = null, int days = 7);
    Task<MatchDto?> GetMatchByIdAsync(Guid id);
    Task<MatchDto> CreateMatchAsync(CreateMatchRequest request);
    Task<MatchDto?> UpdateMatchAsync(Guid id, UpdateMatchRequest request);
    Task<bool> DeleteMatchAsync(Guid id);

    // Markets
    Task<MarketDto> CreateMarketAsync(CreateMarketRequest request);
    Task<bool> UpdateOddsAsync(UpdateOddsRequest request);
    Task<bool> DeleteMarketAsync(Guid id);
}

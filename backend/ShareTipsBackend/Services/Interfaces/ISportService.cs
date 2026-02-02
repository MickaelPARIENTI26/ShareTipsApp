using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface ISportService
{
    // Sports
    Task<IEnumerable<SportDto>> GetAllSportsAsync();
    Task<SportDto?> GetSportByCodeAsync(string code);
    Task<SportDto> CreateSportAsync(CreateSportRequest request);
    Task<SportDto?> UpdateSportAsync(string code, UpdateSportRequest request);
    Task<bool> DeleteSportAsync(string code);

    // Leagues
    Task<IEnumerable<LeagueDto>> GetAllLeaguesAsync(string? sportCode = null);
    Task<LeagueDto?> GetLeagueByIdAsync(Guid id);
    Task<LeagueDto> CreateLeagueAsync(CreateLeagueRequest request);
    Task<LeagueDto?> UpdateLeagueAsync(Guid id, UpdateLeagueRequest request);
    Task<bool> DeleteLeagueAsync(Guid id);

    // Teams
    Task<IEnumerable<TeamDto>> GetAllTeamsAsync(string? sportCode = null);
    Task<TeamDto?> GetTeamByIdAsync(Guid id);
    Task<TeamDto> CreateTeamAsync(CreateTeamRequest request);
    Task<TeamDto?> UpdateTeamAsync(Guid id, UpdateTeamRequest request);
    Task<bool> DeleteTeamAsync(Guid id);

    // Players
    Task<IEnumerable<PlayerDto>> GetAllPlayersAsync(Guid? teamId = null);
    Task<PlayerDto?> GetPlayerByIdAsync(Guid id);
    Task<PlayerDto> CreatePlayerAsync(CreatePlayerRequest request);
    Task<PlayerDto?> UpdatePlayerAsync(Guid id, UpdatePlayerRequest request);
    Task<bool> DeletePlayerAsync(Guid id);
}

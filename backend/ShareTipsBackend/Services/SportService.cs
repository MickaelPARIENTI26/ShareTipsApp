using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class SportService : ISportService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;

    public SportService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    #region Sports

    public async Task<IEnumerable<SportDto>> GetAllSportsAsync()
    {
        return await _cache.GetOrCreateAsync(
            CacheKeys.AllSports,
            async () => await _context.Sports
                .Select(s => new SportDto(s.Code, s.Name, s.IsActive))
                .ToListAsync(),
            CacheKeys.ReferenceDataTtl);
    }

    public async Task<SportDto?> GetSportByCodeAsync(string code)
    {
        var sport = await _context.Sports.FindAsync(code);
        return sport == null ? null : new SportDto(sport.Code, sport.Name, sport.IsActive);
    }

    public async Task<SportDto> CreateSportAsync(CreateSportRequest request)
    {
        var sport = new Sport
        {
            Code = request.Code.ToUpperInvariant(),
            Name = request.Name,
            IsActive = true
        };

        _context.Sports.Add(sport);
        await _context.SaveChangesAsync();

        // Invalidate sports cache
        _cache.Remove(CacheKeys.AllSports);

        return new SportDto(sport.Code, sport.Name, sport.IsActive);
    }

    public async Task<SportDto?> UpdateSportAsync(string code, UpdateSportRequest request)
    {
        var sport = await _context.Sports.FindAsync(code);
        if (sport == null) return null;

        sport.Name = request.Name;
        sport.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        // Invalidate sports cache
        _cache.Remove(CacheKeys.AllSports);

        return new SportDto(sport.Code, sport.Name, sport.IsActive);
    }

    public async Task<bool> DeleteSportAsync(string code)
    {
        var sport = await _context.Sports.FindAsync(code);
        if (sport == null) return false;

        _context.Sports.Remove(sport);
        await _context.SaveChangesAsync();

        // Invalidate sports cache
        _cache.Remove(CacheKeys.AllSports);

        return true;
    }

    #endregion

    #region Leagues

    public async Task<IEnumerable<LeagueDto>> GetAllLeaguesAsync(string? sportCode = null)
    {
        // Cache per sport code (or "all" if no filter)
        var cacheKey = string.IsNullOrEmpty(sportCode)
            ? "leagues:all"
            : CacheKeys.LeaguesBySport(sportCode.ToUpperInvariant());

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var query = _context.Leagues.AsQueryable();

                if (!string.IsNullOrEmpty(sportCode))
                    query = query.Where(l => l.SportCode == sportCode.ToUpperInvariant());

                return await query
                    .Where(l => l.IsActive)
                    .Select(l => new LeagueDto(l.Id, l.SportCode, l.Name, l.Country, l.LogoUrl, l.IsActive))
                    .ToListAsync();
            },
            CacheKeys.ReferenceDataTtl);
    }

    public async Task<LeagueDto?> GetLeagueByIdAsync(Guid id)
    {
        var league = await _context.Leagues.FindAsync(id);
        return league == null ? null : new LeagueDto(league.Id, league.SportCode, league.Name, league.Country, league.LogoUrl, league.IsActive);
    }

    public async Task<LeagueDto> CreateLeagueAsync(CreateLeagueRequest request)
    {
        var league = new League
        {
            Id = Guid.NewGuid(),
            SportCode = request.SportCode.ToUpperInvariant(),
            Name = request.Name,
            Country = request.Country,
            LogoUrl = request.LogoUrl,
            IsActive = true
        };

        _context.Leagues.Add(league);
        await _context.SaveChangesAsync();

        // Invalidate leagues cache
        _cache.RemoveByPrefix("leagues:");

        return new LeagueDto(league.Id, league.SportCode, league.Name, league.Country, league.LogoUrl, league.IsActive);
    }

    public async Task<LeagueDto?> UpdateLeagueAsync(Guid id, UpdateLeagueRequest request)
    {
        var league = await _context.Leagues.FindAsync(id);
        if (league == null) return null;

        if (request.Name != null) league.Name = request.Name;
        if (request.Country != null) league.Country = request.Country;
        if (request.LogoUrl != null) league.LogoUrl = request.LogoUrl;
        if (request.IsActive.HasValue) league.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        // Invalidate leagues cache
        _cache.RemoveByPrefix("leagues:");

        return new LeagueDto(league.Id, league.SportCode, league.Name, league.Country, league.LogoUrl, league.IsActive);
    }

    public async Task<bool> DeleteLeagueAsync(Guid id)
    {
        var league = await _context.Leagues.FindAsync(id);
        if (league == null) return false;

        _context.Leagues.Remove(league);
        await _context.SaveChangesAsync();

        // Invalidate leagues cache
        _cache.RemoveByPrefix("leagues:");

        return true;
    }

    #endregion

    #region Teams

    public async Task<IEnumerable<TeamDto>> GetAllTeamsAsync(string? sportCode = null)
    {
        // Cache per sport code (or "all" if no filter)
        var cacheKey = string.IsNullOrEmpty(sportCode)
            ? "teams:all"
            : $"teams:sport:{sportCode.ToUpperInvariant()}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var query = _context.Teams.AsQueryable();

                if (!string.IsNullOrEmpty(sportCode))
                    query = query.Where(t => t.SportCode == sportCode.ToUpperInvariant());

                return await query
                    .Where(t => t.IsActive)
                    .Select(t => new TeamDto(t.Id, t.SportCode, t.Name, t.ShortName, t.LogoUrl, t.Country, t.IsActive))
                    .ToListAsync();
            },
            CacheKeys.ReferenceDataTtl);
    }

    public async Task<TeamDto?> GetTeamByIdAsync(Guid id)
    {
        var team = await _context.Teams.FindAsync(id);
        return team == null ? null : new TeamDto(team.Id, team.SportCode, team.Name, team.ShortName, team.LogoUrl, team.Country, team.IsActive);
    }

    public async Task<TeamDto> CreateTeamAsync(CreateTeamRequest request)
    {
        var team = new Team
        {
            Id = Guid.NewGuid(),
            SportCode = request.SportCode.ToUpperInvariant(),
            Name = request.Name,
            ShortName = request.ShortName,
            LogoUrl = request.LogoUrl,
            Country = request.Country,
            IsActive = true
        };

        _context.Teams.Add(team);
        await _context.SaveChangesAsync();

        // Invalidate teams cache
        _cache.RemoveByPrefix("teams:");

        return new TeamDto(team.Id, team.SportCode, team.Name, team.ShortName, team.LogoUrl, team.Country, team.IsActive);
    }

    public async Task<TeamDto?> UpdateTeamAsync(Guid id, UpdateTeamRequest request)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return null;

        if (request.Name != null) team.Name = request.Name;
        if (request.ShortName != null) team.ShortName = request.ShortName;
        if (request.LogoUrl != null) team.LogoUrl = request.LogoUrl;
        if (request.Country != null) team.Country = request.Country;
        if (request.IsActive.HasValue) team.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        // Invalidate teams cache
        _cache.RemoveByPrefix("teams:");

        return new TeamDto(team.Id, team.SportCode, team.Name, team.ShortName, team.LogoUrl, team.Country, team.IsActive);
    }

    public async Task<bool> DeleteTeamAsync(Guid id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return false;

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();

        // Invalidate teams cache
        _cache.RemoveByPrefix("teams:");

        return true;
    }

    #endregion

    #region Players

    public async Task<IEnumerable<PlayerDto>> GetAllPlayersAsync(Guid? teamId = null)
    {
        var query = _context.Players.Include(p => p.Team).AsQueryable();

        if (teamId.HasValue)
            query = query.Where(p => p.TeamId == teamId.Value);

        return await query
            .Where(p => p.IsActive)
            .Select(p => new PlayerDto(p.Id, p.TeamId, p.Team!.Name, p.Name, p.Position, p.JerseyNumber, p.IsActive))
            .ToListAsync();
    }

    public async Task<PlayerDto?> GetPlayerByIdAsync(Guid id)
    {
        var player = await _context.Players.Include(p => p.Team).FirstOrDefaultAsync(p => p.Id == id);
        return player == null ? null : new PlayerDto(player.Id, player.TeamId, player.Team!.Name, player.Name, player.Position, player.JerseyNumber, player.IsActive);
    }

    public async Task<PlayerDto> CreatePlayerAsync(CreatePlayerRequest request)
    {
        var team = await _context.Teams.FindAsync(request.TeamId);
        if (team == null) throw new ArgumentException("Team not found");

        var player = new Player
        {
            Id = Guid.NewGuid(),
            TeamId = request.TeamId,
            Name = request.Name,
            Position = request.Position,
            JerseyNumber = request.JerseyNumber,
            IsActive = true
        };

        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        return new PlayerDto(player.Id, player.TeamId, team.Name, player.Name, player.Position, player.JerseyNumber, player.IsActive);
    }

    public async Task<PlayerDto?> UpdatePlayerAsync(Guid id, UpdatePlayerRequest request)
    {
        var player = await _context.Players.Include(p => p.Team).FirstOrDefaultAsync(p => p.Id == id);
        if (player == null) return null;

        if (request.TeamId.HasValue) player.TeamId = request.TeamId.Value;
        if (request.Name != null) player.Name = request.Name;
        if (request.Position != null) player.Position = request.Position;
        if (request.JerseyNumber.HasValue) player.JerseyNumber = request.JerseyNumber.Value;
        if (request.IsActive.HasValue) player.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        var team = await _context.Teams.FindAsync(player.TeamId);
        return new PlayerDto(player.Id, player.TeamId, team!.Name, player.Name, player.Position, player.JerseyNumber, player.IsActive);
    }

    public async Task<bool> DeletePlayerAsync(Guid id)
    {
        var player = await _context.Players.FindAsync(id);
        if (player == null) return false;

        _context.Players.Remove(player);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion
}

namespace ShareTipsBackend.Services.Interfaces;

/// <summary>
/// Cache service interface for centralized caching operations
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Get a cached value or compute and cache it if not present
    /// </summary>
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null);

    /// <summary>
    /// Get a cached value
    /// </summary>
    T? Get<T>(string key);

    /// <summary>
    /// Set a cached value
    /// </summary>
    void Set<T>(string key, T value, TimeSpan? expiration = null);

    /// <summary>
    /// Remove a cached value
    /// </summary>
    void Remove(string key);

    /// <summary>
    /// Remove all cached values matching a prefix
    /// </summary>
    void RemoveByPrefix(string prefix);
}

/// <summary>
/// Cache key constants for consistent key naming
/// </summary>
public static class CacheKeys
{
    // Filter metadata - cached for 5 minutes
    public const string TicketFilterMeta = "ticket:filter:meta";
    public static readonly TimeSpan TicketFilterMetaTtl = TimeSpan.FromMinutes(5);

    // Tipster stats - cached for 5 minutes per tipster
    public static string TipsterStats(Guid tipsterId) => $"tipster:stats:{tipsterId}";
    public static readonly TimeSpan TipsterStatsTtl = TimeSpan.FromMinutes(5);

    // Rankings - cached for 5 minutes per period
    public static string Rankings(string period) => $"rankings:{period}";
    public static readonly TimeSpan RankingsTtl = TimeSpan.FromMinutes(5);

    // Sports/Leagues/Teams - cached for 1 hour
    public const string AllSports = "sports:all";
    public static string LeaguesBySport(string sportCode) => $"leagues:{sportCode}";
    public static string TeamsByLeague(Guid leagueId) => $"teams:{leagueId}";
    public static readonly TimeSpan ReferenceDataTtl = TimeSpan.FromHours(1);

    // User profile - cached for 2 minutes
    public static string UserProfile(Guid userId) => $"user:profile:{userId}";
    public static readonly TimeSpan UserProfileTtl = TimeSpan.FromMinutes(2);
}

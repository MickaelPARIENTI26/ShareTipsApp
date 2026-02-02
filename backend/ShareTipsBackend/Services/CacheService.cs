using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

/// <summary>
/// In-memory cache service implementation using IMemoryCache
/// </summary>
public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CacheService> _logger;

    // Track keys for prefix-based removal (IMemoryCache doesn't support this natively)
    private readonly ConcurrentDictionary<string, byte> _keys = new();

    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(5);

    public CacheService(IMemoryCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        if (_cache.TryGetValue(key, out T? cachedValue) && cachedValue is not null)
        {
            _logger.LogDebug("Cache HIT for key: {CacheKey}", key);
            return cachedValue;
        }

        _logger.LogDebug("Cache MISS for key: {CacheKey}", key);

        var value = await factory();

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration,
            Size = 1 // Each entry counts as 1 unit
        };

        // Register callback to remove key from tracking on eviction
        options.RegisterPostEvictionCallback((evictedKey, _, _, _) =>
        {
            _keys.TryRemove(evictedKey.ToString()!, out _);
        });

        _cache.Set(key, value, options);
        _keys.TryAdd(key, 0);

        return value;
    }

    public T? Get<T>(string key)
    {
        if (_cache.TryGetValue(key, out T? value))
        {
            _logger.LogDebug("Cache HIT for key: {CacheKey}", key);
            return value;
        }

        _logger.LogDebug("Cache MISS for key: {CacheKey}", key);
        return default;
    }

    public void Set<T>(string key, T value, TimeSpan? expiration = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration,
            Size = 1
        };

        options.RegisterPostEvictionCallback((evictedKey, _, _, _) =>
        {
            _keys.TryRemove(evictedKey.ToString()!, out _);
        });

        _cache.Set(key, value, options);
        _keys.TryAdd(key, 0);

        _logger.LogDebug("Cache SET for key: {CacheKey}, TTL: {Ttl}", key, expiration ?? DefaultExpiration);
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        _keys.TryRemove(key, out _);

        _logger.LogDebug("Cache REMOVE for key: {CacheKey}", key);
    }

    public void RemoveByPrefix(string prefix)
    {
        var keysToRemove = _keys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();

        foreach (var key in keysToRemove)
        {
            _cache.Remove(key);
            _keys.TryRemove(key, out _);
        }

        _logger.LogDebug("Cache REMOVE by prefix: {Prefix}, removed {Count} keys", prefix, keysToRemove.Count);
    }
}

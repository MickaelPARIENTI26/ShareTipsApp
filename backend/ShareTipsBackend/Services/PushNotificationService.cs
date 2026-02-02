using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class PushNotificationService : IPushNotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly bool _isEnabled;
    private static bool _firebaseInitialized;
    private static readonly object _initLock = new();

    public PushNotificationService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _context = context;
        _logger = logger;

        // Firebase est activé si le fichier de credentials existe
        var credentialsPath = configuration["Firebase:CredentialsPath"];
        _isEnabled = !string.IsNullOrEmpty(credentialsPath) && File.Exists(credentialsPath);

        if (_isEnabled)
        {
            InitializeFirebase(credentialsPath!);
        }
        else
        {
            _logger.LogWarning("Push notifications disabled (Firebase credentials not configured)");
        }
    }

    private void InitializeFirebase(string credentialsPath)
    {
        lock (_initLock)
        {
            if (_firebaseInitialized) return;

            try
            {
                FirebaseApp.Create(new AppOptions
                {
                    Credential = GoogleCredential.FromFile(credentialsPath)
                });
                _firebaseInitialized = true;
                _logger.LogInformation("Firebase initialized successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Firebase");
            }
        }
    }

    public async Task<bool> RegisterDeviceTokenAsync(
        Guid userId,
        string token,
        string platform,
        string? deviceId = null,
        string? deviceName = null)
    {
        try
        {
            // Chercher un token existant avec le même token ou deviceId
            var existingToken = await _context.DeviceTokens
                .FirstOrDefaultAsync(t =>
                    t.Token == token ||
                    (t.UserId == userId && t.DeviceId == deviceId && deviceId != null));

            if (existingToken != null)
            {
                // Mettre à jour le token existant
                existingToken.Token = token;
                existingToken.Platform = platform;
                existingToken.DeviceId = deviceId;
                existingToken.DeviceName = deviceName;
                existingToken.LastUsedAt = DateTime.UtcNow;
                existingToken.IsActive = true;

                // Si le token appartenait à un autre user, le réassigner
                if (existingToken.UserId != userId)
                {
                    existingToken.UserId = userId;
                }
            }
            else
            {
                // Créer un nouveau token
                var deviceToken = new DeviceToken
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Token = token,
                    Platform = platform,
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };
                _context.DeviceTokens.Add(deviceToken);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Device token registered for user {UserId}, platform {Platform}", userId, platform);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register device token for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> UnregisterDeviceTokenAsync(Guid userId, string token)
    {
        try
        {
            var deviceToken = await _context.DeviceTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Token == token);

            if (deviceToken != null)
            {
                _context.DeviceTokens.Remove(deviceToken);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Device token unregistered for user {UserId}", userId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unregister device token for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> UnregisterDeviceAsync(Guid userId, string deviceId)
    {
        try
        {
            var tokens = await _context.DeviceTokens
                .Where(t => t.UserId == userId && t.DeviceId == deviceId)
                .ToListAsync();

            if (tokens.Count > 0)
            {
                _context.DeviceTokens.RemoveRange(tokens);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Removed {Count} tokens for device {DeviceId}", tokens.Count, deviceId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unregister device {DeviceId} for user {UserId}", deviceId, userId);
            return false;
        }
    }

    public async Task<int> SendToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
    {
        var tokens = await _context.DeviceTokens
            .Where(t => t.UserId == userId && t.IsActive)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            _logger.LogDebug("No active device tokens for user {UserId}", userId);
            return 0;
        }

        return await SendToTokensAsync(tokens, title, body, data);
    }

    public async Task<int> SendToUsersAsync(IEnumerable<Guid> userIds, string title, string body, Dictionary<string, string>? data = null)
    {
        var userIdList = userIds.ToList();
        var tokens = await _context.DeviceTokens
            .Where(t => userIdList.Contains(t.UserId) && t.IsActive)
            .Select(t => t.Token)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            _logger.LogDebug("No active device tokens for {Count} users", userIdList.Count);
            return 0;
        }

        return await SendToTokensAsync(tokens, title, body, data);
    }

    public async Task<int> SendToTokensAsync(IEnumerable<string> tokens, string title, string body, Dictionary<string, string>? data = null)
    {
        if (!_isEnabled || !_firebaseInitialized)
        {
            _logger.LogWarning("Push notification skipped (Firebase not enabled). Title: {Title}", title);
            return 0;
        }

        var tokenList = tokens.ToList();
        if (tokenList.Count == 0) return 0;

        var successCount = 0;
        var invalidTokens = new List<string>();

        try
        {
            var message = new MulticastMessage
            {
                Tokens = tokenList,
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data,
                Android = new AndroidConfig
                {
                    Priority = Priority.High,
                    Notification = new AndroidNotification
                    {
                        Sound = "default",
                        ClickAction = "FLUTTER_NOTIFICATION_CLICK"
                    }
                },
                Apns = new ApnsConfig
                {
                    Aps = new Aps
                    {
                        Sound = "default",
                        Badge = 1
                    }
                }
            };

            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
            successCount = response.SuccessCount;

            // Collecter les tokens invalides
            for (int i = 0; i < response.Responses.Count; i++)
            {
                if (!response.Responses[i].IsSuccess)
                {
                    var error = response.Responses[i].Exception;
                    if (error?.MessagingErrorCode == MessagingErrorCode.Unregistered ||
                        error?.MessagingErrorCode == MessagingErrorCode.InvalidArgument)
                    {
                        invalidTokens.Add(tokenList[i]);
                    }
                    _logger.LogWarning("Failed to send to token: {Error}", error?.Message);
                }
            }

            _logger.LogInformation("Push sent: {Success}/{Total} successful. Title: {Title}",
                successCount, tokenList.Count, title);

            // Désactiver les tokens invalides
            if (invalidTokens.Count > 0)
            {
                await DeactivateInvalidTokensAsync(invalidTokens);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notifications");
        }

        return successCount;
    }

    private async Task DeactivateInvalidTokensAsync(List<string> invalidTokens)
    {
        try
        {
            await _context.DeviceTokens
                .Where(t => invalidTokens.Contains(t.Token))
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsActive, false));

            _logger.LogInformation("Deactivated {Count} invalid tokens", invalidTokens.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate invalid tokens");
        }
    }
}

namespace ShareTipsBackend.Services.Interfaces;

/// <summary>
/// Service d'envoi de notifications push via Firebase Cloud Messaging
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// Enregistre un token de notification pour un utilisateur
    /// </summary>
    Task<bool> RegisterDeviceTokenAsync(Guid userId, string token, string platform, string? deviceId = null, string? deviceName = null);

    /// <summary>
    /// Supprime un token de notification
    /// </summary>
    Task<bool> UnregisterDeviceTokenAsync(Guid userId, string token);

    /// <summary>
    /// Supprime tous les tokens d'un appareil
    /// </summary>
    Task<bool> UnregisterDeviceAsync(Guid userId, string deviceId);

    /// <summary>
    /// Envoie une notification push à un utilisateur
    /// </summary>
    Task<int> SendToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Envoie une notification push à plusieurs utilisateurs
    /// </summary>
    Task<int> SendToUsersAsync(IEnumerable<Guid> userIds, string title, string body, Dictionary<string, string>? data = null);

    /// <summary>
    /// Envoie une notification à tous les tokens d'une liste
    /// </summary>
    Task<int> SendToTokensAsync(IEnumerable<string> tokens, string title, string body, Dictionary<string, string>? data = null);
}

namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// Stocke les tokens de notification push (FCM/APNS) des appareils utilisateur
/// </summary>
public class DeviceToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>
    /// Token FCM (Firebase Cloud Messaging) ou Expo Push Token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Plateforme: ios, android, web
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// Identifiant unique de l'appareil (pour éviter les doublons)
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Nom/modèle de l'appareil (optionnel, pour debug)
    /// </summary>
    public string? DeviceName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Si false, le token est invalide (erreur FCM) et sera nettoyé
    /// </summary>
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
}

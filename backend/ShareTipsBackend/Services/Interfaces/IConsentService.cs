using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IConsentService
{
    /// <summary>
    /// Check if user has given consent of a specific type
    /// </summary>
    Task<bool> HasConsentAsync(Guid userId, string consentType);

    /// <summary>
    /// Get consent status for a user
    /// </summary>
    Task<ConsentStatusDto> GetConsentStatusAsync(Guid userId, string consentType);

    /// <summary>
    /// Record user consent
    /// </summary>
    Task<GiveConsentResponse> GiveConsentAsync(
        Guid userId,
        string consentType,
        string? ipAddress = null,
        string? userAgent = null);
}

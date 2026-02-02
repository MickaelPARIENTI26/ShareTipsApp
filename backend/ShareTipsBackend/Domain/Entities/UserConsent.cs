namespace ShareTipsBackend.Domain.Entities;

/// <summary>
/// Stores user consent for legal disclaimers.
/// Users must consent before purchasing tickets or subscribing to tipsters.
/// </summary>
public class UserConsent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>
    /// Type of consent given (e.g., "NoGuarantee")
    /// </summary>
    public string ConsentType { get; set; } = string.Empty;

    /// <summary>
    /// Version of the consent text accepted
    /// </summary>
    public int Version { get; set; } = 1;

    /// <summary>
    /// When the consent was given
    /// </summary>
    public DateTime ConsentedAt { get; set; }

    /// <summary>
    /// IP address at time of consent (for legal records)
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent at time of consent (for legal records)
    /// </summary>
    public string? UserAgent { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}

/// <summary>
/// Known consent types
/// </summary>
public static class ConsentTypes
{
    /// <summary>
    /// User understands that predictions do not guarantee results
    /// </summary>
    public const string NoGuarantee = "NoGuarantee";
}

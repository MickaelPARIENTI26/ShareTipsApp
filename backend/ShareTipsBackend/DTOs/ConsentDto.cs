namespace ShareTipsBackend.DTOs;

public record ConsentStatusDto(
    bool HasConsented,
    DateTime? ConsentedAt
);

public record GiveConsentRequest(
    string ConsentType
);

public record GiveConsentResponse(
    bool Success,
    string? Message,
    DateTime? ConsentedAt
);

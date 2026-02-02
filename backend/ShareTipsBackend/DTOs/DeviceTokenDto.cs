using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

public record RegisterDeviceTokenRequest(
    [Required] string Token,
    [Required] string Platform,
    string? DeviceId,
    string? DeviceName
);

public record UnregisterDeviceTokenRequest(
    [Required] string Token
);

public record DeviceTokenDto(
    Guid Id,
    string Token,
    string Platform,
    string? DeviceId,
    string? DeviceName,
    DateTime CreatedAt,
    DateTime? LastUsedAt,
    bool IsActive
);

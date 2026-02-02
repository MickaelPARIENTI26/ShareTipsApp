using System.ComponentModel.DataAnnotations;

namespace ShareTipsBackend.DTOs;

// Sport DTOs
public record SportDto(string Code, string Name, bool IsActive);

public record CreateSportRequest(
    [Required][MaxLength(50)] string Code,
    [Required] string Name
);

public record UpdateSportRequest(
    [Required] string Name,
    bool IsActive
);

// League DTOs
public record LeagueDto(
    Guid Id,
    string SportCode,
    string Name,
    string Country,
    string? LogoUrl,
    bool IsActive
);

public record CreateLeagueRequest(
    [Required] string SportCode,
    [Required] string Name,
    [Required] string Country,
    string? LogoUrl
);

public record UpdateLeagueRequest(
    string? Name,
    string? Country,
    string? LogoUrl,
    bool? IsActive
);

// Team DTOs
public record TeamDto(
    Guid Id,
    string SportCode,
    string Name,
    string? ShortName,
    string? LogoUrl,
    string? Country,
    bool IsActive
);

public record CreateTeamRequest(
    [Required] string SportCode,
    [Required] string Name,
    string? ShortName,
    string? LogoUrl,
    string? Country
);

public record UpdateTeamRequest(
    string? Name,
    string? ShortName,
    string? LogoUrl,
    string? Country,
    bool? IsActive
);

// Player DTOs
public record PlayerDto(
    Guid Id,
    Guid TeamId,
    string TeamName,
    string Name,
    string? Position,
    int? JerseyNumber,
    bool IsActive
);

public record CreatePlayerRequest(
    [Required] Guid TeamId,
    [Required] string Name,
    string? Position,
    int? JerseyNumber
);

public record UpdatePlayerRequest(
    Guid? TeamId,
    string? Name,
    string? Position,
    int? JerseyNumber,
    bool? IsActive
);

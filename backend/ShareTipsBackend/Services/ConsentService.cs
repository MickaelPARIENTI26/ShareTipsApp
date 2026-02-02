using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class ConsentService : IConsentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ConsentService> _logger;

    public ConsentService(
        ApplicationDbContext context,
        ILogger<ConsentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> HasConsentAsync(Guid userId, string consentType)
    {
        return await _context.UserConsents
            .AsNoTracking()
            .AnyAsync(c => c.UserId == userId && c.ConsentType == consentType);
    }

    public async Task<ConsentStatusDto> GetConsentStatusAsync(Guid userId, string consentType)
    {
        var consent = await _context.UserConsents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ConsentType == consentType);

        return new ConsentStatusDto(
            consent != null,
            consent?.ConsentedAt
        );
    }

    public async Task<GiveConsentResponse> GiveConsentAsync(
        Guid userId,
        string consentType,
        string? ipAddress = null,
        string? userAgent = null)
    {
        // Check if already consented
        var existing = await _context.UserConsents
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ConsentType == consentType);

        if (existing != null)
        {
            return new GiveConsentResponse(true, "Consent already given", existing.ConsentedAt);
        }

        // Record new consent
        var consent = new UserConsent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ConsentType = consentType,
            Version = 1,
            ConsentedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _context.UserConsents.Add(consent);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} gave consent for {ConsentType}",
            userId, consentType);

        return new GiveConsentResponse(true, null, consent.ConsentedAt);
    }
}

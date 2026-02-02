using Microsoft.EntityFrameworkCore;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services;
using Xunit;

namespace ShareTipsBackend.Tests.Services;

public class NotificationPreferencesServiceTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    // --- Tests for GetByUserIdAsync ---

    [Fact]
    public async Task GetByUserIdAsync_ShouldCreateDefaultPreferences_WhenNoneExist()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Act
        var result = await service.GetByUserIdAsync(userId);

        // Assert - all defaults should be true
        Assert.True(result.NewTicket);
        Assert.True(result.MatchStart);
        Assert.True(result.TicketResult);
        Assert.True(result.SubscriptionExpire);

        // Verify preferences were created in DB
        var dbPrefs = await context.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        Assert.NotNull(dbPrefs);
    }

    [Fact]
    public async Task GetByUserIdAsync_ShouldReturnExistingPreferences()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Create preferences with some disabled
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = false,
            MatchStart = true,
            TicketResult = false,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByUserIdAsync(userId);

        // Assert
        Assert.False(result.NewTicket);
        Assert.True(result.MatchStart);
        Assert.False(result.TicketResult);
        Assert.True(result.SubscriptionExpire);
    }

    // --- Tests for UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ShouldUpdateExistingPreferences()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // First get to create default preferences
        await service.GetByUserIdAsync(userId);

        // Act - update to disable some
        var dto = new UpdateNotificationPreferencesDto(
            NewTicket: false,
            MatchStart: false,
            TicketResult: true,
            SubscriptionExpire: false
        );
        var result = await service.UpdateAsync(userId, dto);

        // Assert
        Assert.False(result.NewTicket);
        Assert.False(result.MatchStart);
        Assert.True(result.TicketResult);
        Assert.False(result.SubscriptionExpire);

        // Verify in DB
        var dbPrefs = await context.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
        Assert.NotNull(dbPrefs);
        Assert.False(dbPrefs.NewTicket);
        Assert.False(dbPrefs.MatchStart);
        Assert.True(dbPrefs.TicketResult);
        Assert.False(dbPrefs.SubscriptionExpire);
    }

    [Fact]
    public async Task UpdateAsync_ShouldCreatePreferences_WhenNoneExist()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Act - update without first getting
        var dto = new UpdateNotificationPreferencesDto(
            NewTicket: false,
            MatchStart: true,
            TicketResult: false,
            SubscriptionExpire: true
        );
        var result = await service.UpdateAsync(userId, dto);

        // Assert
        Assert.False(result.NewTicket);
        Assert.True(result.MatchStart);
        Assert.False(result.TicketResult);
        Assert.True(result.SubscriptionExpire);
    }

    // --- Tests for IsEnabledAsync ---

    [Fact]
    public async Task IsEnabledAsync_ShouldReturnTrue_WhenNoPreferencesExist()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Act & Assert - all types should default to enabled
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.NewTicket));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.MatchStart));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.TicketWon));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.TicketLost));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.SubscriptionExpire));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.FollowNewTicket));
    }

    [Fact]
    public async Task IsEnabledAsync_ShouldReturnCorrectValue_WhenPreferencesExist()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = false,
            MatchStart = true,
            TicketResult = false,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act & Assert
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.NewTicket));
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.FollowNewTicket)); // Same as NewTicket
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.MatchStart));
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.TicketWon)); // Uses TicketResult
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.TicketLost)); // Uses TicketResult
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.SubscriptionExpire));
    }

    [Fact]
    public async Task IsEnabledAsync_FollowNewTicket_ShouldUseSameSettingAsNewTicket()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Enable NewTicket
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = true,
            MatchStart = false,
            TicketResult = false,
            SubscriptionExpire = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act & Assert - FollowNewTicket should mirror NewTicket
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.NewTicket));
        Assert.True(await service.IsEnabledAsync(userId, NotificationType.FollowNewTicket));
    }

    [Fact]
    public async Task IsEnabledAsync_TicketWonAndLost_ShouldUseSameSettingAsTicketResult()
    {
        // Arrange
        using var context = CreateContext();
        var service = new NotificationPreferencesService(context);
        var userId = Guid.NewGuid();

        // Disable TicketResult
        context.NotificationPreferences.Add(new NotificationPreferences
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            NewTicket = true,
            MatchStart = true,
            TicketResult = false,
            SubscriptionExpire = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // Act & Assert - TicketWon and TicketLost should both use TicketResult setting
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.TicketWon));
        Assert.False(await service.IsEnabledAsync(userId, NotificationType.TicketLost));
    }
}

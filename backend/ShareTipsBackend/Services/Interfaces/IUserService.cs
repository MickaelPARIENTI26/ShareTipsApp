using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Services.Interfaces;

public interface IUserService
{
    // GDPR
    Task<UserDataExportDto> ExportUserDataAsync(Guid userId);
    Task DeleteAccountAsync(Guid userId);
}

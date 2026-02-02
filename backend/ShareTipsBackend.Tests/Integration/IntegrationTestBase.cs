using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using ShareTipsBackend.Data;
using ShareTipsBackend.DTOs;

namespace ShareTipsBackend.Tests.Integration;

public abstract class IntegrationTestBase : IClassFixture<CustomWebApplicationFactory>, IDisposable
{
    protected readonly HttpClient Client;
    protected readonly CustomWebApplicationFactory Factory;
    private readonly IServiceScope _scope;
    protected readonly ApplicationDbContext DbContext;

    protected static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    protected static readonly DateOnly ValidDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-25));

    protected IntegrationTestBase(CustomWebApplicationFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
        _scope = factory.Services.CreateScope();
        DbContext = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    /// <summary>
    /// Register a new user and return the auth response
    /// </summary>
    protected async Task<AuthResponse> RegisterUserAsync(string email, string password, string username)
    {
        var request = new RegisterRequest(email, password, username, ValidDob);
        var response = await Client.PostAsJsonAsync("/api/auth/register", request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<AuthResponse>(content, JsonOptions)!;
    }

    /// <summary>
    /// Login and return the auth response
    /// </summary>
    protected async Task<AuthResponse> LoginUserAsync(string email, string password)
    {
        var request = new LoginRequest(email, password);
        var response = await Client.PostAsJsonAsync("/api/auth/login", request);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<AuthResponse>(content, JsonOptions)!;
    }

    /// <summary>
    /// Set the Authorization header with a Bearer token
    /// </summary>
    protected void SetAuthToken(string token)
    {
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Clear the Authorization header
    /// </summary>
    protected void ClearAuthToken()
    {
        Client.DefaultRequestHeaders.Authorization = null;
    }

    public void Dispose()
    {
        _scope.Dispose();
        Client.Dispose();
    }
}

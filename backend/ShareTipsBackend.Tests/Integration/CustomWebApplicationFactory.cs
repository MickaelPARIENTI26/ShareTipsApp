using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ShareTipsBackend.Data;

namespace ShareTipsBackend.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = "TestDb_" + Guid.NewGuid().ToString();

    static CustomWebApplicationFactory()
    {
        // Set required environment variables for testing
        Environment.SetEnvironmentVariable("JWT_SECRET", "TestSecretKeyForIntegrationTestsThatIsLongEnough123456789!");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "ShareTipsTests");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "ShareTipsTestClients");
        Environment.SetEnvironmentVariable("DATABASE_URL", "Host=localhost;Database=test;Username=test;Password=test");
        // Stripe test key (use a placeholder for testing - won't actually call Stripe)
        Environment.SetEnvironmentVariable("STRIPE_SECRET_KEY", "sk_test_placeholder_for_integration_tests");
        // Flag to tell Program.cs to skip database registration and disable rate limiting
        Environment.SetEnvironmentVariable("TESTING_ENVIRONMENT", "true");
        // Disable rate limiting in tests
        Environment.SetEnvironmentVariable("DISABLE_RATE_LIMITING", "true");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Add InMemory database for testing - this runs before Program.cs
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
        });
    }
}

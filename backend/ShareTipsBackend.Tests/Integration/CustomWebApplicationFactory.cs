using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
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
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove ALL DbContext-related registrations
            services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
            services.RemoveAll(typeof(ApplicationDbContext));

            // Add InMemory database for testing
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
        });
    }
}

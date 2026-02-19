using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ShareTipsBackend.Data;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using HealthChecks.NpgSql;
using Serilog;
using ShareTipsBackend.BackgroundServices;
using ShareTipsBackend.Services;
using ShareTipsBackend.Services.ExternalApis;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Middleware;
using DotNetEnv;
using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;

// Load environment variables from .env file
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
    Console.WriteLine("[Startup] Loaded environment variables from .env file");
}
else
{
    Console.WriteLine("[Startup] No .env file found, using system environment variables");
}

// Configure Serilog with structured logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Mvc", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Routing", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .Enrich.WithProperty("Application", "ShareTips")
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/sharetips-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        formatter: new Serilog.Formatting.Compact.CompactJsonFormatter(),
        path: "logs/sharetips-json-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Use Serilog
builder.Host.UseSerilog();

// Sentry - Error monitoring (skip in testing environment)
var sentryDsn = Environment.GetEnvironmentVariable("SENTRY_DSN");
var isTesting = Environment.GetEnvironmentVariable("TESTING_ENVIRONMENT") == "true";
if (!string.IsNullOrEmpty(sentryDsn) && !isTesting)
{
    builder.WebHost.UseSentry(options =>
    {
        options.Dsn = sentryDsn;
        options.Environment = builder.Environment.EnvironmentName;
        options.Release = "sharetips-api@1.0.0";
        options.TracesSampleRate = builder.Environment.IsProduction() ? 0.2 : 1.0;
        options.SendDefaultPii = false; // Don't send personal data
        options.AttachStacktrace = true;
        options.MaxBreadcrumbs = 50;

        // Filter out health check noise
        options.SetBeforeSend((sentryEvent, hint) =>
        {
            if (sentryEvent.Request?.Url?.Contains("/api/health") == true)
                return null;
            return sentryEvent;
        });
    });
    Log.Information("Sentry initialized for environment {Environment}", builder.Environment.EnvironmentName);
}
else if (!isTesting)
{
    Log.Warning("Sentry DSN not configured - error monitoring disabled");
}

// Build connection string from environment variables
var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "sharebet";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";

// Override configuration with environment variables if they exist
var jwtSecretEnv = Environment.GetEnvironmentVariable("JWT_SECRET");
var oddsApiKeyEnv = Environment.GetEnvironmentVariable("ODDS_API_KEY");

if (!string.IsNullOrEmpty(jwtSecretEnv))
    builder.Configuration["Jwt:Secret"] = jwtSecretEnv;
if (!string.IsNullOrEmpty(oddsApiKeyEnv))
    builder.Configuration["TheOddsApi:ApiKey"] = oddsApiKeyEnv;

// Database - PostgreSQL with EF Core (skip if in testing environment)
var isTestingEnvironment = Environment.GetEnvironmentVariable("TESTING_ENVIRONMENT") == "true";
if (!isTestingEnvironment)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// Stripe Configuration
var stripeSecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY");
if (!string.IsNullOrEmpty(stripeSecretKey))
{
    Stripe.StripeConfiguration.ApiKey = stripeSecretKey;
    Log.Information("Stripe API configured");
}
else
{
    Log.Warning("STRIPE_SECRET_KEY not configured - Stripe payments will be disabled");
}

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrEmpty(jwtSecret))
    throw new InvalidOperationException("JWT_SECRET environment variable is required. Set it in .env file or system environment.");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Ensure claims are mapped correctly (sub -> NameIdentifier)
    options.MapInboundClaims = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    options.AddPolicy("Production", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "https://sharetips.app" };
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
              .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));  // Cache preflight for 10 min
    });
});

// In-Memory Cache
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024; // Max 1024 cache entries
});
builder.Services.AddSingleton<ICacheService, CacheService>();

// Response Compression (Gzip + Brotli)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/javascript",
        "text/css",
        "text/html",
        "text/json",
        "text/plain"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.SmallestSize;
});

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISportService, SportService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IRankingService, RankingService>();
builder.Services.AddScoped<IWithdrawalService, WithdrawalService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IFollowService, FollowService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationPreferencesService, NotificationPreferencesService>();
builder.Services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
builder.Services.AddScoped<IAccessControlService, AccessControlService>();
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();
builder.Services.AddScoped<IStripeConnectService, StripeConnectService>();
builder.Services.AddScoped<IGamificationService, GamificationService>();

// The Odds API integration
builder.Services.Configure<TheOddsApiConfig>(
    builder.Configuration.GetSection(TheOddsApiConfig.SectionName));
builder.Services.AddHttpClient<TheOddsApiService>();
builder.Services.AddScoped<IOddsSyncService, OddsSyncService>();
// Keep mock as fallback for ISportsApiService interface
builder.Services.AddScoped<ISportsApiService, MockSportsApiService>();

// Background Services
builder.Services.AddHostedService<TicketLockingService>();
builder.Services.AddHostedService<MatchResultService>();
builder.Services.AddHostedService<SubscriptionExpirationService>();

// Rate Limiting (disabled in testing environment)
var disableRateLimiting = Environment.GetEnvironmentVariable("DISABLE_RATE_LIMITING") == "true";
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // When rate limiting is disabled, allow unlimited requests
    var permitLimit = disableRateLimiting ? int.MaxValue : 100;
    var authPermitLimit = disableRateLimiting ? int.MaxValue : 10;
    var financialPermitLimit = disableRateLimiting ? int.MaxValue : 20;
    var passwordResetPermitLimit = disableRateLimiting ? int.MaxValue : 5;

    // Global rate limit: 100 requests per minute per IP
    options.AddPolicy("fixed", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Strict rate limit for auth endpoints: 10 requests per minute
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = authPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Financial endpoints: 20 requests per minute per user
    options.AddPolicy("financial", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = financialPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Very strict rate limit for password reset: 5 requests per 15 minutes
    options.AddPolicy("password-reset", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = passwordResetPermitLimit,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0
            }));
});

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Health Checks
builder.Services.AddHttpClient(); // Required for OddsApiHealthCheck
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString,
        name: "postgresql",
        tags: new[] { "db", "sql", "postgresql" })
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(),
        tags: new[] { "self" })
    .AddCheck<ShareTipsBackend.HealthChecks.OddsApiHealthCheck>(
        "odds-api",
        tags: new[] { "external", "api" });

// Controllers
builder.Services.AddControllers();

// OpenAPI / Swagger with JWT support and XML documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "ShareTips API",
        Version = "v1",
        Description = "API pour l'application ShareTips - Plateforme de partage de pronostics sportifs",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "ShareTips Support",
            Email = "support@sharetips.app"
        }
    });

    // Include XML comments
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // JWT Authentication
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Entrez votre token JWT. Exemple: eyJhbGciOiJIUzI1NiIs..."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Order tags alphabetically
    options.OrderActionsBy(apiDesc => $"{apiDesc.ActionDescriptor.RouteValues["controller"]}_{apiDesc.HttpMethod}");
});

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbSeeder.SeedAsync(context);

    // Seed test data in development only - completely excluded from Release builds
#if DEBUG
    if (app.Environment.IsDevelopment())
    {
        await TestDataSeeder.SeedTestDataAsync(context);
        // Seed comprehensive mock data for demo/investor presentations
        await MockMatchDataSeeder.SeedMockDataAsync(context);
    }
#endif
}

// Sentry tracing (must be early for performance monitoring) - only if Sentry is configured
var sentryDsnForTracing = Environment.GetEnvironmentVariable("SENTRY_DSN");
var isTestingForTracing = Environment.GetEnvironmentVariable("TESTING_ENVIRONMENT") == "true";
if (!string.IsNullOrEmpty(sentryDsnForTracing) && !isTestingForTracing)
{
    app.UseSentryTracing();
}

// Response compression (must be early in pipeline)
app.UseResponseCompression();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "ShareTips API v1");
        options.RoutePrefix = string.Empty;
    });
}
else
{
    // HSTS - HTTP Strict Transport Security (production only)
    // Prevents downgrade attacks and cookie hijacking
    app.UseHsts();
}

app.UseHttpsRedirection();

// Security headers middleware
app.Use(async (context, next) =>
{
    // Prevent clickjacking attacks
    context.Response.Headers.Append("X-Frame-Options", "DENY");

    // Prevent MIME type sniffing
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

    // Control referrer information sent with requests
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    // Restrict browser features (camera, microphone, etc.)
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

    // Content Security Policy - restrict resource loading
    // For API-only backend, we don't serve HTML, but this adds defense in depth
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

    // Prevent caching of sensitive data
    if (context.Request.Path.StartsWithSegments("/api/auth") ||
        context.Request.Path.StartsWithSegments("/api/wallet"))
    {
        context.Response.Headers.Append("Cache-Control", "no-store, no-cache, must-revalidate");
        context.Response.Headers.Append("Pragma", "no-cache");
    }

    await next();
});

// Global exception handler - prevents stack trace leaks
app.UseGlobalExceptionHandler();

// Serilog request logging - logs HTTP requests with timing, status code, etc.
app.UseSerilogRequestLogging(options =>
{
    // Customize the message template
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";

    // Attach additional properties to the request completion event
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].FirstOrDefault());
        diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString());

        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.User.FindFirst("sub")?.Value;
            if (userId != null)
            {
                diagnosticContext.Set("UserId", userId);
            }
        }
    };

    // Don't log health check endpoints
    options.GetLevel = (httpContext, elapsed, ex) =>
    {
        if (httpContext.Request.Path.StartsWithSegments("/api/health"))
            return Serilog.Events.LogEventLevel.Verbose;

        if (ex != null)
            return Serilog.Events.LogEventLevel.Error;

        if (httpContext.Response.StatusCode >= 500)
            return Serilog.Events.LogEventLevel.Error;

        if (httpContext.Response.StatusCode >= 400)
            return Serilog.Events.LogEventLevel.Warning;

        return Serilog.Events.LogEventLevel.Information;
    };
});

// Use CORS - AllowAll for now (needed for ngrok/mobile testing)
// TODO: Switch to "Production" policy before deploying to production
app.UseCors("AllowAll");

// Rate limiting
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoints
app.MapHealthChecks("/api/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/api/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db"),
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/api/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("self"),
    ResponseWriter = WriteHealthCheckResponse
});

app.Run();

// Health check response writer
static Task WriteHealthCheckResponse(HttpContext context, Microsoft.Extensions.Diagnostics.HealthChecks.HealthReport report)
{
    context.Response.ContentType = "application/json";

    var response = new
    {
        status = report.Status.ToString(),
        totalDuration = report.TotalDuration.TotalMilliseconds,
        checks = report.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            duration = e.Value.Duration.TotalMilliseconds,
            description = e.Value.Description,
            exception = e.Value.Exception?.Message
        })
    };

    return context.Response.WriteAsJsonAsync(response);
}

// Make Program class accessible for integration tests
public partial class Program { }

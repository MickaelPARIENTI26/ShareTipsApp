using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace ShareTipsBackend.Middleware;

/// <summary>
/// Global exception handler middleware to prevent stack trace leaks
/// and provide consistent error responses.
/// </summary>
public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandler(
        RequestDelegate next,
        ILogger<GlobalExceptionHandler> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = MapException(exception);

        // Log the full exception for debugging (server-side only)
        _logger.LogError(exception,
            "Unhandled exception: {Message}. Request: {Method} {Path}",
            exception.Message,
            context.Request.Method,
            context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new ErrorResponse
        {
            Error = message,
            Errors = errors,
            // Only include details in development
            Details = _env.IsDevelopment() ? exception.Message : null,
            TraceId = context.TraceIdentifier
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await context.Response.WriteAsJsonAsync(response, options);
    }

    private static (HttpStatusCode StatusCode, string Message, Dictionary<string, string[]>? Errors) MapException(Exception exception)
    {
        return exception switch
        {
            // Validation errors (FluentValidation)
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                validationEx.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    )
            ),

            // Argument validation errors
            ArgumentException argEx => (
                HttpStatusCode.BadRequest,
                argEx.Message,
                null
            ),

            // Authentication errors
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "Authentication required",
                null
            ),

            // Not found errors
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "Resource not found",
                null
            ),

            // Conflict errors (duplicate key, etc.)
            DbUpdateException dbEx when IsDuplicateKeyException(dbEx) => (
                HttpStatusCode.Conflict,
                "A resource with this identifier already exists",
                null
            ),

            // Invalid operation (business logic errors)
            InvalidOperationException invalidOpEx => (
                HttpStatusCode.BadRequest,
                invalidOpEx.Message,
                null
            ),

            // Operation cancelled (client disconnected)
            OperationCanceledException => (
                HttpStatusCode.BadRequest,
                "Request was cancelled",
                null
            ),

            // All other exceptions - don't leak details
            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred. Please try again later.",
                null
            )
        };
    }

    private static bool IsDuplicateKeyException(DbUpdateException ex)
    {
        // Check for PostgreSQL unique constraint violation
        return ex.InnerException?.Message.Contains("duplicate key") == true ||
               ex.InnerException?.Message.Contains("unique constraint") == true ||
               ex.InnerException?.Message.Contains("23505") == true; // PostgreSQL error code
    }
}

public class ErrorResponse
{
    public required string Error { get; set; }
    public Dictionary<string, string[]>? Errors { get; set; }
    public string? Details { get; set; }
    public string? TraceId { get; set; }
}

/// <summary>
/// Extension method to register the middleware
/// </summary>
public static class GlobalExceptionHandlerExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandler>();
    }
}

using Meetly.Contract.DTOs.Common;
using Meetly.Service.Availability;
using Meetly.Service.EventScheduling;
using Meetly.Service.SuggestionSlots;

namespace Meetly.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AvailabilityException exception)
        {
            await WriteErrorAsync(context, exception.StatusCode, exception.Message);
        }
        catch (SuggestionException exception)
        {
            await WriteErrorAsync(context, exception.StatusCode, exception.Message);
        }
        catch (EventException exception)
        {
            await WriteErrorAsync(context, exception.StatusCode, exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled request failure for {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(ApiResponse<object?>.Failure(statusCode, message));
    }
}

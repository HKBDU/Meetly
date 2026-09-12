using System.Text.Json;
using Meetly.Contract.DTOs.Common;
using Meetly.Service.Availability;
using Meetly.Service.SuggestionSlots;

namespace Meetly.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
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
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await JsonSerializer.SerializeAsync(
            context.Response.Body,
            ApiResponse<object?>.Failure(statusCode, message));
    }
}

using System.Text.Json;
using Meetly.Contract.DTOs.Common;
using Meetly.Service.Availability;

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
            context.Response.StatusCode = exception.StatusCode;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object?>.Failure(
                exception.StatusCode,
                exception.Message);

            await JsonSerializer.SerializeAsync(context.Response.Body, response);
        }
    }
}

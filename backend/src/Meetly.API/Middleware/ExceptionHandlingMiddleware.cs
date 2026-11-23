using System.Text.Json;
using Meetly.Contract.DTOs.Common;
using Meetly.Service.Availability;
using Meetly.Service.EventScheduling;
using Meetly.Service.SuggestionSlots;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Meetly.API.Middleware;

/// <summary>Đổi mọi exception thành envelope `ApiResponse` để FE luôn đọc được `code`.</summary>
public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client đã huỷ request, không còn ai nhận response
        }
        catch (Exception exception)
        {
            var (statusCode, message) = Map(exception);
            if (statusCode >= 500)
                logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);

            if (context.Response.HasStarted)
                throw;

            await WriteErrorAsync(context, statusCode, message);
        }
    }

    private static (int StatusCode, string Message) Map(Exception exception) => exception switch
    {
        AvailabilityException e => (e.StatusCode, e.Message),
        SuggestionException e => (e.StatusCode, e.Message),
        EventException e => (e.StatusCode, e.Message),
        BadHttpRequestException e => (e.StatusCode, "Invalid request."),
        DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "The event was changed by someone else, please reload."),
        DbUpdateException { InnerException: PostgresException pg } => pg.SqlState switch
        {
            // Trùng unique, VD 2 người cùng lúc tạo cùng username
            PostgresErrorCodes.UniqueViolation => (StatusCodes.Status409Conflict, "This value already exists."),
            PostgresErrorCodes.CheckViolation or
            PostgresErrorCodes.StringDataRightTruncation or
            PostgresErrorCodes.NotNullViolation => (StatusCodes.Status422UnprocessableEntity, "Invalid data."),
            _ => (StatusCodes.Status500InternalServerError, "Server error.")
        },
        _ => (StatusCodes.Status500InternalServerError, "Server error.")
    };

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await JsonSerializer.SerializeAsync(
            context.Response.Body,
            ApiResponse<object?>.Failure(statusCode, message),
            JsonOptions,
            context.RequestAborted);
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Meetly.API.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;

namespace Meetly.Api.Tests;

public class ApiPipelineTests
{
    private static WebApplicationFactory<Program> Factory() => new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
    {
        builder.UseEnvironment("Production");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            // Không có DB thật: request nào chạm DB sẽ lỗi, nhưng rate limit vẫn chạy trước đó
            ["ConnectionStrings:DefaultConnection"] = "Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none;Timeout=1",
            ["JwtOptions:Issuer"] = "issuer",
            ["JwtOptions:Audience"] = "audience",
            ["JwtOptions:SecretKey"] = "a-long-enough-test-secret-key-1234567890",
            ["JwtOptions:ExpirationMinutes"] = "60"
        }));
    });

    [Fact]
    public async Task CreateEvent_IsRateLimitedPerIp()
    {
        await using var factory = Factory();
        var client = factory.CreateClient();
        var body = new { title = "x", eventType = 2, availableWeekdays = new[] { 1 }, dailyStartTime = "09:00", dailyEndTime = "10:00", admin = new { username = "a", password = "1234" } };

        HttpStatusCode last = 0;
        for (var i = 0; i < 11; i++)
            last = (await client.PostAsJsonAsync("/api/v1/events", body)).StatusCode;

        Assert.Equal(HttpStatusCode.TooManyRequests, last);
    }

    [Fact]
    public async Task Swagger_IsDisabledOutsideDevelopment()
    {
        await using var factory = Factory();

        var response = await factory.CreateClient().GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(PostgresErrorCodes.UniqueViolation, 409)]
    [InlineData(PostgresErrorCodes.StringDataRightTruncation, 422)]
    public async Task Middleware_MapsDatabaseErrorsToEnvelope(string sqlState, int expectedStatus)
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new DbUpdateException("db", new PostgresException("boom", "ERROR", "ERROR", sqlState)),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        await middleware.InvokeAsync(context);

        Assert.Equal(expectedStatus, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        using var json = await JsonDocument.ParseAsync(context.Response.Body);
        Assert.False(json.RootElement.GetProperty("isSuccess").GetBoolean());
        Assert.Equal(expectedStatus, json.RootElement.GetProperty("code").GetInt32());
    }

    [Fact]
    public async Task Middleware_HidesUnexpectedErrorDetails()
    {
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidOperationException("secret internal detail"),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        context.Response.Body.Position = 0;
        Assert.DoesNotContain("secret internal detail", await new StreamReader(context.Response.Body).ReadToEndAsync());
    }
}

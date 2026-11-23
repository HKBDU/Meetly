using System.Text.Json;
using System.Threading.RateLimiting;
using Meetly.Contract.DTOs.Common;
using Microsoft.AspNetCore.RateLimiting;

namespace Meetly.API.Extensions;

/// <summary>
/// Giới hạn tần suất theo IP. Nếu chạy sau reverse proxy, bật `ForwardedHeaders:Enabled`
/// để IP lấy từ X-Forwarded-For, nếu không mọi request sẽ chung một IP của proxy.
/// </summary>
public static class RateLimitingExtensions
{
    /// <summary>Tạo event: chặn spam tạo hàng loạt event.</summary>
    public const string CreateEventPolicy = "create-event";

    /// <summary>Đăng nhập participant: chặn dò mật khẩu, tính theo IP + shortCode.</summary>
    public const string ParticipantAccessPolicy = "participant-access";

    /// <summary>Ghi dữ liệu đã đăng nhập (auto-save, finalize, sửa event).</summary>
    public const string WritePolicy = "write";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IServiceCollection AddMeetlyRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();

                context.HttpContext.Response.ContentType = "application/json";
                await JsonSerializer.SerializeAsync(
                    context.HttpContext.Response.Body,
                    ApiResponse<object?>.Failure(StatusCodes.Status429TooManyRequests, "Too many requests."),
                    JsonOptions,
                    cancellationToken);
            };

            // Trần chung cho mọi request (gồm cả GET event công khai, chặn dò shortCode)
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientIp(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 300,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

            options.AddPolicy(CreateEventPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientIp(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(10),
                    QueueLimit = 0
                }));

            options.AddPolicy(ParticipantAccessPolicy, context =>
            {
                var shortCode = context.GetRouteValue("shortCode")?.ToString()?.ToUpperInvariant() ?? string.Empty;
                return RateLimitPartition.GetFixedWindowLimiter($"{ClientIp(context)}:{shortCode}", _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                });
            });

            // Auto-save debounce 600ms nên 1 người kéo liên tục tối đa ~100 lần/phút
            options.AddPolicy(WritePolicy, context =>
                RateLimitPartition.GetSlidingWindowLimiter(ClientIp(context), _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueLimit = 0
                }));
        });

        return services;
    }

    private static string ClientIp(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

using Meetly.API.Extensions;
using Meetly.API.Hubs;
using Meetly.API.Middleware;
using Meetly.API.Realtime;
using Meetly.API.Serialization;
using Meetly.Repository;
using Meetly.Repository.Availability;
using Meetly.Repository.EventScheduling;
using Meetly.Repository.SuggestionSlots;
using Meetly.Service.Availability;
using Meetly.Service.Common;
using Meetly.Service.Email;
using Meetly.Service.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Meetly.Service.SuggestionSlots;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Chặn body quá lớn ngay ở Kestrel (payload hợp lệ lớn nhất là lịch rảnh, vài chục KB)
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = InputLimits.MaxRequestBodyBytes);

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter()));
var signalR = builder.Services.AddSignalR(options => options.MaximumReceiveMessageSize = 32 * 1024);
// Chạy nhiều instance thì cần backplane để broadcast tới client đang nối vào instance khác
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnection))
    signalR.AddStackExchangeRedis(redisConnection, options => options.Configuration.ChannelPrefix = RedisChannel.Literal("meetly"));

// JSON heatmap lặp nhiều tên người nên nén rất tốt
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "https://meetly-soon.vercel.app"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Chỉ tin X-Forwarded-For khi thật sự chạy sau proxy, nếu không client tự giả IP để né rate limit
var useForwardedHeaders = builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled");
if (useForwardedHeaders)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

builder.Services.AddMeetlyRateLimiting();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<AppOptions>(builder.Configuration.GetSection(AppOptions.SectionName));
builder.Services.Configure<ResendOptions>(builder.Configuration.GetSection("Resend"));
builder.Services.AddHttpClient<IEmailService, ResendEmailService>(client =>
{
    client.BaseAddress = new Uri("https://api.resend.com/");
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Pool tái dùng instance DbContext giữa các request (AppDbContext không giữ state riêng)
builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.")));
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

builder.Services.AddSingleton<HeatmapBroadcaster>();
builder.Services.AddSingleton<BackgroundEmailQueue>();
builder.Services.AddSingleton<IEmailQueue>(provider => provider.GetRequiredService<BackgroundEmailQueue>());
builder.Services.AddHostedService(provider => provider.GetRequiredService<BackgroundEmailQueue>());

builder.Services.AddJwtService(builder.Configuration);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerServices();
}

builder.Services.AddScoped<IAvailabilityRepository, AvailabilityRepository>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEventRealtimeNotifier, EventRealtimeNotifier>();
builder.Services.AddScoped<ISuggestionRepository, SuggestionRepository>();
builder.Services.AddScoped<ISuggestionService, SuggestionService>();

var app = builder.Build();

if (useForwardedHeaders)
    app.UseForwardedHeaders();

app.UseResponseCompression();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.XContentTypeOptions = "nosniff";
    headers.XFrameOptions = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<EventHub>("/hubs/events");
app.MapHealthChecks("/health").DisableRateLimiting();

app.MapGet("/", () => Results.Ok(new
{
    message = "Meetly API is running"
}));

app.Run();
public partial class Program;

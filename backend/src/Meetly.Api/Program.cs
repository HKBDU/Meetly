using Meetly.Api.Data;
using Meetly.Api.Hubs;
using Meetly.Api.Repositories;
using Meetly.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (PostgreSQL with EF Core)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MeetlyDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        options.UseNpgsql(connectionString);
    }
});

// 2. Repositories and Business Services (3-tier architecture)
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IEventService, EventService>();

// 3. Real-Time SignalR
builder.Services.AddSignalR();

// 4. Controllers and JSON Serialization
builder.Services.AddControllers();

// 5. OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 6. CORS for Frontend (Vite) & SignalR WebSockets
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("MeetlyCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// 7. Automatic DB initialization on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MeetlyDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (db.Database.IsRelational())
        {
            db.Database.EnsureCreated();
            logger.LogInformation("Database verified and ready.");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not automatically initialize PostgreSQL. Ensure database is running with 'docker compose up -d'.");
    }
}

// 8. HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("MeetlyCorsPolicy");

app.UseAuthorization();

app.MapControllers();

// 9. Map SignalR Hub
app.MapHub<MeetingHub>("/hubs/meeting");

app.Run();

// Make Program accessible to integration tests
public partial class Program { }

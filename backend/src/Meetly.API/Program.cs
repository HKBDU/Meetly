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
using Meetly.Service.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Meetly.Service.SuggestionSlots;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// TẠM THỜI cho FE local (Vite dev server) test API thật - xoá policy này khi
// có domain FE thật + cấu hình CORS đúng theo môi trường triển khai.
const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(
                  "http://localhost:5173", "http://127.0.0.1:5173",
                  "http://localhost:5174", "http://127.0.0.1:5174")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter()));
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.")));


//ết nối database(PostGreSQL)
builder.Services.AddJwtService(builder.Configuration);
builder.Services.AddSwaggerServices();


//Đăng kí Service (DI)
builder.Services.AddScoped<IAvailabilityRepository, AvailabilityRepository>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEventRealtimeNotifier, EventRealtimeNotifier>();
builder.Services.AddScoped<ISuggestionRepository, SuggestionRepository>();
builder.Services.AddScoped<ISuggestionService, SuggestionService>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(DevCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<EventHub>("/hubs/events");

app.Run();

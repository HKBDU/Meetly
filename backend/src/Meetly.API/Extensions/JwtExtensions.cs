using System.Security.Claims;
using System.Text;
using Meetly.Contract.DTOs.Common;
using Meetly.Service.JwtService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Meetly.API.Extensions;

public static class JwtExtensions
{
    public const string AdminPolicy = "AdminPolicy";
    public const string UserPolicy = "UserPolicy";

    public static void AddJwtService(this IServiceCollection services, IConfiguration configuration)
    {
        JwtOptions jwtOption = new JwtOptions();
        configuration.GetSection(nameof(JwtOptions)).Bind(jwtOption);
        if (jwtOption.SecretKey.Length < 32 || string.IsNullOrWhiteSpace(jwtOption.Issuer) || string.IsNullOrWhiteSpace(jwtOption.Audience))
            throw new InvalidOperationException("JwtOptions must include issuer, audience, and a secret key of at least 32 characters.");
        var key = Encoding.UTF8.GetBytes(jwtOption.SecretKey);

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken) &&
                            context.HttpContext.Request.Path.StartsWithSegments("/hubs/events"))
                            context.Token = accessToken;
                        return Task.CompletedTask;
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(ApiResponse<object?>.Failure(401, "Authentication is required."));
                    },
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(ApiResponse<object?>.Failure(403, "Admin access is required."));
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero,
                    ValidIssuer = jwtOption.Issuer,
                    ValidAudience = jwtOption.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role,
                };
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy(AdminPolicy, policy =>
                policy.RequireRole("Admin"));
            options.AddPolicy(UserPolicy, policy =>
                policy.RequireRole("User", "Admin"));
        });
    }
}

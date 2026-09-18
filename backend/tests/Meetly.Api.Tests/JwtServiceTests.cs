using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Meetly.Service.JwtService;
using Microsoft.Extensions.Configuration;

namespace Meetly.Api.Tests;

public class JwtServiceTests
{
    [Fact]
    public void GenerateAccessToken_UsesConfiguredExpiration()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtOptions:Issuer"] = "issuer",
            ["JwtOptions:Audience"] = "audience",
            ["JwtOptions:SecretKey"] = "a-long-enough-test-secret-key-12345",
            ["JwtOptions:ExpirationMinutes"] = "60"
        }).Build();

        var expires = new JwtSecurityTokenHandler().ReadJwtToken(
            new JwtService(config).GenerateAccessToken([new Claim("participantId", Guid.NewGuid().ToString())])).ValidTo;

        Assert.InRange(expires, DateTime.UtcNow.AddMinutes(59), DateTime.UtcNow.AddMinutes(61));
    }
}

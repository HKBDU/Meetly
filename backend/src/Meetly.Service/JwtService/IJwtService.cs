using System.Security.Claims;

namespace Meetly.Service.JwtService;

public interface IJwtService
{
    public string GenerateAccessToken(IEnumerable<Claim> claims);

    ClaimsPrincipal GetPrincipal(string token);
}

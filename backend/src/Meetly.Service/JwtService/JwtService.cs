using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Meetly.Service.JwtService;

public class JwtService : IJwtService
{

    private readonly JwtOptions _jwtOptions = new();

    public JwtService(IConfiguration configuration)
    {
        configuration.GetSection(nameof(JwtOptions)).Bind(_jwtOptions);
        //Ánh xạ du lieu tu Appsetings vào obj JwtOption
    }

    public string GenerateAccessToken(IEnumerable<Claim> claims)
    {
        var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        //tạo 1 key mã để mã hóa token, su dụng secretKey tu JwtOptions
        var signingCredentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);
        //Tạo 1 đối đượng SigningCredentials để xác định thuật toán mã hóa và key sử dụng để ki Token

        var takeOptions = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer, // token này được kí/ tạo ra bởi ai, tổ chức nào
            audience: _jwtOptions.Audience, // token này dành cho ai, tổ chức nào
            claims: claims,                 //những thông tin muốn lưu trữ trong token
            expires: DateTime.Now.AddMinutes(_jwtOptions.ExpiresMinutes), //token sẽ het han sau bao phut
            signingCredentials: signingCredentials
        );

        var token = new JwtSecurityTokenHandler().WriteToken(takeOptions);
        //Sau đó gọi JwtSecurityTokenHandler để tạo ra token dươi dạng chuỗi từ các thông tin đã cung cấp ở trên
        return token;
    }

    public ClaimsPrincipal GetPrincipal(string token)
    {
        throw new NotImplementedException();
    }
}

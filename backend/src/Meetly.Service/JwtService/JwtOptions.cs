using System.ComponentModel.DataAnnotations;

namespace Meetly.Service.JwtService;

public class JwtOptions
{
    [Required]
    public string Issuer { get; set; }
    [Required]
    public string Audience { get; set; }
    [Required]
    public string SecretKey { get; set; }
    [Required]
    public int ExpiresMinutes { get; set; }
}

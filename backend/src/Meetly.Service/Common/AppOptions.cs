namespace Meetly.Service.Common;

public sealed class AppOptions
{
    public const string SectionName = "App";

    /// <summary>URL gốc của FE, dùng để dựng link event trong response và email (VD: https://meetly-soon.vercel.app).</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    public string EventUrl(string shortCode) => $"{FrontendBaseUrl.TrimEnd('/')}/e/{shortCode}";
}

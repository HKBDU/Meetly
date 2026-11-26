using Meetly.Service.Email;
using Xunit;

namespace Meetly.Api.Tests;

public class FinalizedEmailTemplateTests
{
    private static FinalizedEmailModel Model(string? date = "2026-11-25", int? dayOfWeek = null) => new(
        "Team <dinner> & drinks", date, dayOfWeek, "09:45", "11:15", 4,
        "https://meetly-soon.vercel.app/e/ABC123", "https://meetly-soon.vercel.app/");

    [Fact]
    public void Specific_date_shows_weekday_date_time_and_duration()
    {
        var html = FinalizedEmailTemplate.Render(Model());

        Assert.Contains("Thứ Tư, 25/11/2026", html);
        Assert.Contains("09:45 – 11:15", html);
        Assert.Contains("1 giờ 30 phút", html);
        Assert.Contains("4 người", html);
        Assert.Contains("href=\"https://meetly-soon.vercel.app/e/ABC123\"", html);
        Assert.Contains("https://meetly-soon.vercel.app/meetly-logo.png", html);
    }

    [Fact]
    public void Weekly_event_shows_weekday_name()
    {
        var html = FinalizedEmailTemplate.Render(Model(date: null, dayOfWeek: 1));

        Assert.Contains("Thứ Hai", html);
        Assert.Contains("Hằng tuần", html);
    }

    [Fact]
    public void Event_title_is_html_encoded()
    {
        var html = FinalizedEmailTemplate.Render(Model());

        Assert.DoesNotContain("<dinner>", html);
        Assert.Contains("Team &lt;dinner&gt; &amp; drinks", html);
    }
}

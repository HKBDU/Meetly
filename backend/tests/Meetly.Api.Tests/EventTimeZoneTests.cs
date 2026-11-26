using Meetly.Service.EventScheduling;
using DayOfWeek = System.DayOfWeek;

namespace Meetly.Api.Tests;

public class EventTimeZoneTests
{
    private static CreateEventRequest Create(string? timeZone) => new()
    {
        Title = "Sync",
        EventType = 2,
        AvailableWeekdays = [DayOfWeek.Monday],
        DailyStartTime = new TimeOnly(9, 0),
        DailyEndTime = new TimeOnly(17, 0),
        TimeZone = timeZone,
        Admin = new AdminRequest { Username = "Host", Password = "secret" }
    };

    [Fact]
    public async Task Create_StoresTheCreatorsTimeZone()
    {
        var repo = new FakeEventRepository();

        await TestServices.EventService(repo).CreateAsync(Create("Asia/Tokyo"), CancellationToken.None);

        Assert.Equal("Asia/Tokyo", Assert.Single(repo.Events).TimeZone);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Mars/Olympus_Mons")]
    [InlineData("Asia/Ho_Chi_Minh/../../etc/passwd")]
    public async Task Create_FallsBackToVietnam_WhenTimeZoneIsMissingOrUnknown(string? timeZone)
    {
        var repo = new FakeEventRepository();

        await TestServices.EventService(repo).CreateAsync(Create(timeZone), CancellationToken.None);

        Assert.Equal("Asia/Ho_Chi_Minh", Assert.Single(repo.Events).TimeZone);
    }

    [Fact]
    public void Normalize_RejectsNamesLongerThanTheColumn()
    {
        Assert.Equal("Asia/Ho_Chi_Minh", EventService.NormalizeTimeZone(new string('A', 51)));
    }

    [Fact]
    public void Normalize_TrimsAndKeepsIanaNames()
    {
        Assert.Equal("America/New_York", EventService.NormalizeTimeZone("  America/New_York "));
    }

    [Fact]
    public void Normalize_ConvertsWindowsNamesToIana()
    {
        Assert.Equal("Asia/Bangkok", EventService.NormalizeTimeZone("SE Asia Standard Time"));
    }

    [Fact]
    public async Task Create_ReturnsTokenExpiryInUtc()
    {
        var response = await TestServices.EventService(new FakeEventRepository()).CreateAsync(Create(null), CancellationToken.None);

        Assert.Equal(TimeSpan.Zero, response.ExpiresAt.Offset);
    }
}

using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Service.EventScheduling;
using DayOfWeek = System.DayOfWeek;

namespace Meetly.Api.Tests;

public class EventServiceSecurityTests
{
    private static CreateEventRequest ValidCreate(string? adminPassword = "secret") => new()
    {
        Title = "Sync",
        EventType = 2,
        AvailableWeekdays = [DayOfWeek.Monday],
        DailyStartTime = new TimeOnly(9, 0),
        DailyEndTime = new TimeOnly(17, 0),
        Admin = new AdminRequest { Username = "Host", Password = adminPassword }
    };

    private static (FakeEventRepository Repo, Events Event, EventParticipants Admin) SeedEvent(string? adminPasswordHash)
    {
        var repo = new FakeEventRepository();
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            Title = "Sync",
            URL = "",
            ShortCode = "ABC234",
            TimeZone = "Asia/Ho_Chi_Minh",
            EventType = EventType.Weekdays,
            DailyStartTime = new TimeOnly(9, 0),
            DailyEndTime = new TimeOnly(17, 0),
            AvailableDates = [new EventAvailableDates { Id = Guid.NewGuid(), DayOfWeek = Repository.Enum.DayOfWeek.Monday }]
        };
        var admin = new EventParticipants { Id = Guid.NewGuid(), EventId = entity.Id, Username = "Host", IsAdmin = true, PasswordHash = adminPasswordHash };
        entity.Participants.Add(admin);
        repo.Events.Add(entity);
        return (repo, entity, admin);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc")]
    public async Task Create_RejectsMissingOrShortAdminPassword(string? password)
    {
        var service = TestServices.EventService(new FakeEventRepository());

        var error = await Assert.ThrowsAsync<EventException>(() => service.CreateAsync(ValidCreate(password), CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task Create_HashesAdminPassword_AndReturnsFrontendUrl()
    {
        var repo = new FakeEventRepository();
        var response = await TestServices.EventService(repo).CreateAsync(ValidCreate(), CancellationToken.None);

        var admin = Assert.Single(repo.AddedParticipants);
        Assert.NotNull(admin.PasswordHash);
        Assert.NotEqual("secret", admin.PasswordHash);
        Assert.Equal($"https://app.test/e/{response.ShortCode}", response.Url);
    }

    [Fact]
    public async Task Create_RejectsTooLongTitle()
    {
        var request = ValidCreate() with { Title = new string('x', 256) };

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(new FakeEventRepository()).CreateAsync(request, CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task Create_RejectsTimesOffTheFifteenMinuteGrid()
    {
        var request = ValidCreate() with { DailyStartTime = new TimeOnly(9, 10) };

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(new FakeEventRepository()).CreateAsync(request, CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task Access_BlocksLegacyAdminWithoutPassword()
    {
        var (repo, _, _) = SeedEvent(adminPasswordHash: null);

        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(repo).AccessAsync("ABC234", new ParticipantAccessRequest("host", null), CancellationToken.None));

        Assert.Equal(403, error.StatusCode);
    }

    [Fact]
    public async Task Access_AcceptsLowercaseShortCode_AndCreatesPasswordlessParticipant()
    {
        var (repo, _, _) = SeedEvent(adminPasswordHash: "hash");

        var response = await TestServices.EventService(repo).AccessAsync("abc234", new ParticipantAccessRequest("Guest", null), CancellationToken.None);

        Assert.True(response.IsNewParticipant);
        Assert.False(response.IsAdmin);
    }

    [Fact]
    public async Task Access_RejectsTooLongUsername()
    {
        var (repo, _, _) = SeedEvent(adminPasswordHash: "hash");

        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(repo).AccessAsync("ABC234", new ParticipantAccessRequest(new string('a', 51), null), CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task Finalize_Returns409_WhenEventWasClosedConcurrently()
    {
        var (repo, entity, admin) = SeedEvent(adminPasswordHash: "hash");
        repo.BumpReturnsNull = true;
        var request = new FinalizeEventRequest
        {
            DayOfWeek = 1,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            MeetingUrl = "https://meet.google.com/abc-defg-hij"
        };

        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(repo).FinalizeAsync("ABC234", TestServices.User(admin.Id, "ABC234"), request, CancellationToken.None));

        Assert.Equal(409, error.StatusCode);
        Assert.Equal(EventStatus.Open, entity.Status);
        Assert.Null(entity.MeetingUrl);
    }

    // Admin tự dán link (Meet, Zoom, Teams...) nên không khoá host; chỉ chặn link không an toàn để gắn vào thẻ <a>
    [Theory]
    [InlineData("http://meet.google.com/abc-defg-hij")]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,hi")]
    [InlineData("https://evil.example@meet.google.com/abc-defg-hij")]
    [InlineData("meet.google.com/abc-defg-hij")]
    [InlineData("https://meet.google.com/abc defg")]
    public async Task Finalize_RejectsInvalidMeetingUrl(string meetingUrl)
    {
        var (repo, entity, admin) = SeedEvent(adminPasswordHash: "hash");
        var request = new FinalizeEventRequest
        {
            DayOfWeek = 1,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            MeetingUrl = meetingUrl
        };

        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(repo).FinalizeAsync("ABC234", TestServices.User(admin.Id, "ABC234"), request, CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
        Assert.Equal(EventStatus.Open, entity.Status);
        Assert.Null(entity.MeetingUrl);
    }

    [Fact]
    public async Task Finalize_OnlyHostCanSetMeetingUrl()
    {
        var (repo, entity, _) = SeedEvent(adminPasswordHash: "hash");
        var guest = new EventParticipants { Id = Guid.NewGuid(), EventId = entity.Id, Username = "Guest" };
        entity.Participants.Add(guest);
        var request = new FinalizeEventRequest
        {
            DayOfWeek = 1,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            MeetingUrl = "https://meet.google.com/abc-defg-hij"
        };

        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(repo).FinalizeAsync("ABC234", TestServices.User(guest.Id, "ABC234"), request, CancellationToken.None));

        Assert.Equal(403, error.StatusCode);
        Assert.Equal(EventStatus.Open, entity.Status);
        Assert.Null(entity.MeetingUrl);
    }

    [Fact]
    public async Task Finalize_UsesRevisionFromAtomicBump()
    {
        var (repo, entity, admin) = SeedEvent(adminPasswordHash: "hash");
        entity.Revision = 41;
        var request = new FinalizeEventRequest { DayOfWeek = 1, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(10, 0) };

        var response = await TestServices.EventService(repo).FinalizeAsync("ABC234", TestServices.User(admin.Id, "ABC234"), request, CancellationToken.None);

        Assert.Equal(42, response.Revision);
        Assert.Equal(EventStatus.Finalized, entity.Status);
    }
}

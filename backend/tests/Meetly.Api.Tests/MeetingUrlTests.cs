using System.Text;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Service.Calendar;
using Meetly.Service.Email;
using Meetly.Service.EventScheduling;
using Xunit;

namespace Meetly.Api.Tests;

public class MeetingUrlTests
{
    private const string MeetUrl = "https://meet.google.com/kfp-zqrv-mtx";
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 1, 0, 0, TimeSpan.Zero);

    /// <summary>Event Open có admin "Host" và người thường "Guest", ngày 02/12/2026 khả dụng.</summary>
    private static (FakeEventRepository Repo, Events Event, EventParticipants Admin, EventParticipants Guest) Seed(
        EventStatus status = EventStatus.Open,
        string? meetingUrl = null)
    {
        var repo = new FakeEventRepository();
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            Title = "Sync",
            URL = "",
            ShortCode = "ABC234",
            TimeZone = "Asia/Ho_Chi_Minh",
            EventType = EventType.Dates,
            DailyStartTime = new TimeOnly(9, 0),
            DailyEndTime = new TimeOnly(17, 0),
            Status = status,
            Revision = 4,
            MeetingUrl = meetingUrl,
            AvailableDates = [new EventAvailableDates { Id = Guid.NewGuid(), SpecificDate = new DateOnly(2026, 12, 2) }],
        };
        if (status == EventStatus.Finalized)
        {
            entity.FinalDate = new DateOnly(2026, 12, 2);
            entity.FinalStartTime = new TimeOnly(9, 45);
            entity.FinalEndTime = new TimeOnly(11, 15);
        }
        var admin = new EventParticipants { Id = Guid.NewGuid(), EventId = entity.Id, Username = "Host", IsAdmin = true };
        var guest = new EventParticipants { Id = Guid.NewGuid(), EventId = entity.Id, Username = "Guest" };
        entity.Participants.Add(admin);
        entity.Participants.Add(guest);
        repo.Events.Add(entity);
        return (repo, entity, admin, guest);
    }

    private static FinalizeEventRequest Finalize(string? meetingUrl) => new()
    {
        SpecificDate = new DateOnly(2026, 12, 2),
        StartTime = new TimeOnly(9, 45),
        EndTime = new TimeOnly(11, 15),
        MeetingUrl = meetingUrl,
    };

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Normalize_TreatsBlankAsNoLink(string? value)
    {
        Assert.Null(EventService.NormalizeMeetingUrl(value));
    }

    [Theory]
    [InlineData("  https://meet.google.com/kfp-zqrv-mtx ", "https://meet.google.com/kfp-zqrv-mtx")]
    [InlineData("https://us02web.zoom.us/j/123456789?pwd=abc", "https://us02web.zoom.us/j/123456789?pwd=abc")]
    [InlineData("https://teams.microsoft.com/l/meetup-join/19%3ameeting", "https://teams.microsoft.com/l/meetup-join/19%3ameeting")]
    public void Normalize_KeepsHttpsLinks(string value, string expected)
    {
        Assert.Equal(expected, EventService.NormalizeMeetingUrl(value));
    }

    [Theory]
    [InlineData("http://meet.google.com/kfp-zqrv-mtx")]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,hi")]
    [InlineData("meet.google.com/kfp-zqrv-mtx")]
    [InlineData("https://meet.google.com/kfp zqrv")]
    [InlineData("not a url")]
    public void Normalize_RejectsNonHttpsOrMalformed(string value)
    {
        var error = Assert.Throws<EventException>(() => EventService.NormalizeMeetingUrl(value));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public void Normalize_RejectsLinksLongerThanTheColumn()
    {
        var url = "https://meet.google.com/" + new string('a', 500 - "https://meet.google.com/".Length + 1);

        var error = Assert.Throws<EventException>(() => EventService.NormalizeMeetingUrl(url));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task Finalize_StoresMeetingUrl_AndReturnsIt()
    {
        var (repo, entity, admin, _) = Seed();

        var response = await TestServices.EventService(repo).FinalizeAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), Finalize(MeetUrl), CancellationToken.None);

        Assert.Equal(MeetUrl, entity.MeetingUrl);
        Assert.Equal(MeetUrl, response.MeetingUrl);
    }

    [Fact]
    public async Task Finalize_WithInvalidMeetingUrl_Returns422_AndKeepsEventOpen()
    {
        var (repo, entity, admin, _) = Seed();

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(repo).FinalizeAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), Finalize("javascript:alert(1)"), CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
        Assert.Equal(EventStatus.Open, entity.Status);
        Assert.Null(entity.MeetingUrl);
    }

    [Fact]
    public async Task Finalize_WithoutMeetingUrl_KeepsLinkSetEarlier()
    {
        var (repo, entity, admin, _) = Seed(meetingUrl: MeetUrl);

        var response = await TestServices.EventService(repo).FinalizeAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), Finalize(null), CancellationToken.None);

        Assert.Equal(MeetUrl, entity.MeetingUrl);
        Assert.Equal(MeetUrl, response.MeetingUrl);
    }

    [Fact]
    public async Task UpdateMeetingUrl_SetsLink_BumpsRevision_AndNotifies()
    {
        var (repo, entity, admin, _) = Seed(EventStatus.Finalized);
        var notifier = new NoopNotifier();

        var response = await TestServices.EventService(repo, notifier: notifier).UpdateMeetingUrlAsync(
            "abc234", TestServices.User(admin.Id, "ABC234"), new UpdateMeetingUrlRequest { MeetingUrl = MeetUrl }, CancellationToken.None);

        Assert.Equal(MeetUrl, entity.MeetingUrl);
        Assert.Equal(new MeetingUrlResponse(MeetUrl, 5), response);
        var (shortCode, notified) = Assert.Single(notifier.MeetingUrlUpdates);
        Assert.Equal("ABC234", shortCode);
        Assert.Equal(response, notified);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task UpdateMeetingUrl_ClearsLink_WhenBlank(string? value)
    {
        var (repo, entity, admin, _) = Seed(meetingUrl: MeetUrl);

        var response = await TestServices.EventService(repo).UpdateMeetingUrlAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), new UpdateMeetingUrlRequest { MeetingUrl = value }, CancellationToken.None);

        Assert.Null(entity.MeetingUrl);
        Assert.Null(response.MeetingUrl);
    }

    [Fact]
    public async Task UpdateMeetingUrl_Returns403_ForNonAdmin()
    {
        var (repo, entity, _, guest) = Seed();

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(repo).UpdateMeetingUrlAsync(
            "ABC234", TestServices.User(guest.Id, "ABC234"), new UpdateMeetingUrlRequest { MeetingUrl = MeetUrl }, CancellationToken.None));

        Assert.Equal(403, error.StatusCode);
        Assert.Null(entity.MeetingUrl);
    }

    [Fact]
    public async Task UpdateMeetingUrl_Returns422_ForInvalidLink()
    {
        var (repo, _, admin, _) = Seed();

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(repo).UpdateMeetingUrlAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), new UpdateMeetingUrlRequest { MeetingUrl = "http://zoom.us/j/1" }, CancellationToken.None));

        Assert.Equal(422, error.StatusCode);
    }

    [Fact]
    public async Task UpdateMeetingUrl_Returns404_ForUnknownEvent()
    {
        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(new FakeEventRepository()).UpdateMeetingUrlAsync(
            "ZZZZZZ", TestServices.User(Guid.NewGuid(), "ZZZZZZ"), new UpdateMeetingUrlRequest { MeetingUrl = MeetUrl }, CancellationToken.None));

        Assert.Equal(404, error.StatusCode);
    }

    [Fact]
    public async Task GetEvent_IncludesMeetingUrl()
    {
        var (repo, _, _, _) = Seed(meetingUrl: MeetUrl);

        var response = await TestServices.EventService(repo).GetAsync("ABC234", CancellationToken.None);

        Assert.Equal(MeetUrl, response.MeetingUrl);
    }

    [Fact]
    public void Ics_HasLocationAndDescriptionLine_OnlyWithMeetingUrl()
    {
        var (_, with, _, _) = Seed(EventStatus.Finalized, MeetUrl);
        var (_, without, _, _) = Seed(EventStatus.Finalized);

        var withIcs = CalendarInviteBuilder.ToIcs(CalendarInviteBuilder.FromEvent(with, "https://app.test/e/ABC234", Now)!, Now);
        var withoutIcs = CalendarInviteBuilder.ToIcs(CalendarInviteBuilder.FromEvent(without, "https://app.test/e/ABC234", Now)!, Now);

        Assert.Contains($"LOCATION:{MeetUrl}\r\n", withIcs);
        Assert.Contains($"Link cuộc họp: {MeetUrl}", withIcs.Replace("\r\n ", ""));
        Assert.DoesNotContain("LOCATION:", withoutIcs);
        Assert.DoesNotContain("Link cuộc họp", withoutIcs);
    }

    [Fact]
    public void GoogleCalendarUrl_HasLocation_OnlyWithMeetingUrl()
    {
        var (_, with, _, _) = Seed(EventStatus.Finalized, MeetUrl);
        var (_, without, _, _) = Seed(EventStatus.Finalized);

        var withUrl = CalendarInviteBuilder.GoogleCalendarUrl(CalendarInviteBuilder.FromEvent(with, "https://app.test/e/ABC234", Now)!);
        var withoutUrl = CalendarInviteBuilder.GoogleCalendarUrl(CalendarInviteBuilder.FromEvent(without, "https://app.test/e/ABC234", Now)!);

        Assert.Contains($"&location={Uri.EscapeDataString(MeetUrl)}", withUrl);
        Assert.DoesNotContain("location=", withoutUrl);
    }

    [Fact]
    public void EmailTemplate_ShowsJoinButton_OnlyWithMeetingUrl()
    {
        FinalizedEmailModel Model(string? meetingUrl) => new(
            "Sync", "2026-12-02", null, "09:45", "11:15", 3, "https://app.test/e/ABC234", "https://app.test", null, false, meetingUrl);

        var with = FinalizedEmailTemplate.Render(Model("https://zoom.us/j/1?pwd=a&b=c"));
        var without = FinalizedEmailTemplate.Render(Model(null));

        Assert.Contains("Tham gia cuộc họp", with);
        Assert.Contains("href=\"https://zoom.us/j/1?pwd=a&amp;b=c\"", with);
        Assert.DoesNotContain("Tham gia cuộc họp", without);
    }

    [Fact]
    public async Task Finalize_EmailIncludesMeetingLink()
    {
        var (repo, _, admin, _) = Seed();
        repo.Emails.Add("guest@example.com");
        var queue = new FakeEmailQueue();

        await TestServices.EventService(repo, queue).FinalizeAsync(
            "ABC234", TestServices.User(admin.Id, "ABC234"), Finalize(MeetUrl), CancellationToken.None);

        var message = Assert.Single(queue.Messages);
        Assert.Contains("Tham gia cuộc họp", message.Html);
        Assert.Contains($"href=\"{MeetUrl}\"", message.Html);
        var ics = Encoding.UTF8.GetString(Assert.Single(message.Attachments!).Content);
        Assert.Contains($"LOCATION:{MeetUrl}", ics);
    }
}

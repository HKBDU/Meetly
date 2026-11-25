using System.Text;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Service.Calendar;
using Meetly.Service.Email;
using Meetly.Service.EventScheduling;
using Xunit;

namespace Meetly.Api.Tests;

public class CalendarInviteTests
{
    private const string Url = "https://meetly-soon.vercel.app/e/ABC234";
    /// <summary>Thứ Năm 26/11/2026, 08:00 giờ Việt Nam</summary>
    private static readonly DateTimeOffset Now = new(2026, 11, 26, 1, 0, 0, TimeSpan.Zero);

    private static Events Finalized(
        string title = "Họp nhóm đồ án",
        DateOnly? date = null,
        Repository.Enum.DayOfWeek? weekday = null,
        EventStatus status = EventStatus.Finalized) => new()
        {
            Id = Guid.NewGuid(),
            Title = title,
            URL = Url,
            ShortCode = "ABC234",
            TimeZone = "Asia/Ho_Chi_Minh",
            EventType = weekday is null ? EventType.Dates : EventType.Weekdays,
            DailyStartTime = new TimeOnly(9, 0),
            DailyEndTime = new TimeOnly(17, 0),
            Status = status,
            FinalDate = weekday is null ? date ?? new DateOnly(2026, 12, 2) : null,
            FinalDayOfWeek = weekday,
            FinalStartTime = new TimeOnly(9, 45),
            FinalEndTime = new TimeOnly(11, 15),
        };

    private static CalendarInvite Invite(Events entity) => CalendarInviteBuilder.FromEvent(entity, Url, Now)!;

    [Fact]
    public void FromEvent_ReturnsNull_WhenNotFinalized()
    {
        Assert.Null(CalendarInviteBuilder.FromEvent(Finalized(status: EventStatus.Open), Url, Now));
    }

    [Fact]
    public void Ics_SpecificDate_UsesLocalTimeWithVietnamTimezone()
    {
        var ics = CalendarInviteBuilder.ToIcs(Invite(Finalized()), Now);

        Assert.StartsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n", ics);
        Assert.EndsWith("END:VCALENDAR\r\n", ics);
        Assert.Contains("TZID:Asia/Ho_Chi_Minh\r\n", ics);
        Assert.Contains("TZOFFSETTO:+0700\r\n", ics);
        Assert.Contains("DTSTART;TZID=Asia/Ho_Chi_Minh:20261202T094500\r\n", ics);
        Assert.Contains("DTEND;TZID=Asia/Ho_Chi_Minh:20261202T111500\r\n", ics);
        Assert.Contains("UID:ABC234@meetly\r\n", ics);
        Assert.Contains("DTSTAMP:20261126T010000Z\r\n", ics);
        Assert.Contains($"URL:{Url}\r\n", ics);
        Assert.DoesNotContain("RRULE", ics);
    }

    [Theory]
    [InlineData(Repository.Enum.DayOfWeek.Monday, "20261130", "MO")]
    [InlineData(Repository.Enum.DayOfWeek.Thursday, "20261126", "TH")]
    [InlineData(Repository.Enum.DayOfWeek.Wednesday, "20261202", "WE")]
    public void Ics_Weekly_StartsOnNextOccurrence_AndRepeats(Repository.Enum.DayOfWeek day, string firstDate, string byDay)
    {
        var ics = CalendarInviteBuilder.ToIcs(Invite(Finalized(weekday: day)), Now);

        Assert.Contains($"DTSTART;TZID=Asia/Ho_Chi_Minh:{firstDate}T094500\r\n", ics);
        Assert.Contains($"RRULE:FREQ=WEEKLY;BYDAY={byDay}\r\n", ics);
    }

    [Fact]
    public void Ics_EscapesSpecialCharacters()
    {
        var ics = CalendarInviteBuilder.ToIcs(Invite(Finalized(title: @"Team, dinner; a\b")), Now);

        Assert.Contains(@"SUMMARY:Team\, dinner\; a\\b" + "\r\n", ics);
        Assert.Contains(@"DESCRIPTION:Lịch họp đã chốt trên Meetly.\nXem sự kiện: ", Unfold(ics));
    }

    [Fact]
    public void Ics_FoldsLongLines_At75Octets_WithoutBreakingCharacters()
    {
        var title = string.Concat(Enumerable.Repeat("Buổi họp tổng kết đồ án cuối kỳ ", 6)).Trim();
        var ics = CalendarInviteBuilder.ToIcs(Invite(Finalized(title: title)), Now);

        foreach (var line in ics.Split("\r\n"))
            Assert.True(Encoding.UTF8.GetByteCount(line) <= 75, $"Line too long: {line}");
        Assert.Contains($"SUMMARY:{title}\r\n", Unfold(ics));
    }

    [Fact]
    public void FixedOffset_IgnoresHistoricalDaylightSaving()
    {
        // Giống dữ liệu tzdata trên Linux: +7 hiện tại nhưng có giờ mùa hè trong quá khứ
        var historicDst = TimeZoneInfo.AdjustmentRule.CreateAdjustmentRule(
            new DateTime(1960, 1, 1), new DateTime(1970, 12, 31), TimeSpan.FromHours(1),
            TimeZoneInfo.TransitionTime.CreateFixedDateRule(new DateTime(1, 1, 1, 2, 0, 0), 4, 1),
            TimeZoneInfo.TransitionTime.CreateFixedDateRule(new DateTime(1, 1, 1, 2, 0, 0), 10, 1));
        var zone = TimeZoneInfo.CreateCustomTimeZone("Test/Historic", TimeSpan.FromHours(7), "Historic", "Historic", "Historic DST", [historicDst]);

        Assert.True(zone.SupportsDaylightSavingTime);
        Assert.Equal(TimeSpan.FromHours(7), CalendarInviteBuilder.FixedOffset(zone, new DateTime(2026, 12, 2, 9, 45, 0)));
    }

    [Fact]
    public void FixedOffset_IsNull_WhenClocksChangeNearTheMeeting()
    {
        var currentDst = TimeZoneInfo.AdjustmentRule.CreateAdjustmentRule(
            new DateTime(2000, 1, 1), new DateTime(2099, 12, 31), TimeSpan.FromHours(1),
            TimeZoneInfo.TransitionTime.CreateFixedDateRule(new DateTime(1, 1, 1, 2, 0, 0), 3, 30),
            TimeZoneInfo.TransitionTime.CreateFixedDateRule(new DateTime(1, 1, 1, 2, 0, 0), 10, 30));
        var zone = TimeZoneInfo.CreateCustomTimeZone("Test/Dst", TimeSpan.FromHours(1), "Dst", "Dst", "Dst summer", [currentDst]);

        Assert.Null(CalendarInviteBuilder.FixedOffset(zone, new DateTime(2026, 12, 2, 9, 45, 0)));
    }

    [Fact]
    public void GoogleCalendarUrl_SpecificDate()
    {
        var url = CalendarInviteBuilder.GoogleCalendarUrl(Invite(Finalized(title: "Họp & ăn tối")));

        Assert.StartsWith("https://calendar.google.com/calendar/render?action=TEMPLATE&", url);
        Assert.Contains("&dates=20261202T094500/20261202T111500&", url);
        Assert.Contains("&ctz=Asia%2FHo_Chi_Minh", url);
        Assert.Contains($"&text={Uri.EscapeDataString("Họp & ăn tối")}&", url);
        Assert.DoesNotContain("recur=", url);
    }

    [Fact]
    public void GoogleCalendarUrl_Weekly_AddsRecurrence()
    {
        var url = CalendarInviteBuilder.GoogleCalendarUrl(Invite(Finalized(weekday: Repository.Enum.DayOfWeek.Monday)));

        Assert.Contains("&dates=20261130T094500/20261130T111500&", url);
        Assert.EndsWith($"&recur={Uri.EscapeDataString("RRULE:FREQ=WEEKLY;BYDAY=MO")}", url);
    }

    [Fact]
    public async Task GetCalendar_ReturnsIcsFile_ForFinalizedEvent()
    {
        var repo = new FakeEventRepository();
        repo.Events.Add(Finalized());

        var file = await TestServices.EventService(repo).GetCalendarAsync("abc234", CancellationToken.None);

        Assert.Equal("meetly-ABC234.ics", file.FileName);
        Assert.Contains("DTSTART;TZID=Asia/Ho_Chi_Minh:20261202T094500", file.Content);
        Assert.Contains("https://app.test/e/ABC234", file.Content);
    }

    [Fact]
    public async Task GetCalendar_Returns409_WhenNotFinalized()
    {
        var repo = new FakeEventRepository();
        repo.Events.Add(Finalized(status: EventStatus.Open));

        var error = await Assert.ThrowsAsync<EventException>(() => TestServices.EventService(repo).GetCalendarAsync("ABC234", CancellationToken.None));

        Assert.Equal(409, error.StatusCode);
    }

    [Fact]
    public async Task GetCalendar_Returns404_ForUnknownCode()
    {
        var error = await Assert.ThrowsAsync<EventException>(() =>
            TestServices.EventService(new FakeEventRepository()).GetCalendarAsync("ZZZZZZ", CancellationToken.None));

        Assert.Equal(404, error.StatusCode);
    }

    [Fact]
    public async Task Finalize_EmailsGoogleCalendarLink_AndAttachesIcs()
    {
        var repo = new FakeEventRepository();
        var entity = Finalized(status: EventStatus.Open);
        entity.AvailableDates = [new EventAvailableDates { Id = Guid.NewGuid(), SpecificDate = new DateOnly(2026, 12, 2) }];
        var admin = new EventParticipants { Id = Guid.NewGuid(), EventId = entity.Id, Username = "Host", IsAdmin = true };
        entity.Participants.Add(admin);
        repo.Events.Add(entity);
        repo.Emails.Add("guest@example.com");
        var queue = new FakeEmailQueue();

        await TestServices.EventService(repo, queue).FinalizeAsync(
            "ABC234",
            TestServices.User(admin.Id, "ABC234"),
            new FinalizeEventRequest { SpecificDate = new DateOnly(2026, 12, 2), StartTime = new TimeOnly(9, 45), EndTime = new TimeOnly(11, 15) },
            CancellationToken.None);

        var message = Assert.Single(queue.Messages);
        Assert.Contains("https://calendar.google.com/calendar/render?action=TEMPLATE", message.Html);
        Assert.Contains("invite.ics", message.Html);
        var attachment = Assert.Single(message.Attachments!);
        Assert.Equal("invite.ics", attachment.Name);
        Assert.Contains("DTSTART;TZID=Asia/Ho_Chi_Minh:20261202T094500", Encoding.UTF8.GetString(attachment.Content));
    }

    [Fact]
    public void EmailTemplate_ShowsCalendarButton_OnlyWithLink()
    {
        FinalizedEmailModel Model(string? link, bool attachment) => new(
            "Sync", "2026-12-02", null, "09:45", "11:15", 3, Url, "https://meetly-soon.vercel.app", link, attachment);

        var with = FinalizedEmailTemplate.Render(Model("https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sync", true));
        var without = FinalizedEmailTemplate.Render(Model(null, false));

        Assert.Contains("Thêm vào Google Calendar", with);
        Assert.Contains("href=\"https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=Sync\"", with);
        Assert.Contains("invite.ics", with);
        Assert.DoesNotContain("Thêm vào Google Calendar", without);
    }

    /// <summary>Bỏ gập dòng theo RFC 5545: CRLF + một khoảng trắng nghĩa là nối tiếp dòng trước.</summary>
    private static string Unfold(string ics) => ics.Replace("\r\n ", "");
}

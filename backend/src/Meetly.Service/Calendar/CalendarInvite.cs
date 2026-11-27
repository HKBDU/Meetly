using System.Globalization;
using System.Text;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;

namespace Meetly.Service.Calendar;

/// <summary>
/// Lịch họp đã chốt, dùng chung cho file .ics và link Google Calendar.
/// <see cref="Start"/>/<see cref="End"/> là giờ địa phương theo <see cref="TimeZone"/> của event.
/// <see cref="Location"/> là link cuộc họp (Meet, Zoom...) nếu admin đã gắn.
/// </summary>
public sealed record CalendarInvite(
    string Uid,
    string Title,
    string Description,
    string Url,
    DateTime Start,
    DateTime End,
    string TimeZone,
    System.DayOfWeek? RepeatWeeklyOn,
    string? Location = null);

/// <summary>
/// Dựng file iCalendar (RFC 5545) và link "Thêm vào Google Calendar" cho event đã chốt.
/// Không gọi API của Google nên không cần OAuth.
/// </summary>
public static class CalendarInviteBuilder
{
    private const string GoogleCalendarBaseUrl = "https://calendar.google.com/calendar/render";
    private const int MaxLineOctets = 75;
    private static readonly string[] ByDay = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

    /// <summary>
    /// Null nếu event chưa chốt. Event lặp theo tuần lấy lần gặp đầu tiên kể từ hôm nay
    /// (theo múi giờ của event) rồi lặp hằng tuần.
    /// </summary>
    public static CalendarInvite? FromEvent(Events entity, string eventUrl, DateTimeOffset now)
    {
        if (entity.Status != EventStatus.Finalized || entity.FinalStartTime is not { } start || entity.FinalEndTime is not { } end)
            return null;

        DateOnly date;
        System.DayOfWeek? weekly = null;
        if (entity.FinalDate is { } finalDate)
            date = finalDate;
        else if (entity.FinalDayOfWeek is { } finalDay)
        {
            weekly = (System.DayOfWeek)(int)finalDay;
            date = NextOccurrence(LocalToday(entity.TimeZone, now), weekly.Value);
        }
        else
            return null;

        var meetingUrl = string.IsNullOrWhiteSpace(entity.MeetingUrl) ? null : entity.MeetingUrl;
        var description = meetingUrl is null
            ? $"Lịch họp đã chốt trên Meetly.\nXem sự kiện: {eventUrl}"
            : $"Lịch họp đã chốt trên Meetly.\nLink cuộc họp: {meetingUrl}\nXem sự kiện: {eventUrl}";

        return new CalendarInvite(
            $"{entity.ShortCode}@meetly",
            entity.Title,
            description,
            eventUrl,
            date.ToDateTime(start),
            date.ToDateTime(end),
            entity.TimeZone,
            weekly,
            meetingUrl);
    }

    public static string GoogleCalendarUrl(CalendarInvite invite)
    {
        var query = new List<string>
        {
            "action=TEMPLATE",
            $"text={Uri.EscapeDataString(invite.Title)}",
            $"dates={LocalStamp(invite.Start)}/{LocalStamp(invite.End)}",
            $"details={Uri.EscapeDataString(invite.Description)}",
            $"ctz={Uri.EscapeDataString(invite.TimeZone)}",
        };
        if (invite.RepeatWeeklyOn is { } day)
            query.Add($"recur={Uri.EscapeDataString(WeeklyRule(day))}");
        if (!string.IsNullOrEmpty(invite.Location))
            query.Add($"location={Uri.EscapeDataString(invite.Location)}");
        return $"{GoogleCalendarBaseUrl}?{string.Join('&', query)}";
    }

    public static string ToIcs(CalendarInvite invite, DateTimeOffset stamp)
    {
        var zone = FindZone(invite.TimeZone);
        // Múi giờ không đổi giờ quanh thời điểm họp (VD Asia/Ho_Chi_Minh): khai báo VTIMEZONE và giữ giờ địa phương.
        // Có đổi giờ (giờ mùa hè) thì quy về UTC để khỏi phải mô tả luật DST.
        var offset = zone is null ? null : FixedOffset(zone, invite.Start);
        var fixedOffset = offset is not null;

        var lines = new List<string>
        {
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Meetly//Meetly//VI",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
        };

        if (offset is { } utcOffset)
        {
            var formatted = Offset(utcOffset);
            lines.AddRange(
            [
                "BEGIN:VTIMEZONE",
                $"TZID:{invite.TimeZone}",
                "BEGIN:STANDARD",
                "DTSTART:19700101T000000",
                $"TZOFFSETFROM:{formatted}",
                $"TZOFFSETTO:{formatted}",
                "END:STANDARD",
                "END:VTIMEZONE",
            ]);
        }

        lines.Add("BEGIN:VEVENT");
        lines.Add($"UID:{invite.Uid}");
        lines.Add($"DTSTAMP:{stamp.UtcDateTime:yyyyMMdd'T'HHmmss'Z'}");
        lines.Add(DateLine("DTSTART", invite.Start, invite.TimeZone, zone, fixedOffset));
        lines.Add(DateLine("DTEND", invite.End, invite.TimeZone, zone, fixedOffset));
        if (invite.RepeatWeeklyOn is { } day)
            lines.Add(WeeklyRule(day));
        lines.Add($"SUMMARY:{EscapeText(invite.Title)}");
        lines.Add($"DESCRIPTION:{EscapeText(invite.Description)}");
        if (!string.IsNullOrEmpty(invite.Location))
            lines.Add($"LOCATION:{EscapeText(invite.Location)}");
        lines.Add($"URL:{invite.Url.Replace("\r", "").Replace("\n", "")}");
        lines.Add("END:VEVENT");
        lines.Add("END:VCALENDAR");

        var builder = new StringBuilder();
        foreach (var line in lines)
            builder.Append(Fold(line)).Append("\r\n");
        return builder.ToString();
    }

    private static string DateLine(string name, DateTime local, string timeZone, TimeZoneInfo? zone, bool fixedOffset)
    {
        if (fixedOffset)
            return $"{name};TZID={timeZone}:{LocalStamp(local)}";
        if (zone is not null)
        {
            var utc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), zone);
            return $"{name}:{utc:yyyyMMdd'T'HHmmss'Z'}";
        }
        // Không nhận ra múi giờ: để giờ "trôi nổi", lịch sẽ hiểu theo múi giờ của người xem
        return $"{name}:{LocalStamp(local)}";
    }

    private static string WeeklyRule(System.DayOfWeek day) => $"RRULE:FREQ=WEEKLY;BYDAY={ByDay[(int)day]}";

    private static string LocalStamp(DateTime local) => local.ToString("yyyyMMdd'T'HHmmss", CultureInfo.InvariantCulture);

    private static string Offset(TimeSpan offset) =>
        $"{(offset < TimeSpan.Zero ? "-" : "+")}{Math.Abs(offset.Hours):00}{Math.Abs(offset.Minutes):00}";

    private static DateOnly LocalToday(string timeZone, DateTimeOffset now) =>
        DateOnly.FromDateTime(FindZone(timeZone) is { } zone ? TimeZoneInfo.ConvertTime(now, zone).DateTime : now.UtcDateTime);

    private static DateOnly NextOccurrence(DateOnly from, System.DayOfWeek day) =>
        from.AddDays(((int)day - (int)from.DayOfWeek + 7) % 7);

    /// <summary>
    /// Độ lệch UTC nếu nó giữ nguyên từ 6 tháng trước tới 18 tháng sau buổi họp, ngược lại null.
    /// Không dùng <see cref="TimeZoneInfo.SupportsDaylightSavingTime"/>: trên Linux cờ này tính cả các lần
    /// đổi giờ trong lịch sử (VD Asia/Ho_Chi_Minh trước 1975) nên báo true dù hiện nay không đổi giờ.
    /// </summary>
    public static TimeSpan? FixedOffset(TimeZoneInfo zone, DateTime around)
    {
        var offset = zone.GetUtcOffset(around);
        for (var month = -6; month <= 18; month++)
        {
            if (zone.GetUtcOffset(around.AddMonths(month)) != offset)
                return null;
        }
        return offset;
    }

    private static TimeZoneInfo? FindZone(string id) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone) ? zone : null;

    /// <summary>Escape kiểu TEXT của RFC 5545: \ ; , và xuống dòng.</summary>
    private static string EscapeText(string value) => value
        .Replace("\\", "\\\\")
        .Replace(";", "\\;")
        .Replace(",", "\\,")
        .Replace("\r\n", "\\n")
        .Replace("\n", "\\n")
        .Replace("\r", "");

    /// <summary>Gập dòng dài hơn 75 octet (UTF-8), không cắt giữa một ký tự; dòng tiếp theo bắt đầu bằng dấu cách.</summary>
    private static string Fold(string line)
    {
        if (Encoding.UTF8.GetByteCount(line) <= MaxLineOctets)
            return line;

        var builder = new StringBuilder();
        var octets = 0;
        var limit = MaxLineOctets;
        foreach (var rune in line.EnumerateRunes())
        {
            var size = rune.Utf8SequenceLength;
            if (octets + size > limit)
            {
                builder.Append("\r\n ");
                octets = 0;
                limit = MaxLineOctets - 1; // dấu cách đầu dòng cũng tính vào 75 octet
            }
            builder.Append(rune.ToString());
            octets += size;
        }
        return builder.ToString();
    }
}

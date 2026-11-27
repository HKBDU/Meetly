using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Unicode;

namespace Meetly.Service.Email;

/// <summary>Nội dung email báo lịch họp đã chốt.</summary>
public sealed record FinalizedEmailModel(
    string EventTitle,
    string? SpecificDate,
    int? DayOfWeek,
    string StartTime,
    string EndTime,
    int ParticipantCount,
    string EventUrl,
    string FrontendBaseUrl,
    string? GoogleCalendarUrl = null,
    bool HasCalendarAttachment = false,
    string? MeetingUrl = null);

/// <summary>
/// HTML email "Lịch họp đã được chốt". Dựng bằng bảng + style inline vì Gmail/Outlook bỏ
/// thẻ &lt;style&gt; và không hỗ trợ flex/grid; màu lấy theo màu thương hiệu của FE.
/// </summary>
public static class FinalizedEmailTemplate
{
    private const string Brand = "#059669";
    private const string BrandSoft = "#ecfdf5";
    private const string Ink = "#1c1917";
    private const string Muted = "#78716c";
    private const string Line = "#e7e5e4";
    private const string Page = "#f5f5f4";
    private const string Font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    /// <summary>Giữ nguyên chữ tiếng Việt (HtmlEncoder.Default đổi thành &amp;#x...;), vẫn mã hoá ký tự HTML</summary>
    private static readonly HtmlEncoder Encoder = HtmlEncoder.Create(UnicodeRanges.All);

    private static readonly string[] Weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    public static string Subject(string eventTitle) => $"Lịch họp đã được chốt: {eventTitle}";

    public static string Render(FinalizedEmailModel model)
    {
        var encode = Encoder;
        var title = encode.Encode(model.EventTitle);
        var url = encode.Encode(model.EventUrl);
        var logo = encode.Encode($"{model.FrontendBaseUrl.TrimEnd('/')}/meetly-logo.png");
        var (day, dayNote) = DescribeDay(model.SpecificDate, model.DayOfWeek);
        var time = $"{model.StartTime} – {model.EndTime}";
        var duration = DescribeDuration(model.StartTime, model.EndTime);
        var preheader = encode.Encode($"{day}, {time} · {model.EventTitle}");

        return $"""
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:{Page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{Page};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
    <tr><td style="padding:0 4px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><img src="{logo}" width="32" height="28" alt="" style="display:block;border:0;"></td>
        <td style="vertical-align:middle;padding-left:8px;font-family:{Font};font-size:18px;font-weight:700;color:{Ink};letter-spacing:-0.3px;">Meetly</td>
      </tr></table>
    </td></tr>

    <tr><td style="background:#ffffff;border:1px solid {Line};border-radius:20px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="height:6px;background:{Brand};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 32px 8px;font-family:{Font};">
          <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:{BrandSoft};color:{Brand};font-size:12px;font-weight:600;">&#10003;&nbsp; Đã chốt lịch</span>
          <h1 style="margin:18px 0 8px;font-size:26px;line-height:1.25;font-weight:700;color:{Ink};letter-spacing:-0.5px;">{title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:{Muted};">Người tổ chức đã chọn được thời gian phù hợp nhất. Hẹn gặp bạn nhé!</p>
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{BrandSoft};border-radius:16px;">
            <tr><td style="padding:22px 24px;font-family:{Font};">
              <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:{Brand};">{encode.Encode(dayNote)}</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:{Ink};">{encode.Encode(day)}</p>
              <p style="margin:4px 0 0;font-size:30px;font-weight:700;color:{Ink};letter-spacing:-0.5px;">{time}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:12px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:{Font};font-size:14px;">
            {DetailRow("Thời lượng", duration)}
            {DetailRow("Người tham gia", $"{model.ParticipantCount} người")}
          </table>
        </td></tr>

        <tr><td align="center" style="padding:28px 32px 8px;">
          <a href="{url}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:{Brand};color:#ffffff;font-family:{Font};font-size:15px;font-weight:600;text-decoration:none;">Xem chi tiết sự kiện</a>
        </td></tr>
{LinkRow(model.MeetingUrl, "&#127909;&nbsp; Tham gia cuộc họp")}
{CalendarRow(model)}
        <tr><td style="padding:12px 32px 32px;font-family:{Font};font-size:12px;line-height:1.6;color:{Muted};text-align:center;">
          Nút không bấm được? Mở link này:<br>
          <a href="{url}" style="color:{Brand};word-break:break-all;">{url}</a>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 16px 0;font-family:{Font};font-size:12px;line-height:1.6;color:{Muted};text-align:center;">
      Bạn nhận được email này vì đã đăng ký nhận thông báo cho sự kiện trên Meetly.
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
""";
    }

    /// <summary>Nút "Thêm vào Google Calendar" và ghi chú file .ics; trống nếu không có link lịch.</summary>
    private static string CalendarRow(FinalizedEmailModel model)
    {
        var note = model.HasCalendarAttachment
            ? $"""<p style="margin:10px 0 0;font-family:{Font};font-size:12px;line-height:1.6;color:{Muted};">Dùng Apple Calendar hay Outlook? Mở file <strong>invite.ics</strong> đính kèm.</p>"""
            : "";
        return LinkRow(model.GoogleCalendarUrl, "&#128197;&nbsp; Thêm vào Google Calendar", note);
    }

    private static string LinkRow(string? url, string label, string note = "") =>
        string.IsNullOrEmpty(url) ? "" : $"""
        <tr><td align="center" style="padding:10px 32px 0;">
          <a href="{Encoder.Encode(url)}" style="display:inline-block;padding:12px 26px;border-radius:999px;border:1px solid {Line};background:#ffffff;color:{Ink};font-family:{Font};font-size:14px;font-weight:600;text-decoration:none;">{label}</a>
          {note}
        </td></tr>
""";

    private static string DetailRow(string label, string value) =>
        $"""<tr><td style="padding:12px 0;border-top:1px solid {Line};color:{Muted};">{label}</td><td align="right" style="padding:12px 0;border-top:1px solid {Line};color:{Ink};font-weight:600;">{Encoder.Encode(value)}</td></tr>""";

    /// <summary>("Thứ Tư, 25/11/2026", "Ngày họp") hoặc ("Thứ Hai", "Hằng tuần")</summary>
    private static (string Day, string Note) DescribeDay(string? specificDate, int? dayOfWeek)
    {
        if (specificDate is not null &&
            DateOnly.TryParseExact(specificDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            return ($"{Weekdays[(int)date.DayOfWeek]}, {date:dd/MM/yyyy}", "Ngày họp");
        if (specificDate is not null)
            return (specificDate, "Ngày họp");
        return (Weekdays[Math.Clamp(dayOfWeek ?? 0, 0, 6)], "Hằng tuần");
    }

    private static string DescribeDuration(string start, string end)
    {
        if (!TimeOnly.TryParse(start, CultureInfo.InvariantCulture, out var from) ||
            !TimeOnly.TryParse(end, CultureInfo.InvariantCulture, out var to) || to <= from)
            return $"{start} – {end}";
        var minutes = (int)(to - from).TotalMinutes;
        var hours = minutes / 60;
        var rest = minutes % 60;
        return (hours, rest) switch
        {
            (0, _) => $"{rest} phút",
            (_, 0) => $"{hours} giờ",
            _ => $"{hours} giờ {rest} phút",
        };
    }
}

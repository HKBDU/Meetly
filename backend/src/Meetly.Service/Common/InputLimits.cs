namespace Meetly.Service.Common;

/// <summary>Giới hạn input dùng chung; khớp MaxLength trong AppDbContext và validate phía FE.</summary>
public static class InputLimits
{
    public const int TitleMaxLength = 255;
    public const int UsernameMaxLength = 50;
    public const int PasswordMinLength = 4;
    public const int PasswordMaxLength = 100;
    public const int EmailMaxLength = 100;
    public const int TimeZoneMaxLength = 50;

    /// <summary>Tối đa ~2 tháng ngày cụ thể cho 1 event.</summary>
    public const int MaxAvailableDates = 62;

    /// <summary>Mỗi ngày có tối đa 96 ô 15 phút, nên tối đa 48 khoảng rời nhau.</summary>
    public const int MaxRangesPerDay = 48;

    public const int SlotMinutes = 15;
    public const int MaxDurationMinutes = 24 * 60;

    /// <summary>Request body tối đa cho mọi endpoint (byte).</summary>
    public const long MaxRequestBodyBytes = 256 * 1024;

    public static bool IsOnSlotBoundary(TimeOnly time) =>
        time.Second == 0 && time.Millisecond == 0 && time.Minute % SlotMinutes == 0;
}

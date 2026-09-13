using System.Text.Json.Serialization;

namespace Meetly.Contract.DTOs.Events;

public sealed record CreateEventRequest
{
    public string Title { get; init; } = string.Empty;
    public int EventType { get; init; }
    public List<DateOnly> AvailableDates { get; init; } = [];
    public List<DayOfWeek> AvailableWeekdays { get; init; } = [];
    public TimeOnly DailyStartTime { get; init; }
    public TimeOnly DailyEndTime { get; init; }
    public AdminRequest Admin { get; init; } = new();
}

public sealed record AdminRequest
{
    public string Username { get; init; } = string.Empty;
    public string? Password { get; init; }
}

public sealed record UpdateEventRequest
{
    public string AdminUsername { get; init; } = string.Empty;
    public string? AdminPassword { get; init; }
    public string Title { get; init; } = string.Empty;
    public int EventType { get; init; }
    public List<DateOnly> AvailableDates { get; init; } = [];
    public List<DayOfWeek> AvailableWeekdays { get; init; } = [];
    public TimeOnly DailyStartTime { get; init; }
    public TimeOnly DailyEndTime { get; init; }
}

public sealed record CreateEventResponse
{
    public string ShortCode { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public Guid ParticipantId { get; init; }
    public bool IsAdmin { get; init; }
    public string AccessToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
    public int Status { get; init; }
    public long Revision { get; init; }
}

public sealed record FinalizeEventRequest
{
    public DateOnly? SpecificDate { get; init; }
    public int? DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
}

public sealed record FinalizeEventResponse(int Status, FinalScheduleResponse FinalSchedule, long Revision);

public sealed record EventResponse
{
    public string Title { get; init; } = string.Empty;
    public string ShortCode { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public int EventType { get; init; }
    [JsonPropertyName("timezone")]
    public string TimeZone { get; init; } = string.Empty;
    public List<DateOnly> AvailableDates { get; init; } = [];
    public List<DayOfWeek> AvailableWeekdays { get; init; } = [];
    public string DailyStartTime { get; init; } = string.Empty;
    public string DailyEndTime { get; init; } = string.Empty;
    public int Status { get; init; }
    public long Revision { get; init; }
    public List<EventParticipantResponse> Participants { get; init; } = [];
    public List<HeatmapCellResponse> HeatmapGrid { get; init; } = [];
    public FinalScheduleResponse? FinalSchedule { get; init; }
}

public sealed record EventParticipantResponse(string Username);
public sealed record HeatmapCellResponse(DateOnly? SpecificDate, DayOfWeek? DayOfWeek, string StartTime, List<string> Participants, int Count);
public sealed record FinalScheduleResponse(string? SpecificDate, int? DayOfWeek, string StartTime, string EndTime);

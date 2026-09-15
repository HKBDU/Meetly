using System.Text.Json.Serialization;

namespace Meetly.Service.EventScheduling;

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

public sealed record ParticipantAccessResponse
{
    public Guid ParticipantId { get; init; }
    public string Username { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
    public bool IsNewParticipant { get; init; }
    public string AccessToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
    public int EventStatus { get; init; }
    public long Revision { get; init; }
    public List<ParticipantTimeSlotResponse> TimeSlots { get; init; } = [];
}

public sealed record ParticipantMeResponse
{
    public Guid ParticipantId { get; init; }
    public string Username { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
    public List<ParticipantTimeSlotResponse> TimeSlots { get; init; } = [];
    public int EventStatus { get; init; }
    public long Revision { get; init; }
}

public sealed record ParticipantTimeSlotResponse(DateOnly? SpecificDate, DayOfWeek? DayOfWeek, string StartTime, string EndTime);

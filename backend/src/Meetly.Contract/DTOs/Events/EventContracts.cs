namespace Meetly.Contract.DTOs.Events;

public record CreateEventRequest
{
    public string Title { get; init; } = string.Empty;
    public int EventType { get; init; }
    public List<string> AvailableDates { get; init; } = [];
    public TimeOnly DailyStartTime { get; init; }
    public TimeOnly DailyEndTime { get; init; }
}

public sealed record UpdateEventRequest : CreateEventRequest
{
    public string AdminUsername { get; init; } = string.Empty;
    public string? AdminPassword { get; init; }
}

public sealed record CreateEventResponse(string ShortCode, string Url);

public sealed record FinalizeEventRequest(DateTimeOffset FinalStartTime, DateTimeOffset FinalEndTime);

public sealed record EventResponse
{
    public string Title { get; init; } = string.Empty;
    public string ShortCode { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public int EventType { get; init; }
    public List<string> AvailableDates { get; init; } = [];
    public string DailyStartTime { get; init; } = string.Empty;
    public string DailyEndTime { get; init; } = string.Empty;
    public bool IsFinalized { get; init; }
    public DateTimeOffset? FinalStartTime { get; init; }
    public DateTimeOffset? FinalEndTime { get; init; }
    public List<EventParticipantResponse> Participants { get; init; } = [];
    public Dictionary<string, List<string>> HeatmapGrid { get; init; } = [];
}

public sealed record EventParticipantResponse(string Username, List<EventTimeSlotResponse> TimeSlots);
public sealed record EventTimeSlotResponse(string StartTime, string EndTime);

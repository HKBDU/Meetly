namespace Meetly.Service.EventScheduling;

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
    public string Title { get; init; } = string.Empty;
    public int EventType { get; init; }
    public List<DateOnly> AvailableDates { get; init; } = [];
    public List<DayOfWeek> AvailableWeekdays { get; init; } = [];
    public TimeOnly DailyStartTime { get; init; }
    public TimeOnly DailyEndTime { get; init; }
}

public sealed record FinalizeEventRequest
{
    public DateOnly? SpecificDate { get; init; }
    public int? DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
}

public sealed record ParticipantAccessRequest(string Username, string? Password);

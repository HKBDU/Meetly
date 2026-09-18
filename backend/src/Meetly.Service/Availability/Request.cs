namespace Meetly.Service.Availability;

public sealed record SetAvailabilityRequest
{
    public string? Email { get; init; }
    public List<TimeSlotsRequest> TimeSlots { get; init; } = [];
}

public sealed record TimeSlotsRequest
{
    public DateOnly? SpecificDate { get; init; }
    public DayOfWeek? DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
}

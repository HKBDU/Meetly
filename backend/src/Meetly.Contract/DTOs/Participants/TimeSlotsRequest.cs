namespace Meetly.Contract.DTOs.Participants;

public sealed record TimeSlotsRequest
{
    public DateOnly? SpecificDate { get; init; }
    public DayOfWeek? DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
}

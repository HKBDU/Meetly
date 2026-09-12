namespace Meetly.Contract.DTOs.Events;

public class TimeSlotsSuggestionRequest
{
    public DateOnly? SpecificDate { get; init; }
    public DayOfWeek? DayOfWeek { get; init; }
    public TimeOnly? StartTime { get; init; }
    public TimeOnly? EndTime { get; init; }
    public int ParticipantCount { get; init; }
    public int TotalParticipants { get; init; }
}

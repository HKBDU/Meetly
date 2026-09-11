using Meetly.Repository.Abstraction;

namespace Meetly.Repository.Entity;

public class TimeSlots : BaseEntity
{
    public Guid ParticipantId { get; set; }
    public Guid EventId { get; set; }
    public DateOnly? SpecificDate { get; set; }
    public Enum.DayOfWeek? DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public EventParticipants Participant { get; set; } = null!;
    public Events Event { get; set; } = null!;
}

using Meetly.Repository.Abstraction;
using Meetly.Repository.Enum;

namespace Meetly.Repository.Entity;

public class Events : BaseEntity
{
    public string Title { get; set; } = null!;
    public string URL { get; set; } = null!;
    public string ShortCode { get; set; } = null!;
    public EventType EventType { get; set; }
    public string TimeZone { get; set; } = null!;
    public TimeOnly DailyStartTime { get; set; }
    public TimeOnly DailyEndTime { get; set; }
    public EventStatus Status { get; set; } = EventStatus.Open;
    public DateOnly? FinalDate { get; set; }
    public Enum.DayOfWeek? FinalDayOfWeek { get; set; }
    public TimeOnly? FinalStartTime { get; set; }
    public TimeOnly? FinalEndTime { get; set; }
    public long Revision { get; set; }

    public ICollection<EventAvailableDates> AvailableDates { get; set; } = [];
    public ICollection<EventEmails> Emails { get; set; } = [];
    public ICollection<EventParticipants> Participants { get; set; } = [];
    public ICollection<TimeSlots> TimeSlots { get; set; } = [];
}

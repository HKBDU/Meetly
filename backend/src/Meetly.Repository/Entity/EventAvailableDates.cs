using Meetly.Repository.Abstraction;

namespace Meetly.Repository.Entity;

public class EventAvailableDates : BaseEntity, IAuditableEntity
{
    public Guid EventId { get; set; }
    public DateOnly? SpecificDate { get; set; }
    public Enum.DayOfWeek? DayOfWeek { get; set; }

    public Events Event { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

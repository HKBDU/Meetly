using Meetly.Repository.Abstraction;

namespace Meetly.Repository.Entity;

public class EventParticipants : BaseEntity, IAuditableEntity
{
    public Guid EventId { get; set; }
    public string Username { get; set; } = null!;
    public string? PasswordHash { get; set; }
    public bool IsAdmin { get; set; }

    public Events Event { get; set; } = null!;
    public ICollection<TimeSlots> TimeSlots { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

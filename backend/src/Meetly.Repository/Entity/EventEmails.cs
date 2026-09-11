using Meetly.Repository.Abstraction;

namespace Meetly.Repository.Entity;

public class EventEmails : BaseEntity, IAuditableEntity
{
    public Guid EventId { get; set; }
    public string Email { get; set; } = null!;

    public Events Event { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

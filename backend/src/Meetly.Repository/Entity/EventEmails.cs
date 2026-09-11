using Meetly.Repository.Abstraction;

namespace Meetly.Repository.Entity;

public class EventEmails : BaseEntity
{
    public Guid EventId { get; set; }
    public string Email { get; set; } = null!;

    public Events Event { get; set; } = null!;
}

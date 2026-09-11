namespace Meetly.Repository.Abstraction;

public abstract class BaseEntity : IAuditableEntity
{
    public Guid Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

namespace Meetly.Api.Models;

public class Participant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Color { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Event? Event { get; set; }

    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
}

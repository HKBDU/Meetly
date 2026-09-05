namespace Meetly.Api.Models;

public class AvailabilitySlot
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventId { get; set; }

    public Guid ParticipantId { get; set; }

    public DateTime SlotTime { get; set; }

    public bool IsAvailable { get; set; } = true;

    public Event? Event { get; set; }

    public Participant? Participant { get; set; }
}

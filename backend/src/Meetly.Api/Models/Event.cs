namespace Meetly.Api.Models;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// Comma-separated ISO date strings (e.g. "2026-09-07,2026-09-08,2026-09-09")
    /// </summary>
    public string DatesJson { get; set; } = "[]";

    public int StartHour { get; set; } = 9;

    public int EndHour { get; set; } = 17;

    public int SlotDurationMinutes { get; set; } = 15;

    public string TimeZone { get; set; } = "UTC";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Participant> Participants { get; set; } = new List<Participant>();

    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
}

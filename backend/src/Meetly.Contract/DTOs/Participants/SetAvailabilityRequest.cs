namespace Meetly.Contract.DTOs.Participants;

public sealed record SetAvailabilityRequest
{
    public string? Email { get; init; }
    public List<TimeSlotsRequest> TimeSlots { get; init; } = [];
}

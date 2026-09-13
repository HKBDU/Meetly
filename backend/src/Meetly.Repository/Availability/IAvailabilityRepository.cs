using Meetly.Repository.Entity;

namespace Meetly.Repository.Availability;

public interface IAvailabilityRepository
{
    Task<Events?> GetEventAsync(string shortCode, CancellationToken cancellationToken);

    Task<EventParticipants?> GetParticipantAsync(
        Guid eventId,
        Guid participantId,
        CancellationToken cancellationToken);

    Task<long> ReplaceAsync(
        Events eventEntity,
        EventParticipants participant,
        IReadOnlyCollection<TimeSlots> timeSlots,
        string? email,
        CancellationToken cancellationToken);
}

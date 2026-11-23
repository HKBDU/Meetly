using Meetly.Repository.Entity;

namespace Meetly.Repository.Availability;

public interface IAvailabilityRepository
{
    Task<Events?> GetEventAsync(string shortCode, CancellationToken cancellationToken);

    Task<EventParticipants?> GetParticipantAsync(
        Guid eventId,
        Guid participantId,
        CancellationToken cancellationToken);

    /// <summary>Thay toàn bộ lịch của participant; trả revision mới, hoặc null nếu event không còn Open.</summary>
    Task<long?> ReplaceAsync(
        Events eventEntity,
        EventParticipants participant,
        IReadOnlyCollection<TimeSlots> timeSlots,
        string? email,
        CancellationToken cancellationToken);
}

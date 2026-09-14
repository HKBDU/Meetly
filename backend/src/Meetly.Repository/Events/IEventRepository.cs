using Meetly.Repository.Entity;

namespace Meetly.Repository.EventScheduling;

public interface IEventRepository
{
    Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken);
    Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(Guid eventId, string email, CancellationToken cancellationToken);
    void Add(Events eventEntity);
    void Add(EventParticipants participant);
    void Add(EventEmails email);
    void ReplaceSlots(EventParticipants participant, IEnumerable<TimeSlots> slots);
    void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository.EventScheduling;

public sealed class EventRepository(AppDbContext db) : IEventRepository
{
    public Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        db.Events.Include(x => x.AvailableDates).Include(x => x.Emails).Include(x => x.Participants)
            .ThenInclude(x => x.TimeSlots).SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken) =>
        db.Events.AnyAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<bool> EmailExistsAsync(Guid eventId, string email, CancellationToken cancellationToken) =>
        db.EventEmails.AnyAsync(x => x.EventId == eventId && x.Email == email, cancellationToken);

    public void Add(Events eventEntity) => db.Events.Add(eventEntity);
    public void Add(EventParticipants participant) => db.EventParticipants.Add(participant);
    public void Add(EventEmails email) => db.EventEmails.Add(email);

    public void ReplaceSlots(EventParticipants participant, IEnumerable<TimeSlots> slots)
    {
        db.TimeSlots.RemoveRange(participant.TimeSlots);
        db.TimeSlots.AddRange(slots);
    }

    public void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates)
    {
        db.EventAvailableDates.RemoveRange(eventEntity.AvailableDates);
        eventEntity.AvailableDates = dates;
        db.EventAvailableDates.AddRange(dates);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}

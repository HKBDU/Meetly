using Meetly.Repository.Entity;
using Meetly.Repository.EventScheduling;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository.Availability;

public sealed class AvailabilityRepository(AppDbContext dbContext, IEventRepository events) : IAvailabilityRepository
{
    public Task<Events?> GetEventAsync(string shortCode, CancellationToken cancellationToken) =>
        dbContext.Events
            .AsNoTracking()
            .Include(x => x.AvailableDates)
            .SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<EventParticipants?> GetParticipantAsync(
        Guid eventId,
        Guid participantId,
        CancellationToken cancellationToken) =>
        dbContext.EventParticipants.AsNoTracking().SingleOrDefaultAsync(
            x => x.EventId == eventId && x.Id == participantId,
            cancellationToken);

    public async Task<long?> ReplaceAsync(
        Events eventEntity,
        EventParticipants participant,
        IReadOnlyCollection<TimeSlots> timeSlots,
        string? email,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Bump trước để khoá dòng event: các lần lưu đồng thời xếp hàng và có revision riêng,
        // và nếu admin vừa chốt lịch thì dừng lại thay vì ghi đè lên event đã khoá.
        var revision = await events.TryBumpRevisionAsync(eventEntity.Id, requireOpen: true, cancellationToken);
        if (revision is null)
            return null;

        await dbContext.TimeSlots
            .Where(x => x.EventId == eventEntity.Id && x.ParticipantId == participant.Id)
            .ExecuteDeleteAsync(cancellationToken);
        dbContext.TimeSlots.AddRange(timeSlots);

        if (!string.IsNullOrWhiteSpace(email))
        {
            var normalizedEmail = email.Trim();
            var exists = await dbContext.EventEmails.AnyAsync(
                x => x.EventId == eventEntity.Id && x.Email == normalizedEmail,
                cancellationToken);

            if (!exists)
            {
                dbContext.EventEmails.Add(new EventEmails
                {
                    Id = Guid.NewGuid(),
                    EventId = eventEntity.Id,
                    Email = normalizedEmail,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return revision;
    }
}

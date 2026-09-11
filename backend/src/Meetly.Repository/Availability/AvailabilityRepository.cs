using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository.Availability;

public sealed class AvailabilityRepository : IAvailabilityRepository
{
    private readonly AppDbContext _dbContext;

    public AvailabilityRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Events?> GetEventAsync(string shortCode, CancellationToken cancellationToken) =>
        _dbContext.Events
            .Include(x => x.AvailableDates)
            .SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<EventParticipants?> GetParticipantAsync(
        Guid eventId,
        Guid participantId,
        CancellationToken cancellationToken) =>
        _dbContext.EventParticipants.SingleOrDefaultAsync(
            x => x.EventId == eventId && x.Id == participantId,
            cancellationToken);

    public async Task<long> ReplaceAsync(
        Events eventEntity,
        EventParticipants participant,
        IReadOnlyCollection<TimeSlots> timeSlots,
        string? email,
        CancellationToken cancellationToken)
    {
        await using var transaction = await _dbContext.Database
            .BeginTransactionAsync(cancellationToken);

        var oldTimeSlots = await _dbContext.TimeSlots
            .Where(x => x.EventId == eventEntity.Id && x.ParticipantId == participant.Id)
            .ToListAsync(cancellationToken);

        _dbContext.TimeSlots.RemoveRange(oldTimeSlots);
        await _dbContext.TimeSlots.AddRangeAsync(timeSlots, cancellationToken);

        if (!string.IsNullOrWhiteSpace(email))
        {
            var normalizedEmail = email.Trim();
            var exists = await _dbContext.EventEmails.AnyAsync(
                x => x.EventId == eventEntity.Id && x.Email == normalizedEmail,
                cancellationToken);

            if (!exists)
            {
                await _dbContext.EventEmails.AddAsync(new EventEmails
                {
                    Id = Guid.NewGuid(),
                    EventId = eventEntity.Id,
                    Email = normalizedEmail,
                    CreatedAt = DateTimeOffset.UtcNow
                }, cancellationToken);
            }
        }

        eventEntity.Revision++;
        eventEntity.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return eventEntity.Revision;
    }
}

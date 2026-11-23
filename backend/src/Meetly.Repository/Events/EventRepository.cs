using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Meetly.Repository.EventScheduling;

public sealed class EventRepository(AppDbContext db) : IEventRepository
{
    public Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        WithDetails(db.Events).SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<Events?> GetReadOnlyAsync(string shortCode, CancellationToken cancellationToken) =>
        WithDetails(db.Events.AsNoTracking()).SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);

    public Task<List<string>> GetEmailsAsync(Guid eventId, CancellationToken cancellationToken) =>
        db.EventEmails.AsNoTracking().Where(x => x.EventId == eventId).Select(x => x.Email).ToListAsync(cancellationToken);

    public Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken) =>
        db.Events.AnyAsync(x => x.ShortCode == shortCode, cancellationToken);

    public void Add(Events eventEntity) => db.Events.Add(eventEntity);
    public void Add(EventParticipants participant) => db.EventParticipants.Add(participant);

    public void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates)
    {
        db.EventAvailableDates.RemoveRange(eventEntity.AvailableDates);
        eventEntity.AvailableDates = dates;
        db.EventAvailableDates.AddRange(dates);

        // Bỏ các time slot thuộc ngày/thứ không còn trong event để không tồn dữ liệu rác
        foreach (var participant in eventEntity.Participants)
        {
            var orphans = participant.TimeSlots
                .Where(slot => !dates.Any(date => date.SpecificDate == slot.SpecificDate && date.DayOfWeek == slot.DayOfWeek))
                .ToList();
            db.TimeSlots.RemoveRange(orphans);
            foreach (var orphan in orphans) participant.TimeSlots.Remove(orphan);
        }
    }

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken) =>
        db.Database.BeginTransactionAsync(cancellationToken);

    public async Task<long?> TryBumpRevisionAsync(Guid eventId, bool requireOpen, CancellationToken cancellationToken)
    {
        // Không compose thêm LINQ để EF chạy nguyên câu UPDATE ... RETURNING
        var revisions = await db.Database.SqlQuery<long>($"""
            UPDATE "Events"
            SET "Revision" = "Revision" + 1, "UpdatedAt" = now()
            WHERE "Id" = {eventId} AND (NOT {requireOpen} OR "Status" = 1)
            RETURNING "Revision" AS "Value"
            """).ToListAsync(cancellationToken);
        return revisions.Count == 0 ? null : revisions[0];
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    /// <summary>
    /// Tách thành nhiều query (AsSplitQuery) để tránh nhân dòng: một JOIN chung cho
    /// ngày × participant × time slot sẽ trả về số dòng bằng tích các bảng.
    /// </summary>
    private static IQueryable<Events> WithDetails(IQueryable<Events> query) =>
        query
            .Include(x => x.AvailableDates)
            .Include(x => x.Participants).ThenInclude(x => x.TimeSlots)
            .AsSplitQuery();
}

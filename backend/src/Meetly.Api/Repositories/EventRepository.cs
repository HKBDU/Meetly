using Meetly.Api.Data;
using Meetly.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Api.Repositories;

public class EventRepository : IEventRepository
{
    private readonly MeetlyDbContext _db;

    public EventRepository(MeetlyDbContext db)
    {
        _db = db;
    }

    public async Task<Event?> GetBySlugAsync(string slug)
    {
        var normalizedSlug = slug.ToLowerInvariant().Trim();
        return await _db.Events
            .Include(e => e.Participants)
                .ThenInclude(p => p.AvailabilitySlots)
            .Include(e => e.AvailabilitySlots)
                .ThenInclude(a => a.Participant)
            .FirstOrDefaultAsync(e => e.Slug == normalizedSlug);
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        var normalizedSlug = slug.ToLowerInvariant().Trim();
        return await _db.Events.AnyAsync(e => e.Slug == normalizedSlug);
    }

    public async Task<Event> CreateAsync(Event evt)
    {
        _db.Events.Add(evt);
        await _db.SaveChangesAsync();
        return evt;
    }

    public async Task<Participant?> GetParticipantByNameAsync(Guid eventId, string name)
    {
        var trimmed = name.Trim();
        return await _db.Participants
            .Include(p => p.AvailabilitySlots)
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.Name.ToLower() == trimmed.ToLower());
    }

    public async Task<Participant> AddParticipantAsync(Participant participant)
    {
        _db.Participants.Add(participant);
        await _db.SaveChangesAsync();
        return participant;
    }

    public async Task<Participant?> GetParticipantWithSlotsAsync(Guid eventId, Guid participantId)
    {
        return await _db.Participants
            .Include(p => p.AvailabilitySlots)
            .FirstOrDefaultAsync(p => p.Id == participantId && p.EventId == eventId);
    }

    public async Task SaveAvailabilitySlotsAsync(Guid eventId, Guid participantId, List<DateTime> slotTimes)
    {
        var existingSlots = await _db.AvailabilitySlots
            .Where(a => a.EventId == eventId && a.ParticipantId == participantId)
            .ToListAsync();

        if (existingSlots.Count > 0)
        {
            _db.AvailabilitySlots.RemoveRange(existingSlots);
        }

        var newSlots = slotTimes
            .Distinct()
            .Select(slotTime => new AvailabilitySlot
            {
                EventId = eventId,
                ParticipantId = participantId,
                SlotTime = DateTime.SpecifyKind(slotTime, DateTimeKind.Utc),
                IsAvailable = true
            })
            .ToList();

        if (newSlots.Count > 0)
        {
            await _db.AvailabilitySlots.AddRangeAsync(newSlots);
        }

        await _db.SaveChangesAsync();
    }
}

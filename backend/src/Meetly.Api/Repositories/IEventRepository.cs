using Meetly.Api.Models;

namespace Meetly.Api.Repositories;

public interface IEventRepository
{
    Task<Event?> GetBySlugAsync(string slug);
    Task<bool> SlugExistsAsync(string slug);
    Task<Event> CreateAsync(Event evt);
    Task<Participant?> GetParticipantByNameAsync(Guid eventId, string name);
    Task<Participant> AddParticipantAsync(Participant participant);
    Task<Participant?> GetParticipantWithSlotsAsync(Guid eventId, Guid participantId);
    Task SaveAvailabilitySlotsAsync(Guid eventId, Guid participantId, List<DateTime> slotTimes);
}

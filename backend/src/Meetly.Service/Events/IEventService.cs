using System.Security.Claims;
using Meetly.Contract.DTOs.Events;
using Meetly.Contract.DTOs.Participants;

namespace Meetly.Service.EventScheduling;

public interface IEventService
{
    Task<CreateEventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken);
    Task<EventResponse> GetAsync(string shortCode, CancellationToken cancellationToken);
    Task<ParticipantAccessResponse> AccessAsync(string shortCode, ParticipantAccessRequest request, CancellationToken cancellationToken);
    Task<ParticipantMeResponse> GetCurrentParticipantAsync(string shortCode, ClaimsPrincipal user, CancellationToken cancellationToken);
    Task FinalizeAsync(string shortCode, ClaimsPrincipal user, FinalizeEventRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(string shortCode, UpdateEventRequest request, CancellationToken cancellationToken);
}

using System.Security.Claims;

namespace Meetly.Service.EventScheduling;

public interface IEventService
{
    Task<CreateEventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken);
    Task<EventResponse> GetAsync(string shortCode, CancellationToken cancellationToken);
    Task<ParticipantAccessResponse> AccessAsync(string shortCode, ParticipantAccessRequest request, CancellationToken cancellationToken);
    Task<ParticipantMeResponse> GetCurrentParticipantAsync(string shortCode, ClaimsPrincipal user, CancellationToken cancellationToken);
    Task<FinalizeEventResponse> FinalizeAsync(string shortCode, ClaimsPrincipal user, FinalizeEventRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(string shortCode, ClaimsPrincipal user, UpdateEventRequest request, CancellationToken cancellationToken);
    /// <summary>File .ics của lịch họp đã chốt; 404 nếu sai mã, 409 nếu event chưa chốt.</summary>
    Task<CalendarFileResponse> GetCalendarAsync(string shortCode, CancellationToken cancellationToken);
}

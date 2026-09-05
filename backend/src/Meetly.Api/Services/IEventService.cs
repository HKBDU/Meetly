using Meetly.Api.DTOs;

namespace Meetly.Api.Services;

public interface IEventService
{
    Task<EventDetailsDto> CreateEventAsync(CreateEventRequest request);
    Task<EventDetailsDto?> GetEventBySlugAsync(string slug);
    Task<ParticipantDto?> JoinEventAsync(string slug, JoinEventRequest request);
    Task<bool> UpdateAvailabilityAsync(string slug, UpdateAvailabilityRequest request);
}

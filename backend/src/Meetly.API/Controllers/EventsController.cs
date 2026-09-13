using Meetly.Contract.DTOs.Common;
using Meetly.Contract.DTOs.Events;
using Meetly.Contract.DTOs.Participants;
using Meetly.Service.EventScheduling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meetly.API.Controllers;

[ApiController]
[Route("api/v1/events")]
public sealed class EventsController(IEventService service) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CreateEventResponse>>> Create(CreateEventRequest request, CancellationToken ct) =>
        Ok(ApiResponse<CreateEventResponse>.Success(200, "Event created successfully", await service.CreateAsync(request, ct)));

    [HttpGet("{shortCode}")]
    public async Task<ActionResult<ApiResponse<EventResponse>>> Get(string shortCode, CancellationToken ct) =>
        Ok(ApiResponse<EventResponse>.Success(200, "Event loaded successfully", await service.GetAsync(shortCode, ct)));

    [HttpPost("{shortCode}/participants/access")]
    public async Task<ActionResult<ApiResponse<ParticipantAccessResponse>>> Access(string shortCode, ParticipantAccessRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ParticipantAccessResponse>.Success(200, "Participant loaded successfully", await service.AccessAsync(shortCode, request, ct)));

    [HttpPost("{shortCode}/participants")]
    public async Task<ActionResult<ApiResponse<object?>>> Save(string shortCode, SaveParticipantRequest request, CancellationToken ct)
    {
        await service.SaveParticipantAsync(shortCode, request, ct);
        return Ok(ApiResponse<object?>.Success(200, "Availability saved successfully", null));
    }

    [Authorize]
    [HttpPost("{shortCode}/finalize")]
    public async Task<ActionResult<ApiResponse<FinalizeEventResponse>>> Finalize(string shortCode, FinalizeEventRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinalizeEventResponse>.Success(200, "Event finalized successfully", await service.FinalizeAsync(shortCode, User, request, ct)));

    [HttpPut("{shortCode}")]
    public async Task<ActionResult<ApiResponse<object?>>> Update(string shortCode, UpdateEventRequest request, CancellationToken ct)
    {
        await service.UpdateAsync(shortCode, request, ct);
        return Ok(ApiResponse<object?>.Success(200, "Event updated successfully", null));
    }
}

using System.Text;
using Meetly.API.Extensions;
using Meetly.Contract.DTOs.Common;
using Meetly.Service.EventScheduling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Meetly.API.Controllers;

[ApiController]
[Route("api/v1/events")]
public sealed class EventsController(IEventService service) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting(RateLimitingExtensions.CreateEventPolicy)]
    public async Task<ActionResult<ApiResponse<CreateEventResponse>>> Create(CreateEventRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, ApiResponse<CreateEventResponse>.Success(201, "Event created successfully", await service.CreateAsync(request, ct)));

    [HttpGet("{shortCode}")]
    public async Task<ActionResult<ApiResponse<EventResponse>>> Get(string shortCode, CancellationToken ct) =>
        Ok(ApiResponse<EventResponse>.Success(200, "Event loaded successfully", await service.GetAsync(shortCode, ct)));

    /// <summary>File iCalendar của lịch họp đã chốt, để thêm vào Google Calendar, Apple Calendar, Outlook.</summary>
    [HttpGet("{shortCode}/calendar.ics")]
    public async Task<IActionResult> Calendar(string shortCode, CancellationToken ct)
    {
        var file = await service.GetCalendarAsync(shortCode, ct);
        return File(Encoding.UTF8.GetBytes(file.Content), "text/calendar; charset=utf-8", file.FileName);
    }

    [HttpPost("{shortCode}/participants/access")]
    [EnableRateLimiting(RateLimitingExtensions.ParticipantAccessPolicy)]
    public async Task<ActionResult<ApiResponse<ParticipantAccessResponse>>> Access(string shortCode, ParticipantAccessRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ParticipantAccessResponse>.Success(200, "Participant loaded successfully", await service.AccessAsync(shortCode, request, ct)));

    [Authorize]
    [HttpGet("{shortCode}/participants/me")]
    public async Task<ActionResult<ApiResponse<ParticipantMeResponse>>> GetCurrentParticipant(string shortCode, CancellationToken ct) =>
        Ok(ApiResponse<ParticipantMeResponse>.Success(200, "Participant loaded successfully", await service.GetCurrentParticipantAsync(shortCode, User, ct)));

    [Authorize]
    [HttpPost("{shortCode}/finalize")]
    [EnableRateLimiting(RateLimitingExtensions.WritePolicy)]
    public async Task<ActionResult<ApiResponse<FinalizeEventResponse>>> Finalize(string shortCode, FinalizeEventRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinalizeEventResponse>.Success(200, "Event finalized successfully", await service.FinalizeAsync(shortCode, User, request, ct)));

    /// <summary>Thêm, sửa hoặc xoá link cuộc họp (Meet, Zoom, Teams...) của event đã chốt. Gửi null hoặc rỗng để xoá.</summary>
    [Authorize]
    [HttpPut("{shortCode}/meeting-url")]
    [EnableRateLimiting(RateLimitingExtensions.WritePolicy)]
    public async Task<ActionResult<ApiResponse<MeetingUrlResponse>>> UpdateMeetingUrl(string shortCode, UpdateMeetingUrlRequest request, CancellationToken ct) =>
        Ok(ApiResponse<MeetingUrlResponse>.Success(200, "Meeting link updated successfully", await service.UpdateMeetingUrlAsync(shortCode, User, request, ct)));

    [Authorize]
    [HttpPut("{shortCode}")]
    [EnableRateLimiting(RateLimitingExtensions.WritePolicy)]
    public async Task<ActionResult<ApiResponse<object?>>> Update(string shortCode, UpdateEventRequest request, CancellationToken ct)
    {
        await service.UpdateAsync(shortCode, User, request, ct);
        return Ok(ApiResponse<object?>.Success(200, "Event updated successfully", null));
    }
}

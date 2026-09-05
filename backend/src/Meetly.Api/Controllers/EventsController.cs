using Meetly.Api.DTOs;
using Meetly.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Meetly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ILogger<EventsController> _logger;

    public EventsController(IEventService eventService, ILogger<EventsController> logger)
    {
        _eventService = eventService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<EventDetailsDto>> CreateEvent([FromBody] CreateEventRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required." });
        }

        if (request.Dates == null || request.Dates.Count == 0)
        {
            return BadRequest(new { message = "At least one date must be selected." });
        }

        var result = await _eventService.CreateEventAsync(request);
        return CreatedAtAction(nameof(GetEventBySlug), new { slug = result.Slug }, result);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<EventDetailsDto>> GetEventBySlug(string slug)
    {
        var result = await _eventService.GetEventBySlugAsync(slug);
        if (result == null)
        {
            return NotFound(new { message = $"Event with slug '{slug}' was not found." });
        }

        return Ok(result);
    }

    [HttpPost("{slug}/participants")]
    public async Task<ActionResult<ParticipantDto>> JoinEvent(string slug, [FromBody] JoinEventRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Participant name is required." });
        }

        var participant = await _eventService.JoinEventAsync(slug, request);
        if (participant == null)
        {
            return NotFound(new { message = $"Event with slug '{slug}' was not found." });
        }

        return Ok(participant);
    }

    [HttpPost("{slug}/availability")]
    public async Task<IActionResult> UpdateAvailability(string slug, [FromBody] UpdateAvailabilityRequest request)
    {
        var success = await _eventService.UpdateAvailabilityAsync(slug, request);
        if (!success)
        {
            return NotFound(new { message = $"Event '{slug}' or participant was not found." });
        }

        return Ok(new { success = true, slotCount = request.AvailableSlots.Count });
    }
}

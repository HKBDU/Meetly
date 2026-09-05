using System.Security.Cryptography;
using System.Text.Json;
using Meetly.Api.DTOs;
using Meetly.Api.Hubs;
using Meetly.Api.Models;
using Meetly.Api.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace Meetly.Api.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IHubContext<MeetingHub, IMeetingClient> _hubContext;
    private readonly ILogger<EventService> _logger;

    public EventService(
        IEventRepository eventRepository,
        IHubContext<MeetingHub, IMeetingClient> hubContext,
        ILogger<EventService> logger)
    {
        _eventRepository = eventRepository;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<EventDetailsDto> CreateEventAsync(CreateEventRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Title, nameof(request.Title));

        if (request.Dates == null || request.Dates.Count == 0)
        {
            throw new ArgumentException("At least one date must be provided.", nameof(request.Dates));
        }

        string slug;
        do
        {
            slug = GenerateSlug();
        } while (await _eventRepository.SlugExistsAsync(slug));

        var newEvent = new Event
        {
            Slug = slug,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            DatesJson = JsonSerializer.Serialize(request.Dates),
            StartHour = Math.Clamp(request.StartHour, 0, 23),
            EndHour = Math.Clamp(request.EndHour, 1, 24),
            SlotDurationMinutes = request.SlotDurationMinutes is 15 or 30 or 60 ? request.SlotDurationMinutes : 15,
            TimeZone = string.IsNullOrWhiteSpace(request.TimeZone) ? "UTC" : request.TimeZone.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _eventRepository.CreateAsync(newEvent);
        _logger.LogInformation("Event created: {Slug} - {Title}", created.Slug, created.Title);

        return MapToDto(created);
    }

    public async Task<EventDetailsDto?> GetEventBySlugAsync(string slug)
    {
        var evt = await _eventRepository.GetBySlugAsync(slug);
        return evt == null ? null : MapToDto(evt);
    }

    public async Task<ParticipantDto?> JoinEventAsync(string slug, JoinEventRequest request)
    {
        var evt = await _eventRepository.GetBySlugAsync(slug);
        if (evt == null)
        {
            return null;
        }

        var trimmedName = request.Name.Trim();
        var existing = await _eventRepository.GetParticipantByNameAsync(evt.Id, trimmedName);
        if (existing != null)
        {
            var existingSlots = existing.AvailabilitySlots
                .Where(a => a.IsAvailable)
                .Select(a => a.SlotTime)
                .ToList();
            return new ParticipantDto(existing.Id, existing.Name, existing.Color, existingSlots);
        }

        var participant = new Participant
        {
            EventId = evt.Id,
            Name = trimmedName,
            Color = request.Color ?? GetRandomColor(),
            CreatedAt = DateTime.UtcNow
        };

        var saved = await _eventRepository.AddParticipantAsync(participant);
        var dto = new ParticipantDto(saved.Id, saved.Name, saved.Color, new List<DateTime>());

        // Real-time broadcast to all clients in meeting room
        await _hubContext.Clients.Group(evt.Slug.ToLowerInvariant()).ParticipantJoined(dto);
        _logger.LogInformation("Participant {Name} joined event {Slug}", saved.Name, evt.Slug);

        return dto;
    }

    public async Task<bool> UpdateAvailabilityAsync(string slug, UpdateAvailabilityRequest request)
    {
        var evt = await _eventRepository.GetBySlugAsync(slug);
        if (evt == null)
        {
            return false;
        }

        var participant = await _eventRepository.GetParticipantWithSlotsAsync(evt.Id, request.ParticipantId);
        if (participant == null)
        {
            return false;
        }

        await _eventRepository.SaveAvailabilitySlotsAsync(evt.Id, participant.Id, request.AvailableSlots);

        // Real-time broadcast to all clients in meeting room
        var updatePayload = new
        {
            participantId = participant.Id,
            participantName = participant.Name,
            availableSlots = request.AvailableSlots.Distinct().ToList()
        };

        await _hubContext.Clients.Group(evt.Slug.ToLowerInvariant()).AvailabilityUpdated(updatePayload);
        _logger.LogInformation("Availability updated for participant {Name} in event {Slug}", participant.Name, evt.Slug);

        return true;
    }

    private static EventDetailsDto MapToDto(Event evt)
    {
        var dates = JsonSerializer.Deserialize<List<string>>(evt.DatesJson) ?? new List<string>();

        var participantDtos = evt.Participants.Select(p => new ParticipantDto(
            p.Id,
            p.Name,
            p.Color,
            p.AvailabilitySlots.Where(a => a.IsAvailable).Select(a => a.SlotTime).ToList()
        )).ToList();

        var heatmap = evt.AvailabilitySlots
            .Where(a => a.IsAvailable)
            .GroupBy(a => a.SlotTime)
            .Select(g => new SlotCountDto(
                g.Key,
                g.Count(),
                g.Select(s => s.Participant?.Name ?? "Participant").Distinct().ToList()
            ))
            .ToList();

        return new EventDetailsDto(
            evt.Id,
            evt.Slug,
            evt.Title,
            evt.Description,
            dates,
            evt.StartHour,
            evt.EndHour,
            evt.SlotDurationMinutes,
            evt.TimeZone,
            evt.CreatedAt,
            participantDtos,
            heatmap
        );
    }

    private static string GenerateSlug(int length = 7)
    {
        const string chars = "abcdefghjkmnpqrstuvwxyz23456789";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var charsArray = new char[length];
        for (var i = 0; i < length; i++)
        {
            charsArray[i] = chars[bytes[i] % chars.Length];
        }
        return new string(charsArray);
    }

    private static string GetRandomColor()
    {
        string[] colors = ["#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4"];
        return colors[Random.Shared.Next(colors.Length)];
    }
}

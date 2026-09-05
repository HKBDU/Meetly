namespace Meetly.Api.DTOs;

public record CreateEventRequest(
    string Title,
    string? Description,
    List<string> Dates,
    int StartHour,
    int EndHour,
    int SlotDurationMinutes,
    string? TimeZone
);

public record JoinEventRequest(
    string Name,
    string? Color
);

public record UpdateAvailabilityRequest(
    Guid ParticipantId,
    List<DateTime> AvailableSlots
);

public record EventDetailsDto(
    Guid Id,
    string Slug,
    string Title,
    string? Description,
    List<string> Dates,
    int StartHour,
    int EndHour,
    int SlotDurationMinutes,
    string TimeZone,
    DateTime CreatedAt,
    List<ParticipantDto> Participants,
    List<SlotCountDto> Heatmap
);

public record ParticipantDto(
    Guid Id,
    string Name,
    string? Color,
    List<DateTime> AvailableSlots
);

public record SlotCountDto(
    DateTime SlotTime,
    int Count,
    List<string> AvailableParticipants
);

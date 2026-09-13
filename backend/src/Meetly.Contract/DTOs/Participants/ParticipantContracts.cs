namespace Meetly.Contract.DTOs.Participants;

public sealed record ParticipantAccessRequest(string Username, string? Password);

public sealed record ParticipantAccessResponse
{
    public Guid ParticipantId { get; init; }
    public string Username { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
    public bool IsNewParticipant { get; init; }
    public string AccessToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
    public int EventStatus { get; init; }
    public long Revision { get; init; }
    public List<ParticipantTimeSlotResponse> TimeSlots { get; init; } = [];
}

public sealed record ParticipantMeResponse
{
    public Guid ParticipantId { get; init; }
    public string Username { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
    public List<ParticipantTimeSlotResponse> TimeSlots { get; init; } = [];
    public int EventStatus { get; init; }
    public long Revision { get; init; }
}

public sealed record ParticipantTimeSlotResponse(DateOnly? SpecificDate, DayOfWeek? DayOfWeek, string StartTime, string EndTime);

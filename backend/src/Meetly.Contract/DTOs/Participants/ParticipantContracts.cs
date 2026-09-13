using System.Text.Json.Serialization;

namespace Meetly.Contract.DTOs.Participants;

public record ParticipantAccessRequest(string Username, string? Password);

public sealed record SaveParticipantRequest
{
    public string Username { get; init; } = string.Empty;
    public string? Password { get; init; }
    public string? Email { get; init; }
    public string? InputMode { get; init; }
    public List<ParticipantTimeSlotRequest> TimeSlots { get; init; } = [];
}

public sealed record ParticipantTimeSlotRequest
{
    [JsonPropertyName("date")]
    public string? Date { get; init; }
    public string? Weekday { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
}

public sealed record ParticipantAccessResponse(bool IsAdmin, string? AccessToken, List<ParticipantTimeSlotResponse> TimeSlots);

public sealed record ParticipantTimeSlotResponse(
    [property: JsonPropertyName("date")] string? Date,
    string? Weekday,
    string StartTime,
    string EndTime);

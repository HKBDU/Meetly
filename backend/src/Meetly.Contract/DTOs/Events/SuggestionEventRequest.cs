namespace Meetly.Contract.DTOs.Events;

public record SuggestionEventRequest
{
    public int? MinDuration { get; init; }
    public string? KeyParticipant { get; init; }
}

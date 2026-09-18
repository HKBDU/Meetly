namespace Meetly.Service.SuggestionSlots;

public sealed record SuggestionEventRequest
{
    public int? MinDuration { get; init; }
    public string? KeyParticipant { get; init; }
}

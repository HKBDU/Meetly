namespace Meetly.Contract.DTOs.Events;

public record SuggestionEventResponse
{
    public List<TimeSlotsSuggestionRequest>? SuggestedSlots { get; init; } = [];
}

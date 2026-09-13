using System.Security.Claims;
using Meetly.Contract.DTOs.Events;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Repository.SuggestionSlots;

namespace Meetly.Service.SuggestionSlots;

public sealed class SuggestionService : ISuggestionService
{
    private const int DefaultDurationMinutes = 30;
    private readonly ISuggestionRepository _repository;

    public SuggestionService(ISuggestionRepository repository)
    {
        _repository = repository;
    }

    public async Task<SuggestionEventResponse> GetSuggestionEvents(
        string shortCode,
        ClaimsPrincipal user,
        SuggestionEventRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsAdmin(user))
            throw new SuggestionException(403, "Chỉ Admin mới được gợi ý khung giờ.");

        var eventEntity = await _repository.GetEventAsync(shortCode, cancellationToken)
            ?? throw new SuggestionException(404, "Không tìm thấy sự kiện.");

        if (eventEntity.Status != EventStatus.Open)
            throw new SuggestionException(409, "Sự kiện không còn mở để gợi ý khung giờ.");

        var minimumDuration = request.MinDuration ?? DefaultDurationMinutes;
        if (minimumDuration <= 0)
            throw new SuggestionException(422, "minDuration phải lớn hơn 0.");

        var keyParticipant = FindKeyParticipant(eventEntity, request.KeyParticipant);
        var suggestions = new List<TimeSlotsSuggestionRequest>();

        if (eventEntity.EventType == EventType.Dates)
        {
            foreach (var date in eventEntity.AvailableDates
                         .Where(x => x.SpecificDate.HasValue)
                         .Select(x => x.SpecificDate!.Value)
                         .Order())
            {
                suggestions.AddRange(BuildSuggestions(
                    eventEntity, date, null, keyParticipant, minimumDuration));
            }
        }
        else
        {
            foreach (var day in eventEntity.AvailableDates
                         .Where(x => x.DayOfWeek.HasValue)
                         .Select(x => x.DayOfWeek!.Value)
                         .OrderBy(x => (int)x))
            {
                suggestions.AddRange(BuildSuggestions(
                    eventEntity, null, day, keyParticipant, minimumDuration));
            }
        }

        return new SuggestionEventResponse { SuggestedSlots = suggestions };
    }

    private static List<TimeSlotsSuggestionRequest> BuildSuggestions(
        Events eventEntity,
        DateOnly? specificDate,
        Meetly.Repository.Enum.DayOfWeek? dayOfWeek,
        EventParticipants? keyParticipant,
        int minimumDuration)
    {
        var matchingSlots = eventEntity.Participants
            .SelectMany(participant => participant.TimeSlots
                .Where(slot => Matches(slot, specificDate, dayOfWeek))
                .Select(slot => new { Participant = participant, Slot = slot }))
            .ToArray();

        if (matchingSlots.Length == 0)
            return [];

        var boundaries = matchingSlots
            .SelectMany(x => new[] { x.Slot.StartTime, x.Slot.EndTime })
            .Append(eventEntity.DailyStartTime)
            .Append(eventEntity.DailyEndTime)
            .Where(time => time >= eventEntity.DailyStartTime && time <= eventEntity.DailyEndTime)
            .Distinct()
            .Order()
            .ToArray();

        var atomicSlots = new List<SlotCandidate>();
        for (var index = 0; index < boundaries.Length - 1; index++)
        {
            var start = boundaries[index];
            var end = boundaries[index + 1];
            if (start >= end)
                continue;

            var participants = matchingSlots
                .Where(x => x.Slot.StartTime <= start && x.Slot.EndTime >= end)
                .Select(x => x.Participant)
                .DistinctBy(x => x.Id)
                .OrderBy(x => x.Username)
                .ToArray();

            if (keyParticipant is not null && !participants.Any(x => x.Id == keyParticipant.Id))
                continue;

            if (participants.Length > 0)
                atomicSlots.Add(new SlotCandidate(start, end, participants));
        }

        return MergeAdjacent(atomicSlots)
            .Where(x => (x.End - x.Start).TotalMinutes >= minimumDuration)
            .Select(x => new TimeSlotsSuggestionRequest
            {
                SpecificDate = specificDate,
                DayOfWeek = dayOfWeek is null ? null : (System.DayOfWeek)(int)dayOfWeek.Value,
                StartTime = x.Start,
                EndTime = x.End,
                ParticipantCount = x.Participants.Length,
                TotalParticipants = eventEntity.Participants.Count
            })
            .ToList();
    }

    private static IEnumerable<SlotCandidate> MergeAdjacent(
        IEnumerable<SlotCandidate> candidates)
    {
        SlotCandidate? current = null;
        foreach (var candidate in candidates)
        {
            if (current is not null && current.End == candidate.Start &&
                current.Participants.Select(x => x.Id).SequenceEqual(
                    candidate.Participants.Select(x => x.Id)))
            {
                current = current with { End = candidate.End };
                continue;
            }

            if (current is not null)
                yield return current;
            current = candidate;
        }

        if (current is not null)
            yield return current;
    }

    private static EventParticipants? FindKeyParticipant(Events eventEntity, string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return null;

        return eventEntity.Participants.FirstOrDefault(x =>
                   string.Equals(x.Username, username.Trim(), StringComparison.OrdinalIgnoreCase))
               ?? throw new SuggestionException(422, "Key participant không tồn tại trong sự kiện.");
    }

    private static bool Matches(
        TimeSlots slot,
        DateOnly? specificDate,
        Meetly.Repository.Enum.DayOfWeek? dayOfWeek) =>
        specificDate.HasValue ? slot.SpecificDate == specificDate : slot.DayOfWeek == dayOfWeek;

    private static bool IsAdmin(ClaimsPrincipal user) =>
        user.HasClaim("isAdmin", "true") ||
        user.HasClaim("Admin", "true") ||
        user.IsInRole("Admin");

    private sealed record SlotCandidate(
        TimeOnly Start,
        TimeOnly End,
        EventParticipants[] Participants);
}

public sealed class SuggestionException : Exception
{
    public SuggestionException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}

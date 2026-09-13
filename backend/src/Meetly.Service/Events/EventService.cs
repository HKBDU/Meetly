using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using Meetly.Contract.DTOs.Events;
using Meetly.Contract.DTOs.Participants;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Repository.EventScheduling;
using Meetly.Service.JwtService;
using Microsoft.AspNetCore.Identity;

namespace Meetly.Service.EventScheduling;

public sealed class EventService(IEventRepository repository, IJwtService jwt) : IEventService
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private static readonly PasswordHasher<EventParticipants> PasswordHasher = new();

    public async Task<CreateEventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken)
    {
        var dates = ParseDates(request);
        var code = await NewCode(cancellationToken);
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            Title = Required(request.Title, "title"),
            EventType = (EventType)request.EventType,
            ShortCode = code,
            URL = $"https://meetly.com/{code}",
            TimeZone = "Asia/Ho_Chi_Minh",
            DailyStartTime = request.DailyStartTime,
            DailyEndTime = request.DailyEndTime,
            AvailableDates = dates,
            CreatedAt = DateTimeOffset.UtcNow
        };
        ValidateHours(entity);
        repository.Add(entity);
        await repository.SaveChangesAsync(cancellationToken);
        return new CreateEventResponse(code, entity.URL);
    }

    public async Task<EventResponse> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        ToResponse(await GetEventAsync(shortCode, cancellationToken));

    public async Task<ParticipantAccessResponse> AccessAsync(string shortCode, ParticipantAccessRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        var participant = entity.Participants.SingleOrDefault(x => string.Equals(x.Username, Required(request.Username, "username"), StringComparison.OrdinalIgnoreCase));
        if (participant is null) return new ParticipantAccessResponse(false, null, []);
        Verify(participant, request.Password);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, participant.Id.ToString()), new Claim("participantId", participant.Id.ToString()),
            new Claim("isAdmin", participant.IsAdmin.ToString().ToLowerInvariant()),
            new Claim(ClaimTypes.Role, participant.IsAdmin ? "Admin" : "User")
        };
        return new ParticipantAccessResponse(participant.IsAdmin, jwt.GenerateAccessToken(claims), participant.TimeSlots.Select(ToParticipantSlot).ToList());
    }

    public async Task SaveParticipantAsync(string shortCode, SaveParticipantRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is finalized.");
        ValidateEmail(request.Email);
        var name = Required(request.Username, "username");
        var participant = entity.Participants.SingleOrDefault(x => string.Equals(x.Username, name, StringComparison.OrdinalIgnoreCase));
        if (participant is null)
        {
            participant = new EventParticipants
            {
                Id = Guid.NewGuid(),
                EventId = entity.Id,
                Username = name,
                IsAdmin = !entity.Participants.Any(),
                PasswordHash = string.IsNullOrWhiteSpace(request.Password) ? null : PasswordHasher.HashPassword(null!, request.Password),
                CreatedAt = DateTimeOffset.UtcNow
            };
            repository.Add(participant);
        }
        else Verify(participant, request.Password);

        repository.ReplaceSlots(participant, request.TimeSlots.Select(x => ToSlot(entity, participant, x)));
        if (!string.IsNullOrWhiteSpace(request.Email) && !await repository.EmailExistsAsync(entity.Id, request.Email.Trim(), cancellationToken))
            repository.Add(new EventEmails { Id = Guid.NewGuid(), EventId = entity.Id, Email = request.Email.Trim(), CreatedAt = DateTimeOffset.UtcNow });
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<FinalizeEventResponse> FinalizeAsync(string shortCode, ClaimsPrincipal user, FinalizeEventRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        RequireAdmin(entity, user);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is already finalized.");
        SetFinalTime(entity, request);
        entity.Status = EventStatus.Finalized;
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        return new FinalizeEventResponse(
            (int)entity.Status,
            new FinalScheduleResponse(
                entity.FinalDate?.ToString("yyyy-MM-dd"),
                entity.FinalDayOfWeek is null ? null : (int)entity.FinalDayOfWeek.Value,
                Format(entity.FinalStartTime!.Value),
                Format(entity.FinalEndTime!.Value)),
            entity.Revision);
    }

    public async Task UpdateAsync(string shortCode, UpdateEventRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        var admin = entity.Participants
                        .SingleOrDefault(x => x.IsAdmin && string.Equals(x.Username, Required(request.AdminUsername, "adminUsername"), StringComparison.OrdinalIgnoreCase))
            ?? throw new EventException(403, "Admin credentials are invalid.");
        Verify(admin, request.AdminPassword);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is finalized.");

        entity.Title = Required(request.Title, "title");
        entity.EventType = (EventType)request.EventType;
        entity.DailyStartTime = request.DailyStartTime;
        entity.DailyEndTime = request.DailyEndTime;
        ValidateHours(entity);
        repository.ReplaceAvailableDates(entity, ParseDates(request));
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
    }

    private async Task<Events> GetEventAsync(string shortCode, CancellationToken cancellationToken) =>
        await repository.GetAsync(shortCode, cancellationToken) ?? throw new EventException(404, "Event not found.");

    private async Task<string> NewCode(CancellationToken cancellationToken)
    {
        string code;
        do code = RandomNumberGenerator.GetString(Alphabet, 6);
        while (await repository.ShortCodeExistsAsync(code, cancellationToken));
        return code;
    }

    private static List<EventAvailableDates> ParseDates(CreateEventRequest request)
    {
        if (request.EventType is not ((int)EventType.Dates or (int)EventType.Weekdays) || request.AvailableDates.Count == 0)
            throw new EventException(422, "eventType and availableDates are invalid.");
        var values = request.AvailableDates.Select(x => Required(x, "availableDates")).ToArray();
        if (values.Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length) throw new EventException(422, "availableDates contains duplicates.");
        return request.EventType == (int)EventType.Dates
            ? values.Select(x => DateOnly.TryParse(x, out var date) ? new EventAvailableDates { Id = Guid.NewGuid(), SpecificDate = date, CreatedAt = DateTimeOffset.UtcNow } : throw new EventException(422, "availableDates must contain ISO dates.")).ToList()
            : values.Select(x => Enum.TryParse<System.DayOfWeek>(x, true, out var day) ? new EventAvailableDates { Id = Guid.NewGuid(), DayOfWeek = (Meetly.Repository.Enum.DayOfWeek)(int)day, CreatedAt = DateTimeOffset.UtcNow } : throw new EventException(422, "availableDates must contain weekday names.")).ToList();
    }

    private static TimeSlots ToSlot(Events entity, EventParticipants participant, ParticipantTimeSlotRequest request)
    {
        if (request.StartTime >= request.EndTime || request.StartTime < entity.DailyStartTime || request.EndTime > entity.DailyEndTime)
            throw new EventException(422, "Time slot is outside the event hours.");
        if (string.IsNullOrWhiteSpace(request.Date) == string.IsNullOrWhiteSpace(request.Weekday))
            throw new EventException(422, "A time slot requires exactly one date or weekday.");
        if (DateOnly.TryParse(request.Date, out var date) && entity.EventType == EventType.Dates && entity.AvailableDates.Any(x => x.SpecificDate == date))
            return NewSlot(entity, participant, date, null, request);
        if (Enum.TryParse<System.DayOfWeek>(request.Weekday, true, out var day) && entity.EventType == EventType.Weekdays && entity.AvailableDates.Any(x => x.DayOfWeek == (Meetly.Repository.Enum.DayOfWeek)(int)day))
            return NewSlot(entity, participant, null, (Meetly.Repository.Enum.DayOfWeek)(int)day, request);
        throw new EventException(422, "Time slot does not belong to the event.");
    }

    private static TimeSlots NewSlot(Events entity, EventParticipants participant, DateOnly? date, Meetly.Repository.Enum.DayOfWeek? day, ParticipantTimeSlotRequest request) => new()
    {
        Id = Guid.NewGuid(),
        EventId = entity.Id,
        ParticipantId = participant.Id,
        SpecificDate = date,
        DayOfWeek = day,
        StartTime = request.StartTime,
        EndTime = request.EndTime,
        CreatedAt = DateTimeOffset.UtcNow
    };

    private static EventResponse ToResponse(Events entity) => new()
    {
        Title = entity.Title,
        ShortCode = entity.ShortCode,
        Url = entity.URL,
        EventType = (int)entity.EventType,
        AvailableDates = entity.AvailableDates.Select(x => x.SpecificDate?.ToString("yyyy-MM-dd") ?? x.DayOfWeek!.Value.ToString()).ToList(),
        DailyStartTime = Format(entity.DailyStartTime),
        DailyEndTime = Format(entity.DailyEndTime),
        IsFinalized = entity.Status == EventStatus.Finalized,
        FinalStartTime = entity.FinalStartTime is null || entity.FinalDate is null ? null : At(entity.FinalDate.Value, entity.FinalStartTime.Value),
        FinalEndTime = entity.FinalEndTime is null || entity.FinalDate is null ? null : At(entity.FinalDate.Value, entity.FinalEndTime.Value),
        Participants = entity.Participants.Select(x => new EventParticipantResponse(x.Username, x.TimeSlots.Select(y => new EventTimeSlotResponse(
            y.SpecificDate is null ? $"{y.DayOfWeek}T{Format(y.StartTime)}:00+07:00" : At(y.SpecificDate.Value, y.StartTime).ToString("yyyy-MM-ddTHH:mm:sszzz"),
            y.SpecificDate is null ? $"{y.DayOfWeek}T{Format(y.EndTime)}:00+07:00" : At(y.SpecificDate.Value, y.EndTime).ToString("yyyy-MM-ddTHH:mm:sszzz"))).ToList())).ToList(),
        HeatmapGrid = Heatmap(entity)
    };

    private static Dictionary<string, List<string>> Heatmap(Events entity)
    {
        var result = new Dictionary<string, List<string>>();
        foreach (var available in entity.AvailableDates)
            for (var start = entity.DailyStartTime; start < entity.DailyEndTime; start = start.AddMinutes(30))
            {
                var end = start.AddMinutes(30) > entity.DailyEndTime ? entity.DailyEndTime : start.AddMinutes(30);
                var key = available.SpecificDate is { } date ? At(date, start).ToString("yyyy-MM-ddTHH:mm:sszzz") : $"{available.DayOfWeek}T{start:HH:mm:ss}+07:00";
                result[key] = entity.Participants.Where(p => p.TimeSlots.Any(s => s.SpecificDate == available.SpecificDate && s.DayOfWeek == available.DayOfWeek && s.StartTime <= start && s.EndTime >= end)).Select(p => p.Username).Order().ToList();
            }
        return result;
    }

    private static ParticipantTimeSlotResponse ToParticipantSlot(TimeSlots slot) => new(slot.SpecificDate?.ToString("yyyy-MM-dd"), slot.DayOfWeek?.ToString(), Format(slot.StartTime), Format(slot.EndTime));
    private static void RequireAdmin(Events entity, ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("participantId");
        if (!Guid.TryParse(value, out var id) || !entity.Participants.Any(x => x.Id == id && x.IsAdmin)) throw new EventException(403, "Admin access is required.");
    }
    private static void SetFinalTime(Events entity, FinalizeEventRequest request)
    {
        if (request.StartTime >= request.EndTime)
            throw new EventException(422, "startTime must be before endTime.");
        if (request.StartTime < entity.DailyStartTime || request.EndTime > entity.DailyEndTime)
            throw new EventException(422, "Final time is outside the event hours.");

        if (entity.EventType == EventType.Dates)
        {
            if (request.SpecificDate is null || request.DayOfWeek is not null)
                throw new EventException(422, "Dates event requires specificDate only.");
            if (!entity.AvailableDates.Any(x => x.SpecificDate == request.SpecificDate))
                throw new EventException(422, "specificDate does not belong to the event.");

            entity.FinalDate = request.SpecificDate;
            entity.FinalDayOfWeek = null;
        }
        else
        {
            if (request.SpecificDate is not null || request.DayOfWeek is null || request.DayOfWeek is < 0 or > 6)
                throw new EventException(422, "Weekdays event requires a valid dayOfWeek only.");
            var day = (Meetly.Repository.Enum.DayOfWeek)request.DayOfWeek.Value;
            if (!entity.AvailableDates.Any(x => x.DayOfWeek == day))
                throw new EventException(422, "dayOfWeek does not belong to the event.");

            entity.FinalDate = null;
            entity.FinalDayOfWeek = day;
        }

        entity.FinalStartTime = request.StartTime;
        entity.FinalEndTime = request.EndTime;
    }
    private static DateTimeOffset At(DateOnly date, TimeOnly time) => new(date.ToDateTime(time), VietnamOffset);
    private static string Format(TimeOnly time) => time.ToString("HH:mm");
    private static string Required(string? value, string name) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new EventException(422, $"{name} is required.");
    private static void ValidateHours(Events entity) { if (entity.DailyStartTime >= entity.DailyEndTime) throw new EventException(422, "dailyStartTime must be before dailyEndTime."); }
    private static void ValidateEmail(string? email) { if (!string.IsNullOrWhiteSpace(email)) try { _ = new MailAddress(email.Trim()); } catch (FormatException) { throw new EventException(422, "email is invalid."); } }
    private static void Verify(EventParticipants participant, string? password) { if (participant.PasswordHash is not null && (string.IsNullOrEmpty(password) || PasswordHasher.VerifyHashedPassword(participant, participant.PasswordHash, password) == PasswordVerificationResult.Failed)) throw new EventException(401, "Password is invalid."); }
}

public sealed class EventException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

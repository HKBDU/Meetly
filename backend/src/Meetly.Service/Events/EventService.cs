using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Repository.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Meetly.Service.Scheduling;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace Meetly.Service.EventScheduling;

public sealed class EventService(IEventRepository repository, IJwtService jwt, IEventRealtimeNotifier notifier, IConfiguration configuration) : IEventService
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int SlotMinutes = 15;
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private static readonly PasswordHasher<EventParticipants> PasswordHasher = new();
    private readonly string _publicBaseUrl = (configuration["PublicBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');

    public async Task<CreateEventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken)
    {
        ValidatePassword(request.Admin.Password);
        var code = await NewCode(cancellationToken);
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            Title = Required(request.Title, "title", 255),
            EventType = (EventType)request.EventType,
            ShortCode = code,
            URL = $"{_publicBaseUrl}/event/{code}",
            TimeZone = "Asia/Ho_Chi_Minh",
            DailyStartTime = request.DailyStartTime,
            DailyEndTime = request.DailyEndTime,
            AvailableDates = ParseCreateDates(request),
            CreatedAt = DateTimeOffset.UtcNow
        };
        ValidateHours(entity);
        var admin = new EventParticipants
        {
            Id = Guid.NewGuid(),
            EventId = entity.Id,
            Username = Required(request.Admin.Username, "admin.username", 100),
            IsAdmin = true,
            PasswordHash = string.IsNullOrWhiteSpace(request.Admin.Password) ? null : PasswordHasher.HashPassword(null!, request.Admin.Password),
            CreatedAt = DateTimeOffset.UtcNow
        };
        repository.Add(entity);
        repository.Add(admin);
        await repository.SaveChangesAsync(cancellationToken);
        var access = IssueToken(entity, admin);
        return new CreateEventResponse
        {
            ShortCode = code,
            Url = entity.URL,
            ParticipantId = admin.Id,
            IsAdmin = true,
            AccessToken = access.Token,
            ExpiresAt = access.ExpiresAt,
            Status = (int)entity.Status,
            Revision = entity.Revision
        };
    }

    public async Task<EventResponse> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        ToResponse(await GetEventAsync(shortCode, cancellationToken));

    public async Task<ParticipantAccessResponse> AccessAsync(string shortCode, ParticipantAccessRequest request, CancellationToken cancellationToken)
    {
        ValidatePassword(request.Password);
        var entity = await GetEventAsync(shortCode, cancellationToken);
        var name = Required(request.Username, "username", 100);
        var participant = entity.Participants.SingleOrDefault(x => string.Equals(x.Username, name, StringComparison.OrdinalIgnoreCase));
        var isNew = participant is null;
        if (participant is null)
        {
            participant = new EventParticipants
            {
                Id = Guid.NewGuid(),
                EventId = entity.Id,
                Username = name,
                PasswordHash = string.IsNullOrWhiteSpace(request.Password) ? null : PasswordHasher.HashPassword(null!, request.Password),
                IsAdmin = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            repository.Add(participant);
            entity.Revision++;
            entity.UpdatedAt = DateTimeOffset.UtcNow;
            await repository.SaveChangesAsync(cancellationToken);
            await notifier.NotifyEventUpdatedAsync(shortCode, entity.Revision, cancellationToken);
        }
        else Verify(participant, request.Password);

        var access = IssueToken(entity, participant);
        return new ParticipantAccessResponse
        {
            ParticipantId = participant.Id,
            Username = participant.Username,
            IsAdmin = participant.IsAdmin,
            IsNewParticipant = isNew,
            AccessToken = access.Token,
            ExpiresAt = access.ExpiresAt,
            EventStatus = (int)entity.Status,
            Revision = entity.Revision,
            TimeSlots = participant.TimeSlots.Select(ToParticipantSlot).ToList()
        };
    }

    public async Task<ParticipantMeResponse> GetCurrentParticipantAsync(string shortCode, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        var id = user.FindFirstValue("participantId");
        if (!Guid.TryParse(id, out var participantId) || user.FindFirstValue("eventId") != entity.Id.ToString())
            throw new EventException(403, "Token does not belong to this event.");
        var participant = entity.Participants.SingleOrDefault(x => x.Id == participantId)
            ?? throw new EventException(404, "Participant not found.");
        return new ParticipantMeResponse
        {
            ParticipantId = participant.Id,
            Username = participant.Username,
            IsAdmin = participant.IsAdmin,
            TimeSlots = participant.TimeSlots.Select(ToParticipantSlot).ToList(),
            EventStatus = (int)entity.Status,
            Revision = entity.Revision
        };
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
        var response = new FinalizeEventResponse(
            (int)entity.Status,
            new FinalScheduleResponse(
                entity.FinalDate?.ToString("yyyy-MM-dd"),
                entity.FinalDayOfWeek is null ? null : (int)entity.FinalDayOfWeek.Value,
                Format(entity.FinalStartTime!.Value),
                Format(entity.FinalEndTime!.Value)),
            entity.Revision);
        await notifier.NotifyEventFinalizedAsync(shortCode, response, cancellationToken);
        return response;
    }

    public async Task<UpdateEventResponse> UpdateAsync(string shortCode, ClaimsPrincipal user, UpdateEventRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        RequireAdmin(entity, user);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is finalized.");

        var dates = ParseUpdateDates(request);
        entity.Title = Required(request.Title, "title", 255);
        entity.EventType = (EventType)request.EventType;
        entity.DailyStartTime = request.DailyStartTime;
        entity.DailyEndTime = request.DailyEndTime;
        ValidateHours(entity);

        foreach (var participant in entity.Participants)
        {
            var validSlots = new List<TimeSlots>();
            foreach (var slot in participant.TimeSlots.Where(slot => request.EventType == (int)EventType.Dates
                    ? slot.SpecificDate.HasValue && dates.Any(date => date.SpecificDate == slot.SpecificDate)
                    : slot.DayOfWeek.HasValue && dates.Any(date => date.DayOfWeek == slot.DayOfWeek)))
            {
                if (!ScheduleTime.TryClip(entity.DailyStartTime, entity.DailyEndTime, slot.StartTime, slot.EndTime, out var start, out var end)) continue;
                validSlots.Add(new TimeSlots
                {
                    Id = Guid.NewGuid(),
                    EventId = entity.Id,
                    ParticipantId = participant.Id,
                    SpecificDate = slot.SpecificDate,
                    DayOfWeek = slot.DayOfWeek,
                    StartTime = start,
                    EndTime = end,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }
            repository.ReplaceSlots(participant, validSlots);
        }

        repository.ReplaceAvailableDates(entity, dates);
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        await notifier.NotifyEventUpdatedAsync(shortCode, entity.Revision, cancellationToken);
        return new UpdateEventResponse(entity.Revision);
    }

    private async Task<Events> GetEventAsync(string shortCode, CancellationToken cancellationToken) =>
        await repository.GetAsync(shortCode, cancellationToken) ?? throw new EventException(404, "Event not found.");

    private async Task<string> NewCode(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var code = RandomNumberGenerator.GetString(Alphabet, 6);
            if (!await repository.ShortCodeExistsAsync(code, cancellationToken)) return code;
        }
        throw new EventException(503, "Could not allocate an event code. Please retry.");
    }

    private (string Token, DateTimeOffset ExpiresAt) IssueToken(Events entity, EventParticipants participant)
    {
        var token = jwt.GenerateAccessToken(
        [
            new Claim(ClaimTypes.NameIdentifier, participant.Id.ToString()), new Claim("participantId", participant.Id.ToString()),
            new Claim("eventId", entity.Id.ToString()), new Claim("shortCode", entity.ShortCode),
            new Claim("isAdmin", participant.IsAdmin.ToString().ToLowerInvariant()),
            new Claim(ClaimTypes.Role, participant.IsAdmin ? "Admin" : "User")
        ]);
        var expiresAt = new DateTimeOffset(new JwtSecurityTokenHandler().ReadJwtToken(token).ValidTo, TimeSpan.Zero).ToOffset(VietnamOffset);
        return (token, expiresAt);
    }

    private static List<EventAvailableDates> ParseCreateDates(CreateEventRequest request)
    {
        if (request.EventType == (int)EventType.Dates && request.AvailableDates.Count > 0 && request.AvailableWeekdays.Count == 0 && request.AvailableDates.All(date => date >= VietnamToday()))
            return request.AvailableDates.Distinct().Select(date => new EventAvailableDates { Id = Guid.NewGuid(), SpecificDate = date, CreatedAt = DateTimeOffset.UtcNow }).ToList();
        if (request.EventType == (int)EventType.Weekdays && request.AvailableDates.Count == 0 && request.AvailableWeekdays.Count > 0 && request.AvailableWeekdays.All(day => (int)day is >= 0 and <= 6))
            return request.AvailableWeekdays.Distinct().Select(day => new EventAvailableDates { Id = Guid.NewGuid(), DayOfWeek = (Meetly.Repository.Enum.DayOfWeek)(int)day, CreatedAt = DateTimeOffset.UtcNow }).ToList();
        throw new EventException(422, "Event dates and weekdays are invalid.");
    }

    private static List<EventAvailableDates> ParseUpdateDates(UpdateEventRequest request)
    {
        return ParseCreateDates(new CreateEventRequest
        {
            EventType = request.EventType,
            AvailableDates = request.AvailableDates,
            AvailableWeekdays = request.AvailableWeekdays
        });
    }

    private static EventResponse ToResponse(Events entity) => new()
    {
        Title = entity.Title,
        ShortCode = entity.ShortCode,
        Url = entity.URL,
        EventType = (int)entity.EventType,
        TimeZone = entity.TimeZone,
        AvailableDates = entity.AvailableDates.Where(x => x.SpecificDate.HasValue).Select(x => x.SpecificDate!.Value).Order().ToList(),
        AvailableWeekdays = entity.AvailableDates.Where(x => x.DayOfWeek.HasValue).Select(x => (System.DayOfWeek)(int)x.DayOfWeek!.Value).OrderBy(x => (int)x).ToList(),
        DailyStartTime = Format(entity.DailyStartTime),
        DailyEndTime = Format(entity.DailyEndTime),
        Status = (int)entity.Status,
        Revision = entity.Revision,
        Participants = entity.Participants.Select(x => new EventParticipantResponse(x.Username)).ToList(),
        HeatmapGrid = Heatmap(entity),
        FinalSchedule = entity.Status != EventStatus.Finalized ? null : new FinalScheduleResponse(
            entity.EventType == EventType.Dates ? entity.FinalDate?.ToString("yyyy-MM-dd") : null,
            entity.EventType == EventType.Weekdays ? (int?)entity.FinalDayOfWeek : null,
            Format(entity.FinalStartTime!.Value), Format(entity.FinalEndTime!.Value))
    };

    private static List<HeatmapCellResponse> Heatmap(Events entity)
    {
        var result = new List<HeatmapCellResponse>();
        foreach (var available in entity.AvailableDates
                     .OrderBy(x => x.SpecificDate)
                     .ThenBy(x => x.DayOfWeek))
            foreach (var (start, end) in ScheduleTime.Cells(entity.DailyStartTime, entity.DailyEndTime, SlotMinutes))
            {
                var participants = entity.Participants.Where(p => p.TimeSlots.Any(s => s.SpecificDate == available.SpecificDate && s.DayOfWeek == available.DayOfWeek && ScheduleTime.Covers(entity.DailyStartTime, s.StartTime, s.EndTime, start, end))).Select(p => p.Username).Order().ToList();
                result.Add(new HeatmapCellResponse(available.SpecificDate, available.DayOfWeek is null ? null : (System.DayOfWeek)(int)available.DayOfWeek.Value, Format(start), participants, participants.Count));
            }
        return result;
    }

    private static ParticipantTimeSlotResponse ToParticipantSlot(TimeSlots slot) => new(slot.SpecificDate, slot.DayOfWeek is null ? null : (System.DayOfWeek)(int)slot.DayOfWeek.Value, Format(slot.StartTime), Format(slot.EndTime));
    private static void RequireAdmin(Events entity, ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("participantId");
        if (!Guid.TryParse(value, out var id) || user.FindFirstValue("eventId") != entity.Id.ToString() || !entity.Participants.Any(x => x.Id == id && x.IsAdmin)) throw new EventException(403, "Admin access is required.");
    }
    private static void SetFinalTime(Events entity, FinalizeEventRequest request)
    {
        if (request.StartTime == request.EndTime)
            throw new EventException(422, "Final time must be longer than 0 minutes.");
        if (!Aligned(request.StartTime) || !Aligned(request.EndTime))
            throw new EventException(422, "Final time must align to 15-minute intervals.");
        if (!ScheduleTime.Contains(entity.DailyStartTime, entity.DailyEndTime, request.StartTime, request.EndTime))
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
    private static string Format(TimeOnly time) => time.ToString("HH:mm");
    private static string Required(string? value, string name, int maxLength)
    {
        var result = !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new EventException(422, $"{name} is required.");
        return result.Length <= maxLength ? result : throw new EventException(422, $"{name} is too long.");
    }
    private static bool Aligned(TimeOnly time) => time.Minute % SlotMinutes == 0 && time.Second == 0;
    private static DateOnly VietnamToday() => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
    private static void ValidateHours(Events entity)
    {
        if (entity.DailyStartTime == entity.DailyEndTime) throw new EventException(422, "Event hours must be longer than 0 minutes.");
        if (!Aligned(entity.DailyStartTime) || !Aligned(entity.DailyEndTime)) throw new EventException(422, "Event hours must align to 15-minute intervals.");
    }
    private static void ValidatePassword(string? password)
    {
        if (password?.Length > 128) throw new EventException(422, "password is too long.");
    }
    private static void Verify(EventParticipants participant, string? password) { if (participant.PasswordHash is not null && (string.IsNullOrEmpty(password) || PasswordHasher.VerifyHashedPassword(participant, participant.PasswordHash, password) == PasswordVerificationResult.Failed)) throw new EventException(401, "Password is invalid."); }
}

public sealed class EventException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

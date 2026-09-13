using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using Meetly.Contract.DTOs.Common;
using Meetly.Contract.DTOs.Events;
using Meetly.Contract.DTOs.Participants;
using Meetly.Repository;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Service.JwtService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Meetly.API.Controllers;

[ApiController]
[Route("api/v1/events")]
public sealed class EventsController(AppDbContext db, IJwtService jwt) : ControllerBase
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static readonly PasswordHasher<EventParticipants> PasswordHasher = new();
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CreateEventResponse>>> Create(CreateEventRequest request, CancellationToken ct)
    {
        var dates = ParseDates(request);
        var code = await NewCode(ct);
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
        db.Events.Add(entity);
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<CreateEventResponse>.Success(200, "Event created successfully", new(code, entity.URL)));
    }

    [HttpGet("{shortCode}")]
    public async Task<ActionResult<ApiResponse<EventResponse>>> Get(string shortCode, CancellationToken ct)
    {
        var entity = await Events().SingleOrDefaultAsync(x => x.ShortCode == shortCode, ct) ?? throw Missing();
        return Ok(ApiResponse<EventResponse>.Success(200, "Event loaded successfully", ToResponse(entity)));
    }

    [HttpPost("{shortCode}/participants/access")]
    public async Task<ActionResult<ApiResponse<ParticipantAccessResponse>>> Access(string shortCode, ParticipantAccessRequest request, CancellationToken ct)
    {
        var entity = await Events().SingleOrDefaultAsync(x => x.ShortCode == shortCode, ct) ?? throw Missing();
        var participant = entity.Participants.SingleOrDefault(x => string.Equals(x.Username, Required(request.Username, "username"), StringComparison.OrdinalIgnoreCase));
        if (participant is null)
            return Ok(ApiResponse<ParticipantAccessResponse>.Success(200, "Participant not found", new(false, null, [])));
        Verify(participant, request.Password);
        var claims = new[]
        {
            new System.Security.Claims.Claim(ClaimTypes.NameIdentifier, participant.Id.ToString()), new System.Security.Claims.Claim("participantId", participant.Id.ToString()),
            new System.Security.Claims.Claim("isAdmin", participant.IsAdmin.ToString().ToLowerInvariant()),
            new System.Security.Claims.Claim(ClaimTypes.Role, participant.IsAdmin ? "Admin" : "User")
        };
        return Ok(ApiResponse<ParticipantAccessResponse>.Success(200, "Participant loaded successfully",
            new(participant.IsAdmin, jwt.GenerateAccessToken(claims), participant.TimeSlots.Select(ToParticipantSlot).ToList())));
    }

    [HttpPost("{shortCode}/participants")]
    public async Task<ActionResult<ApiResponse<object?>>> Save(string shortCode, SaveParticipantRequest request, CancellationToken ct)
    {
        var entity = await Events().SingleOrDefaultAsync(x => x.ShortCode == shortCode, ct) ?? throw Missing();
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
            db.EventParticipants.Add(participant);
        }
        else Verify(participant, request.Password);

        var slots = request.TimeSlots.Select(x => ToSlot(entity, participant, x)).ToArray();
        db.TimeSlots.RemoveRange(participant.TimeSlots);
        await db.TimeSlots.AddRangeAsync(slots, ct);
        if (!string.IsNullOrWhiteSpace(request.Email) && !await db.EventEmails.AnyAsync(x => x.EventId == entity.Id && x.Email == request.Email.Trim(), ct))
            db.EventEmails.Add(new EventEmails { Id = Guid.NewGuid(), EventId = entity.Id, Email = request.Email.Trim(), CreatedAt = DateTimeOffset.UtcNow });
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<object?>.Success(200, "Availability saved successfully", null));
    }

    [Authorize]
    [HttpPost("{shortCode}/finalize")]
    public async Task<ActionResult<ApiResponse<object?>>> Finalize(string shortCode, FinalizeEventRequest request, CancellationToken ct)
    {
        var entity = await Events().SingleOrDefaultAsync(x => x.ShortCode == shortCode, ct) ?? throw Missing();
        RequireAdmin(entity);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is already finalized.");
        SetFinalTime(entity, request.FinalStartTime, request.FinalEndTime);
        entity.Status = EventStatus.Finalized;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<object?>.Success(200, "Event finalized successfully", null));
    }

    [HttpPut("{shortCode}")]
    public async Task<ActionResult<ApiResponse<object?>>> Update(string shortCode, UpdateEventRequest request, CancellationToken ct)
    {
        var entity = await Events().SingleOrDefaultAsync(x => x.ShortCode == shortCode, ct) ?? throw Missing();
        var admin = entity.Participants.SingleOrDefault(x => x.IsAdmin && string.Equals(x.Username, Required(request.AdminUsername, "adminUsername"), StringComparison.OrdinalIgnoreCase))
            ?? throw new EventException(403, "Admin credentials are invalid.");
        Verify(admin, request.AdminPassword);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is finalized.");
        var dates = ParseDates(request);
        entity.Title = Required(request.Title, "title");
        entity.EventType = (EventType)request.EventType;
        entity.DailyStartTime = request.DailyStartTime;
        entity.DailyEndTime = request.DailyEndTime;
        ValidateHours(entity);
        db.EventAvailableDates.RemoveRange(entity.AvailableDates);
        entity.AvailableDates = dates;
        entity.Revision++;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<object?>.Success(200, "Event updated successfully", null));
    }

    private IQueryable<Events> Events() => db.Events.Include(x => x.AvailableDates).Include(x => x.Participants).ThenInclude(x => x.TimeSlots);

    private async Task<string> NewCode(CancellationToken ct)
    {
        string code;
        do code = RandomNumberGenerator.GetString(Alphabet, 6); while (await db.Events.AnyAsync(x => x.ShortCode == code, ct));
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
    private void RequireAdmin(Events entity)
    {
        var value = User.FindFirstValue("participantId");
        if (!Guid.TryParse(value, out var id) || !entity.Participants.Any(x => x.Id == id && x.IsAdmin)) throw new EventException(403, "Admin access is required.");
    }
    private static void SetFinalTime(Events entity, DateTimeOffset start, DateTimeOffset end)
    {
        if (start.Offset != VietnamOffset || end.Offset != VietnamOffset || start.Date != end.Date || start >= end) throw new EventException(422, "Final time is invalid.");
        var date = DateOnly.FromDateTime(start.DateTime); var from = TimeOnly.FromDateTime(start.DateTime); var to = TimeOnly.FromDateTime(end.DateTime);
        if (from < entity.DailyStartTime || to > entity.DailyEndTime || (entity.EventType == EventType.Dates && !entity.AvailableDates.Any(x => x.SpecificDate == date)) || (entity.EventType == EventType.Weekdays && !entity.AvailableDates.Any(x => x.DayOfWeek == (Meetly.Repository.Enum.DayOfWeek)(int)start.DayOfWeek))) throw new EventException(422, "Final time does not belong to the event.");
        entity.FinalDate = date; entity.FinalDayOfWeek = entity.EventType == EventType.Weekdays ? (Meetly.Repository.Enum.DayOfWeek)(int)start.DayOfWeek : null; entity.FinalStartTime = from; entity.FinalEndTime = to;
    }
    private static DateTimeOffset At(DateOnly date, TimeOnly time) => new(date.ToDateTime(time), VietnamOffset);
    private static string Format(TimeOnly time) => time.ToString("HH:mm");
    private static string Required(string? value, string name) => !string.IsNullOrWhiteSpace(value) ? value.Trim() : throw new EventException(422, $"{name} is required.");
    private static void ValidateHours(Events entity) { if (entity.DailyStartTime >= entity.DailyEndTime) throw new EventException(422, "dailyStartTime must be before dailyEndTime."); }
    private static void ValidateEmail(string? email) { if (!string.IsNullOrWhiteSpace(email)) try { _ = new MailAddress(email.Trim()); } catch (FormatException) { throw new EventException(422, "email is invalid."); } }
    private static void Verify(EventParticipants participant, string? password) { if (participant.PasswordHash is not null && (string.IsNullOrEmpty(password) || PasswordHasher.VerifyHashedPassword(participant, participant.PasswordHash, password) == PasswordVerificationResult.Failed)) throw new EventException(401, "Password is invalid."); }
    private static EventException Missing() => new(404, "Event not found.");
}

public sealed class EventException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;
using Meetly.Repository.EventScheduling;
using Meetly.Service.Common;
using Meetly.Service.Email;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Meetly.Service.EventScheduling;

public sealed class EventService(
    IEventRepository repository,
    IJwtService jwt,
    IEventRealtimeNotifier notifier,
    IEmailQueue emailQueue,
    IOptions<AppOptions> appOptions,
    ILogger<EventService> logger) : IEventService
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private static readonly PasswordHasher<EventParticipants> PasswordHasher = new();

    public async Task<CreateEventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken)
    {
        var title = Text(request.Title, "title", InputLimits.TitleMaxLength);
        var adminName = Text(request.Admin.Username, "admin.username", InputLimits.UsernameMaxLength);
        // Admin bắt buộc có mật khẩu: nếu không, ai biết tên admin cũng lấy được token admin qua /participants/access
        var adminPassword = Password(request.Admin.Password, "admin.password", required: true)!;
        var code = await NewCode(cancellationToken);
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            Title = title,
            EventType = (EventType)request.EventType,
            ShortCode = code,
            URL = appOptions.Value.EventUrl(code),
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
            Username = adminName,
            IsAdmin = true,
            PasswordHash = PasswordHasher.HashPassword(null!, adminPassword),
            CreatedAt = DateTimeOffset.UtcNow
        };
        repository.Add(entity);
        repository.Add(admin);
        await repository.SaveChangesAsync(cancellationToken);
        var access = IssueToken(entity, admin);
        return new CreateEventResponse
        {
            ShortCode = code,
            Url = appOptions.Value.EventUrl(code),
            ParticipantId = admin.Id,
            IsAdmin = true,
            AccessToken = access.Token,
            ExpiresAt = access.ExpiresAt,
            Status = (int)entity.Status,
            Revision = entity.Revision
        };
    }

    public async Task<EventResponse> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        ToResponse(await repository.GetReadOnlyAsync(NormalizeCode(shortCode), cancellationToken)
            ?? throw new EventException(404, "Event not found."));

    public async Task<ParticipantAccessResponse> AccessAsync(string shortCode, ParticipantAccessRequest request, CancellationToken cancellationToken)
    {
        var name = Text(request.Username, "username", InputLimits.UsernameMaxLength);
        var password = Password(request.Password, "password", required: false);
        var entity = await GetEventAsync(shortCode, cancellationToken);
        var participant = entity.Participants.SingleOrDefault(x => string.Equals(x.Username, name, StringComparison.OrdinalIgnoreCase));
        var isNew = participant is null;
        if (participant is null)
        {
            participant = new EventParticipants
            {
                Id = Guid.NewGuid(),
                EventId = entity.Id,
                Username = name,
                PasswordHash = password is null ? null : PasswordHasher.HashPassword(null!, password),
                IsAdmin = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            // Người mới làm đổi danh sách participant (tổng số trên heatmap) nên tăng revision và báo realtime
            await using (var transaction = await repository.BeginTransactionAsync(cancellationToken))
            {
                entity.Revision = await repository.TryBumpRevisionAsync(entity.Id, requireOpen: false, cancellationToken)
                    ?? throw new EventException(404, "Event not found.");
                repository.Add(participant);
                await repository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            await notifier.NotifyHeatmapUpdatedAsync(entity.ShortCode, entity.Revision, cancellationToken);
        }
        else Verify(participant, password);

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

        await using (var transaction = await repository.BeginTransactionAsync(cancellationToken))
        {
            // Chặn race với participant đang lưu lịch: sau dòng này mọi lần lưu mới đều thấy Status != Open
            await BumpRevisionAsync(entity, cancellationToken);
            entity.Status = EventStatus.Finalized;
            await repository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        shortCode = entity.ShortCode;
        var response = new FinalizeEventResponse(
            (int)entity.Status,
            new FinalScheduleResponse(
                entity.FinalDate?.ToString("yyyy-MM-dd"),
                entity.FinalDayOfWeek is null ? null : (int)entity.FinalDayOfWeek.Value,
                Format(entity.FinalStartTime!.Value),
                Format(entity.FinalEndTime!.Value)),
            entity.Revision);
        await notifier.NotifyEventFinalizedAsync(shortCode, response, cancellationToken);

        // Gửi nền (có retry): lỗi email không được làm hỏng việc chốt lịch, cũng không bắt admin chờ
        var recipients = await repository.GetEmailsAsync(entity.Id, cancellationToken);
        if (recipients.Count > 0 &&
            !emailQueue.Enqueue(new EmailMessage(recipients, FinalizedEmailTemplate.Subject(entity.Title), BuildFinalizedEmail(entity, response))))
            logger.LogError("Could not queue finalized event email for {ShortCode}", shortCode);

        return response;
    }

    public async Task UpdateAsync(string shortCode, ClaimsPrincipal user, UpdateEventRequest request, CancellationToken cancellationToken)
    {
        var entity = await GetEventAsync(shortCode, cancellationToken);
        RequireAdmin(entity, user);
        if (entity.Status != EventStatus.Open) throw new EventException(409, "Event is finalized.");

        entity.Title = Text(request.Title, "title", InputLimits.TitleMaxLength);
        entity.EventType = (EventType)request.EventType;
        entity.DailyStartTime = request.DailyStartTime;
        entity.DailyEndTime = request.DailyEndTime;
        ValidateHours(entity);
        var dates = ParseUpdateDates(request);

        await using var transaction = await repository.BeginTransactionAsync(cancellationToken);
        await BumpRevisionAsync(entity, cancellationToken);
        repository.ReplaceAvailableDates(entity, dates);
        await repository.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await notifier.NotifyEventUpdatedAsync(entity.ShortCode, entity.Revision, cancellationToken);
    }

    private async Task<Events> GetEventAsync(string shortCode, CancellationToken cancellationToken) =>
        await repository.GetAsync(NormalizeCode(shortCode), cancellationToken) ?? throw new EventException(404, "Event not found.");

    /// <summary>ShortCode luôn lưu chữ hoa; chấp nhận người dùng gõ chữ thường.</summary>
    private static string NormalizeCode(string shortCode) => shortCode.Trim().ToUpperInvariant();

    /// <summary>
    /// Phải gọi trong transaction và trước SaveChanges: câu UPDATE khoá dòng event nên
    /// các lần ghi đồng thời xếp hàng, mỗi lần có revision riêng. Event đã chốt thì trả 409.
    /// </summary>
    private async Task BumpRevisionAsync(Events entity, CancellationToken cancellationToken)
    {
        var revision = await repository.TryBumpRevisionAsync(entity.Id, requireOpen: true, cancellationToken)
            ?? throw new EventException(409, "Event is no longer open.");
        // Gán lại cho entity đang tracking để SaveChanges ghi đúng giá trị vừa tăng, không ghi đè bằng số cũ
        entity.Revision = revision;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private async Task<string> NewCode(CancellationToken cancellationToken)
    {
        string code;
        do code = RandomNumberGenerator.GetString(Alphabet, 6);
        while (await repository.ShortCodeExistsAsync(code, cancellationToken));
        return code;
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
        if (request.AvailableDates.Count > InputLimits.MaxAvailableDates || request.AvailableWeekdays.Count > 7)
            throw new EventException(422, $"An event can have at most {InputLimits.MaxAvailableDates} dates.");
        if (request.EventType == (int)EventType.Dates && request.AvailableDates.Count > 0 && request.AvailableWeekdays.Count == 0)
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

    private EventResponse ToResponse(Events entity) => new()
    {
        Title = entity.Title,
        ShortCode = entity.ShortCode,
        Url = appOptions.Value.EventUrl(entity.ShortCode),
        EventType = (int)entity.EventType,
        TimeZone = entity.TimeZone,
        AvailableDates = entity.AvailableDates.Where(x => x.SpecificDate.HasValue).Select(x => x.SpecificDate!.Value).ToList(),
        AvailableWeekdays = entity.AvailableDates.Where(x => x.DayOfWeek.HasValue).Select(x => (System.DayOfWeek)(int)x.DayOfWeek!.Value).ToList(),
        DailyStartTime = Format(entity.DailyStartTime),
        DailyEndTime = Format(entity.DailyEndTime),
        Status = (int)entity.Status,
        Revision = entity.Revision,
        Participants = entity.Participants.Select(x => new EventParticipantResponse(x.Username)).ToList(),
        HeatmapGrid = HeatmapBuilder.Build(entity),
        FinalSchedule = entity.Status != EventStatus.Finalized ? null : new FinalScheduleResponse(
            entity.EventType == EventType.Dates ? entity.FinalDate?.ToString("yyyy-MM-dd") : null,
            entity.EventType == EventType.Weekdays ? (int?)entity.FinalDayOfWeek : null,
            Format(entity.FinalStartTime!.Value), Format(entity.FinalEndTime!.Value))
    };

    private string BuildFinalizedEmail(Events entity, FinalizeEventResponse response)
    {
        var schedule = response.FinalSchedule;
        return FinalizedEmailTemplate.Render(new FinalizedEmailModel(
            entity.Title,
            schedule.SpecificDate,
            schedule.DayOfWeek,
            schedule.StartTime,
            schedule.EndTime,
            entity.Participants.Count,
            appOptions.Value.EventUrl(entity.ShortCode),
            appOptions.Value.FrontendBaseUrl));
    }


    private static ParticipantTimeSlotResponse ToParticipantSlot(TimeSlots slot) => new(slot.SpecificDate, slot.DayOfWeek is null ? null : (System.DayOfWeek)(int)slot.DayOfWeek.Value, Format(slot.StartTime), Format(slot.EndTime));
    private static void RequireAdmin(Events entity, ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("participantId");
        if (!Guid.TryParse(value, out var id) || !entity.Participants.Any(x => x.Id == id && x.IsAdmin)) throw new EventException(403, "Admin access is required.");
    }
    private static void SetFinalTime(Events entity, FinalizeEventRequest request)
    {
        if (request.StartTime >= request.EndTime)
            throw new EventException(422, "startTime must be before endTime.");
        if (!InputLimits.IsOnSlotBoundary(request.StartTime) || !InputLimits.IsOnSlotBoundary(request.EndTime))
            throw new EventException(422, $"Final time must be on {InputLimits.SlotMinutes}-minute steps.");
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
    private static string Format(TimeOnly time) => time.ToString("HH:mm");
    private static string Text(string? value, string name, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new EventException(422, $"{name} is required.");
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : throw new EventException(422, $"{name} must be at most {maxLength} characters.");
    }

    /// <summary>Trả null khi không nhập (và không bắt buộc); không trim để giữ nguyên mật khẩu người dùng gõ.</summary>
    private static string? Password(string? value, string name, bool required)
    {
        if (string.IsNullOrEmpty(value))
            return required ? throw new EventException(422, $"{name} is required.") : null;
        if (value.Length < InputLimits.PasswordMinLength || value.Length > InputLimits.PasswordMaxLength)
            throw new EventException(422, $"{name} must be {InputLimits.PasswordMinLength}-{InputLimits.PasswordMaxLength} characters.");
        return value;
    }
    private static void ValidateHours(Events entity)
    {
        if (entity.DailyStartTime >= entity.DailyEndTime) throw new EventException(422, "dailyStartTime must be before dailyEndTime.");
        if (!InputLimits.IsOnSlotBoundary(entity.DailyStartTime) || !InputLimits.IsOnSlotBoundary(entity.DailyEndTime))
            throw new EventException(422, $"Daily times must be on {InputLimits.SlotMinutes}-minute steps.");
    }
    private static void Verify(EventParticipants participant, string? password)
    {
        if (participant.PasswordHash is null)
        {
            // Event cũ có admin không mật khẩu: chặn để không ai mạo danh admin chỉ bằng username
            if (participant.IsAdmin) throw new EventException(403, "This admin account has no password and can no longer be accessed.");
            return;
        }
        if (string.IsNullOrEmpty(password) ||
            PasswordHasher.VerifyHashedPassword(participant, participant.PasswordHash, password) == PasswordVerificationResult.Failed)
            throw new EventException(401, "Password is invalid.");
    }
}

public sealed class EventException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

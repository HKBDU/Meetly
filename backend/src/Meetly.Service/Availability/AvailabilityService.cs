using System.Net.Mail;
using System.Security.Claims;
using Meetly.Contract.DTOs.Participants;
using Meetly.Repository.Availability;
using Meetly.Repository.Entity;
using Meetly.Repository.Enum;

namespace Meetly.Service.Availability;

public sealed class AvailabilityService : IAvailabilityService
{
    private readonly IAvailabilityRepository _repository;

    public AvailabilityService(IAvailabilityRepository repository)
    {
        _repository = repository;
    }

    public async Task<long> UpdateAsync(
        string shortCode,
        ClaimsPrincipal user,
        SetAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        var participantClaim = user.FindFirst("participantId")?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(participantClaim, out var participantId))
            throw new AvailabilityException(401, "Access token không chứa participantId hợp lệ.");

        var eventEntity = await _repository.GetEventAsync(shortCode, cancellationToken)
            ?? throw new AvailabilityException(404, "Không tìm thấy sự kiện.");

        var participant = await _repository.GetParticipantAsync(
                eventEntity.Id, participantId, cancellationToken)
            ?? throw new AvailabilityException(404, "Không tìm thấy người tham gia.");

        if (eventEntity.Status != EventStatus.Open)
            throw new AvailabilityException(409, "Sự kiện không còn mở để cập nhật lịch.");

        ValidateEmail(request.Email);

        var slots = request.TimeSlots.Select(slot =>
        {
            ValidateSlot(eventEntity, slot);

            return new TimeSlots
            {
                Id = Guid.NewGuid(),
                EventId = eventEntity.Id,
                ParticipantId = participant.Id,
                SpecificDate = slot.SpecificDate,
                DayOfWeek = slot.DayOfWeek is null
                    ? null
                    : (Meetly.Repository.Enum.DayOfWeek)(int)slot.DayOfWeek.Value,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }).ToArray();

        return await _repository.ReplaceAsync(
            eventEntity, participant, slots, request.Email, cancellationToken);
    }

    private static void ValidateSlot(Events eventEntity, TimeSlotsRequest slot)
    {
        if (slot.StartTime >= slot.EndTime)
            throw new AvailabilityException(422, "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");

        if (slot.StartTime < eventEntity.DailyStartTime ||
            slot.EndTime > eventEntity.DailyEndTime)
            throw new AvailabilityException(422, "Time slot nằm ngoài khung giờ của sự kiện.");

        var hasDate = slot.SpecificDate.HasValue;
        var hasDayOfWeek = slot.DayOfWeek.HasValue;

        if (hasDate == hasDayOfWeek)
            throw new AvailabilityException(422, "Time slot phải có đúng một ngày hoặc thứ trong tuần.");

        if (eventEntity.EventType == EventType.Dates)
        {
            if (!hasDate || !eventEntity.AvailableDates.Any(x => x.SpecificDate == slot.SpecificDate))
                throw new AvailabilityException(422, "Ngày không thuộc cấu hình của sự kiện.");
        }
        else if (eventEntity.EventType == EventType.Weekdays)
        {
            if (!hasDayOfWeek || !eventEntity.AvailableDates.Any(x =>
                    x.DayOfWeek.HasValue && (int)x.DayOfWeek.Value == (int)slot.DayOfWeek!.Value))
                throw new AvailabilityException(422, "Thứ không thuộc cấu hình của sự kiện.");
        }
    }

    private static void ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return;

        try
        {
            _ = new MailAddress(email.Trim());
        }
        catch (FormatException)
        {
            throw new AvailabilityException(422, "Email không hợp lệ.");
        }
    }
}

public sealed class AvailabilityException : Exception
{
    public AvailabilityException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}

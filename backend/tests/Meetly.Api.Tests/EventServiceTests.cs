using System.Security.Claims;
using Meetly.Repository.Entity;
using Meetly.Repository.EventScheduling;
using Meetly.Service.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Meetly.Service.Scheduling;
using Microsoft.Extensions.Configuration;
using EventStatus = Meetly.Repository.Enum.EventStatus;
using EventType = Meetly.Repository.Enum.EventType;

namespace Meetly.Api.Tests;

public class EventServiceTests
{
    [Fact]
    public void ScheduleTime_SupportsOvernightWindow()
    {
        var cells = ScheduleTime.Cells(TimeOnly.Parse("23:00"), TimeOnly.Parse("01:00"), 15).ToArray();

        Assert.Equal(8, cells.Length);
        Assert.Equal(TimeOnly.Parse("00:00"), cells[4].Start);
        Assert.True(ScheduleTime.Contains(TimeOnly.Parse("23:00"), TimeOnly.Parse("01:00"), TimeOnly.Parse("23:30"), TimeOnly.Parse("00:30")));
        Assert.False(ScheduleTime.Contains(TimeOnly.Parse("23:00"), TimeOnly.Parse("01:00"), TimeOnly.Parse("22:30"), TimeOnly.Parse("00:30")));
    }

    [Fact]
    public async Task Update_TruncatesValidSlotsAndRemovesDeletedDates()
    {
        var eventId = Guid.NewGuid();
        var admin = new EventParticipants
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Username = "Admin",
            IsAdmin = true,
            TimeSlots =
            [
                Slot(eventId, "2026-09-20", "07:00", "09:00"),
                Slot(eventId, "2026-09-21", "08:00", "09:00")
            ]
        };
        foreach (var existingSlot in admin.TimeSlots) existingSlot.ParticipantId = admin.Id;
        var entity = new Events
        {
            Id = eventId,
            ShortCode = "ABC123",
            Status = EventStatus.Open,
            EventType = EventType.Dates,
            DailyStartTime = TimeOnly.Parse("07:00"),
            DailyEndTime = TimeOnly.Parse("10:00"),
            AvailableDates =
            [
                Date(eventId, "2026-09-20"),
                Date(eventId, "2026-09-21")
            ],
            Participants = [admin]
        };
        var repository = new FakeRepository(entity);
        var service = new EventService(repository, new UnusedJwt(), new FakeNotifier(), new ConfigurationBuilder().Build());
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("participantId", admin.Id.ToString()),
            new Claim("eventId", eventId.ToString())
        ], "test"));

        var response = await service.UpdateAsync("ABC123", user, new UpdateEventRequest
        {
            Title = "Updated",
            EventType = 1,
            AvailableDates = [DateOnly.Parse("2026-09-20")],
            DailyStartTime = TimeOnly.Parse("08:00"),
            DailyEndTime = TimeOnly.Parse("08:30")
        }, CancellationToken.None);

        var slot = Assert.Single(repository.ReplacementSlots);
        Assert.Equal(TimeOnly.Parse("08:00"), slot.StartTime);
        Assert.Equal(TimeOnly.Parse("08:30"), slot.EndTime);
        Assert.Equal(1, response.Revision);
    }

    private static TimeSlots Slot(Guid eventId, string date, string start, string end) => new()
    {
        Id = Guid.NewGuid(),
        EventId = eventId,
        SpecificDate = DateOnly.Parse(date),
        StartTime = TimeOnly.Parse(start),
        EndTime = TimeOnly.Parse(end)
    };

    private static EventAvailableDates Date(Guid eventId, string date) => new()
    {
        Id = Guid.NewGuid(),
        EventId = eventId,
        SpecificDate = DateOnly.Parse(date)
    };

    private sealed class FakeRepository(Events entity) : IEventRepository
    {
        public TimeSlots[] ReplacementSlots { get; private set; } = [];
        public Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken) => Task.FromResult<Events?>(entity);
        public Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> EmailExistsAsync(Guid eventId, string email, CancellationToken cancellationToken) => Task.FromResult(false);
        public void Add(Events eventEntity) { }
        public void Add(EventParticipants participant) { }
        public void Add(EventEmails email) { }
        public void ReplaceSlots(EventParticipants participant, IEnumerable<TimeSlots> slots) => ReplacementSlots = slots.ToArray();
        public void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates) => eventEntity.AvailableDates = dates;
        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FakeNotifier : IEventRealtimeNotifier
    {
        public Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class UnusedJwt : IJwtService
    {
        public string GenerateAccessToken(IEnumerable<Claim> claims) => throw new NotSupportedException();
        public ClaimsPrincipal GetPrincipal(string token) => throw new NotSupportedException();
    }
}

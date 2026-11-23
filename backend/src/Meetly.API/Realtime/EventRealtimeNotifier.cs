using Meetly.API.Hubs;
using Meetly.Repository.EventScheduling;
using Meetly.Service.EventScheduling;
using Meetly.Service.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace Meetly.API.Realtime;

public sealed class EventRealtimeNotifier(
    IHubContext<EventHub> hub,
    IEventRepository repository) : IEventRealtimeNotifier
{
    public async Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken)
    {
        var entity = await repository.GetReadOnlyAsync(shortCode.ToUpperInvariant(), cancellationToken);
        if (entity is null) return;

        await hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "HeatmapUpdated",
            new
            {
                shortCode = entity.ShortCode,
                revision,
                heatmapGrid = HeatmapBuilder.Build(entity)
            },
            cancellationToken);
    }

    public async Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken)
    {
        var entity = await repository.GetReadOnlyAsync(shortCode.ToUpperInvariant(), cancellationToken);
        if (entity is null) return;

        await hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "EventUpdated",
            new
            {
                shortCode = entity.ShortCode,
                title = entity.Title,
                eventType = (int)entity.EventType,
                availableDates = entity.AvailableDates.Where(x => x.SpecificDate.HasValue).Select(x => x.SpecificDate).ToList(),
                availableWeekdays = entity.AvailableDates.Where(x => x.DayOfWeek.HasValue).Select(x => (int)x.DayOfWeek!.Value).ToList(),
                dailyStartTime = entity.DailyStartTime.ToString("HH:mm"),
                dailyEndTime = entity.DailyEndTime.ToString("HH:mm"),
                // Ngày/giờ đổi thì lưới cũng đổi (slot của ngày bị bỏ đã bị xoá), gửi kèm để client không phải tải lại
                heatmapGrid = HeatmapBuilder.Build(entity),
                revision
            },
            cancellationToken);
    }

    public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) =>
        hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "EventFinalized",
            new { shortCode, status = response.Status, finalSchedule = response.FinalSchedule, revision = response.Revision },
            cancellationToken);
}

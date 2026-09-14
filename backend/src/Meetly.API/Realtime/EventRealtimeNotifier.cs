using Meetly.API.Hubs;
using Meetly.Repository.Entity;
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
        var entity = await repository.GetAsync(shortCode, cancellationToken);
        if (entity is null) return;

        await hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "HeatmapUpdated",
            new
            {
                shortCode = entity.ShortCode,
                revision,
                heatmapGrid = BuildHeatmap(entity)
            },
            cancellationToken);
    }

    public async Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken)
    {
        var entity = await repository.GetAsync(shortCode, cancellationToken);
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
                revision
            },
            cancellationToken);
    }

    public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) =>
        hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "EventFinalized",
            new { shortCode, status = response.Status, finalSchedule = response.FinalSchedule, revision = response.Revision },
            cancellationToken);

    private static List<object> BuildHeatmap(Events entity)
    {
        var cells = new List<object>();
        foreach (var available in entity.AvailableDates)
        {
            for (var start = entity.DailyStartTime; start < entity.DailyEndTime; start = start.AddMinutes(30))
            {
                var end = start.AddMinutes(30) > entity.DailyEndTime ? entity.DailyEndTime : start.AddMinutes(30);
                var participants = entity.Participants
                    .Where(p => p.TimeSlots.Any(slot =>
                        slot.SpecificDate == available.SpecificDate &&
                        slot.DayOfWeek == available.DayOfWeek &&
                        slot.StartTime <= start && slot.EndTime >= end))
                    .Select(p => p.Username)
                    .Order()
                    .ToList();

                cells.Add(new
                {
                    specificDate = available.SpecificDate,
                    dayOfWeek = available.DayOfWeek is null ? null : (int?)available.DayOfWeek.Value,
                    startTime = start.ToString("HH:mm"),
                    participants,
                    count = participants.Count
                });
            }
        }

        return cells;
    }
}

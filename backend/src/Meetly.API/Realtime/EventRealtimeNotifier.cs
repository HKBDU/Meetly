using Meetly.API.Hubs;
using Meetly.Service.EventScheduling;
using Meetly.Service.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace Meetly.API.Realtime;

public sealed class EventRealtimeNotifier(IHubContext<EventHub> hub) : IEventRealtimeNotifier
{
    public Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) =>
        hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "HeatmapUpdated",
            new { shortCode, revision },
            cancellationToken);

    public Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) =>
        hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "EventUpdated",
            new { shortCode, revision },
            cancellationToken);

    public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) =>
        hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
            "EventFinalized",
            new { shortCode, status = response.Status, finalSchedule = response.FinalSchedule, revision = response.Revision },
            cancellationToken);

}

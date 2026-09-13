using Meetly.Service.EventScheduling;

namespace Meetly.Service.Realtime;

public interface IEventRealtimeNotifier
{
    Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken);
    Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken);
    Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken);
}

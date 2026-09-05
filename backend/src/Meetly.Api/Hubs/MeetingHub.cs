using Microsoft.AspNetCore.SignalR;

namespace Meetly.Api.Hubs;

public interface IMeetingClient
{
    Task ParticipantJoined(object participant);
    Task AvailabilityUpdated(object updateData);
}

public class MeetingHub : Hub<IMeetingClient>
{
    private readonly ILogger<MeetingHub> _logger;

    public MeetingHub(ILogger<MeetingHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinMeeting(string eventSlug)
    {
        if (string.IsNullOrWhiteSpace(eventSlug))
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, eventSlug.ToLowerInvariant());
        _logger.LogInformation("Connection {ConnectionId} joined room {Slug}", Context.ConnectionId, eventSlug);
    }

    public async Task LeaveMeeting(string eventSlug)
    {
        if (string.IsNullOrWhiteSpace(eventSlug))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, eventSlug.ToLowerInvariant());
        _logger.LogInformation("Connection {ConnectionId} left room {Slug}", Context.ConnectionId, eventSlug);
    }
}

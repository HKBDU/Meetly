using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Meetly.API.Hubs;

[Authorize]
public sealed class EventHub : Hub
{
    public async Task JoinEvent(string shortCode)
    {
        var tokenShortCode = Context.User?.FindFirst("shortCode")?.Value;
        if (!string.Equals(tokenShortCode, shortCode, StringComparison.OrdinalIgnoreCase))
            throw new HubException("Token does not belong to this event.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(shortCode));
    }

    public Task LeaveEvent(string shortCode) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(shortCode));

    public static string GroupName(string shortCode) => $"event:{shortCode.ToUpperInvariant()}";
}

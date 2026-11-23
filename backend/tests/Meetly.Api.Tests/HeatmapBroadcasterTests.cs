using System.Collections.Concurrent;
using Meetly.API.Hubs;
using Meetly.API.Realtime;
using Meetly.Repository.Entity;
using Meetly.Repository.EventScheduling;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace Meetly.Api.Tests;

public class HeatmapBroadcasterTests
{
    private sealed class RecordingHub : IHubContext<EventHub>, IHubClients, IClientProxy
    {
        public ConcurrentQueue<(string Method, object?[] Args)> Sent { get; } = new();
        IHubClients IHubContext<EventHub>.Clients => this;
        IGroupManager IHubContext<EventHub>.Groups => throw new NotSupportedException();
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default)
        {
            Sent.Enqueue((method, args));
            return Task.CompletedTask;
        }
        IClientProxy IHubClients<IClientProxy>.All => this;
        IClientProxy IHubClients<IClientProxy>.AllExcept(IReadOnlyList<string> excludedConnectionIds) => this;
        IClientProxy IHubClients<IClientProxy>.Client(string connectionId) => this;
        IClientProxy IHubClients<IClientProxy>.Clients(IReadOnlyList<string> connectionIds) => this;
        IClientProxy IHubClients<IClientProxy>.Group(string groupName) => this;
        IClientProxy IHubClients<IClientProxy>.GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => this;
        IClientProxy IHubClients<IClientProxy>.Groups(IReadOnlyList<string> groupNames) => this;
        IClientProxy IHubClients<IClientProxy>.User(string userId) => this;
        IClientProxy IHubClients<IClientProxy>.Users(IReadOnlyList<string> userIds) => this;
    }

    private sealed class Lifetime : IHostApplicationLifetime
    {
        public CancellationToken ApplicationStarted => CancellationToken.None;
        public CancellationToken ApplicationStopping => CancellationToken.None;
        public CancellationToken ApplicationStopped => CancellationToken.None;
        public void StopApplication() { }
    }

    [Fact]
    public async Task Schedule_CoalescesBurstIntoSingleBroadcastWithLatestRevision()
    {
        var repository = new FakeEventRepository();
        var entity = new Events
        {
            Id = Guid.NewGuid(),
            ShortCode = "ABC234",
            DailyStartTime = new TimeOnly(9, 0),
            DailyEndTime = new TimeOnly(10, 0),
            AvailableDates = [new EventAvailableDates { DayOfWeek = Repository.Enum.DayOfWeek.Monday }],
            Revision = 1
        };
        repository.Events.Add(entity);
        var services = new ServiceCollection().AddSingleton<IEventRepository>(repository).BuildServiceProvider();
        var hub = new RecordingHub();
        var broadcaster = new HeatmapBroadcaster(services.GetRequiredService<IServiceScopeFactory>(), hub, new Lifetime(), NullLogger<HeatmapBroadcaster>.Instance);

        for (var i = 0; i < 5; i++)
        {
            entity.Revision++;
            broadcaster.Schedule("abc234");
        }
        await Task.Delay(HeatmapBroadcaster.Window * 3);

        var sent = Assert.Single(hub.Sent);
        Assert.Equal("HeatmapUpdated", sent.Method);
        var payload = sent.Args[0]!;
        Assert.Equal(6L, payload.GetType().GetProperty("revision")!.GetValue(payload));

        // Sau khi gửi, lần lưu tiếp theo phải được lên lịch lượt mới
        entity.Revision++;
        broadcaster.Schedule("ABC234");
        await Task.Delay(HeatmapBroadcaster.Window * 3);
        Assert.Equal(2, hub.Sent.Count);
    }
}

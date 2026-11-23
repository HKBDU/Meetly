using System.Collections.Concurrent;
using Meetly.API.Hubs;
using Meetly.Repository.EventScheduling;
using Meetly.Service.EventScheduling;
using Microsoft.AspNetCore.SignalR;

namespace Meetly.API.Realtime;

/// <summary>
/// Gộp các lần cập nhật heatmap của cùng event trong một cửa sổ ngắn thành 1 lần đọc DB +
/// 1 lần broadcast. Khi N người cùng tô lịch, tải không còn là N lần (đọc cả event + gửi cả lưới
/// cho N người) mà chỉ còn tối đa 1 lần mỗi cửa sổ.
/// </summary>
public sealed class HeatmapBroadcaster(
    IServiceScopeFactory scopeFactory,
    IHubContext<EventHub> hub,
    IHostApplicationLifetime lifetime,
    ILogger<HeatmapBroadcaster> logger)
{
    public static readonly TimeSpan Window = TimeSpan.FromMilliseconds(300);

    private readonly ConcurrentDictionary<string, byte> _scheduled = new(StringComparer.Ordinal);

    /// <summary>Gọi sau khi đã commit thay đổi. Trả về ngay, broadcast chạy nền.</summary>
    public void Schedule(string shortCode)
    {
        var code = shortCode.ToUpperInvariant();
        // Đã có lượt gửi đang chờ: lượt đó đọc DB sau khi hết cửa sổ nên sẽ thấy thay đổi này
        if (!_scheduled.TryAdd(code, 0)) return;
        _ = FlushLaterAsync(code);
    }

    private async Task FlushLaterAsync(string shortCode)
    {
        var stopping = lifetime.ApplicationStopping;
        try
        {
            await Task.Delay(Window, stopping);
            // Bỏ cờ TRƯỚC khi đọc DB: thay đổi commit sau thời điểm này sẽ tự lên lịch lượt mới,
            // thay đổi commit trước đó chắc chắn có trong lần đọc dưới đây
            _scheduled.TryRemove(shortCode, out _);

            using var scope = scopeFactory.CreateScope();
            var entity = await scope.ServiceProvider.GetRequiredService<IEventRepository>()
                .GetReadOnlyAsync(shortCode, stopping);
            if (entity is null) return;

            await hub.Clients.Group(EventHub.GroupName(shortCode)).SendAsync(
                "HeatmapUpdated",
                new
                {
                    shortCode = entity.ShortCode,
                    revision = entity.Revision,
                    participants = entity.Participants.Select(x => new EventParticipantResponse(x.Username)).ToList(),
                    heatmapGrid = HeatmapBuilder.Build(entity)
                },
                stopping);
        }
        catch (OperationCanceledException) when (stopping.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            _scheduled.TryRemove(shortCode, out _);
            logger.LogError(exception, "Broadcasting heatmap for {ShortCode} failed", shortCode);
        }
    }
}

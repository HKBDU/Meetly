using Meetly.Repository.Enum;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository.Stats;

public sealed record StatsCounts(int Events, int Participants, int Finalized);

public interface IStatsRepository
{
    /// <summary>Tổng số event, lượt tham gia và event đã chốt; chỉ đếm, không đọc dữ liệu cá nhân.</summary>
    Task<StatsCounts> CountAsync(CancellationToken cancellationToken);
}

public sealed class StatsRepository(AppDbContext db) : IStatsRepository
{
    public async Task<StatsCounts> CountAsync(CancellationToken cancellationToken)
    {
        // DbContext không chạy song song được nên đếm lần lượt; 3 câu COUNT đơn giản trên khoá chính
        var events = await db.Events.CountAsync(cancellationToken);
        var participants = await db.EventParticipants.CountAsync(cancellationToken);
        var finalized = await db.Events.CountAsync(x => x.Status == EventStatus.Finalized, cancellationToken);
        return new StatsCounts(events, participants, finalized);
    }
}

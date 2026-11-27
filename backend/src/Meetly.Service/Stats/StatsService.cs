using Meetly.Repository.Stats;
using Microsoft.Extensions.Caching.Memory;

namespace Meetly.Service.Stats;

public sealed record PublicStatsResponse(int Events, int Participants, int Finalized);

public interface IStatsService
{
    Task<PublicStatsResponse> GetAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Số liệu công khai cho trang chủ. Cache trong bộ nhớ vì ai vào trang chủ cũng gọi,
/// còn con số thì không cần chính xác tới từng giây.
/// </summary>
public sealed class StatsService(IStatsRepository repository, IMemoryCache cache) : IStatsService
{
    private const string CacheKey = "public-stats";
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);

    public async Task<PublicStatsResponse> GetAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out PublicStatsResponse? cached) && cached is not null)
            return cached;

        var counts = await repository.CountAsync(cancellationToken);
        var response = new PublicStatsResponse(counts.Events, counts.Participants, counts.Finalized);
        cache.Set(CacheKey, response, CacheFor);
        return response;
    }
}

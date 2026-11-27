using Meetly.Repository.Stats;
using Meetly.Service.Stats;
using Microsoft.Extensions.Caching.Memory;

namespace Meetly.Api.Tests;

public class StatsServiceTests
{
    private sealed class CountingRepository : IStatsRepository
    {
        public int Calls { get; private set; }

        public Task<StatsCounts> CountAsync(CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new StatsCounts(12, 47, 5));
        }
    }

    [Fact]
    public async Task Get_ReturnsCounts()
    {
        var service = new StatsService(new CountingRepository(), new MemoryCache(new MemoryCacheOptions()));

        var stats = await service.GetAsync(CancellationToken.None);

        Assert.Equal(new PublicStatsResponse(12, 47, 5), stats);
    }

    [Fact]
    public async Task Get_CachesSoTheDatabaseIsHitOnce()
    {
        var repository = new CountingRepository();
        var service = new StatsService(repository, new MemoryCache(new MemoryCacheOptions()));

        await service.GetAsync(CancellationToken.None);
        await service.GetAsync(CancellationToken.None);

        Assert.Equal(1, repository.Calls);
    }
}

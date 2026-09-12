using Meetly.Repository.Entity;
using Microsoft.EntityFrameworkCore;

namespace Meetly.Repository.SuggestionSlots;

public sealed class SuggestionRepository : ISuggestionRepository
{
    private readonly AppDbContext _dbContext;

    public SuggestionRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Events?> GetEventAsync(
        string shortCode,
        CancellationToken cancellationToken) =>
        _dbContext.Events
            .Include(x => x.AvailableDates)
            .Include(x => x.Participants)
                .ThenInclude(x => x.TimeSlots)
            .SingleOrDefaultAsync(x => x.ShortCode == shortCode, cancellationToken);
}

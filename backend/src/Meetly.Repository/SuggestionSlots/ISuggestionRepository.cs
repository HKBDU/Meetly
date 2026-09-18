using Meetly.Repository.Entity;

namespace Meetly.Repository.SuggestionSlots;

public interface ISuggestionRepository
{
    Task<Events?> GetEventAsync(string shortCode, CancellationToken cancellationToken);
}

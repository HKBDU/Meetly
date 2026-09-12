using Meetly.Contract.DTOs.Events;

using System.Security.Claims;

namespace Meetly.Service.SuggestionSlots;

public interface ISuggestionService
{
    Task<SuggestionEventResponse> GetSuggestionEvents(
        string shortCode,
        ClaimsPrincipal user,
        SuggestionEventRequest request,
        CancellationToken cancellationToken);
}

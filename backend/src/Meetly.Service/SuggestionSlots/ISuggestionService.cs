using System.Security.Claims;
using Meetly.Contract.DTOs.Events;

namespace Meetly.Service.SuggestionSlots;

public interface ISuggestionService
{
    Task<SuggestionEventResponse> GetSuggestionEvents(
        string shortCode,
        ClaimsPrincipal user,
        SuggestionEventRequest request,
        CancellationToken cancellationToken);
}

using System.Security.Claims;
using Meetly.Contract.DTOs.Participants;

namespace Meetly.Service.Availability;

public interface IAvailabilityService
{
    Task<long> UpdateAsync(
        string shortCode,
        ClaimsPrincipal user,
        SetAvailabilityRequest request,
        CancellationToken cancellationToken);
}

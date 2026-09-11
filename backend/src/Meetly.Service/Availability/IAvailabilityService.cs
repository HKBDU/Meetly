using Meetly.Contract.DTOs.Participants;
using System.Security.Claims;

namespace Meetly.Service.Availability;

public interface IAvailabilityService
{
    Task<long> UpdateAsync(
        string shortCode,
        ClaimsPrincipal user,
        SetAvailabilityRequest request,
        CancellationToken cancellationToken);
}

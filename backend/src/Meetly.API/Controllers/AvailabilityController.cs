using Meetly.Contract.DTOs.Common;
using Meetly.Contract.DTOs.Participants;
using Meetly.Service.Availability;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meetly.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/events/{shortCode}/participants/me/availability")]
public sealed class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _service;

    public AvailabilityController(IAvailabilityService service)
    {
        _service = service;
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<UpdateAvailabilityResponse>>> Update(
        string shortCode,
        SetAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        var revision = await _service.UpdateAsync(
            shortCode, User, request, cancellationToken);

        return Ok(new ApiResponse<UpdateAvailabilityResponse>(
            true,
            StatusCodes.Status200OK,
            "Cập nhật lịch rảnh thành công",
            new UpdateAvailabilityResponse { Revision = revision }));
    }
}

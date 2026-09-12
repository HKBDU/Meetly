using Meetly.Contract.DTOs.Common;
using Meetly.Contract.DTOs.Events;
using Meetly.Service.SuggestionSlots;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meetly.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/events/{shortCode}/suggestions")]
public sealed class SuggestionController : ControllerBase
{
    private readonly ISuggestionService _service;

    public SuggestionController(ISuggestionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<SuggestionEventResponse>>> GetSuggestionEvents(
        string shortCode,
        [FromQuery] SuggestionEventRequest request,
        CancellationToken cancellationToken)
    {
        var suggestions = await _service.GetSuggestionEvents(
            shortCode, User, request, cancellationToken);
        return Ok(new ApiResponse<SuggestionEventResponse>(
            true,
            StatusCodes.Status200OK,
            "Tìm khung giờ phù hợp thành công",
            suggestions));
    }
}

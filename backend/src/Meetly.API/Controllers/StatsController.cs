using Meetly.Contract.DTOs.Common;
using Meetly.Service.Stats;
using Microsoft.AspNetCore.Mvc;

namespace Meetly.API.Controllers;

[ApiController]
[Route("api/v1/stats")]
public sealed class StatsController(IStatsService service) : ControllerBase
{
    /// <summary>Số event đã tạo, lượt tham gia, event đã chốt: hiện trên trang chủ.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PublicStatsResponse>>> Get(CancellationToken ct)
    {
        // Cho trình duyệt và CDN giữ 5 phút, khớp với cache phía server
        Response.Headers.CacheControl = "public, max-age=300";
        return Ok(ApiResponse<PublicStatsResponse>.Success(200, "Stats loaded successfully", await service.GetAsync(ct)));
    }
}

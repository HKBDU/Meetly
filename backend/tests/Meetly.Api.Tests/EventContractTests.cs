using System.Text.Json;
using Meetly.Service.EventScheduling;

namespace Meetly.Api.Tests;

public class EventContractTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public void EventResponses_UseTheContractFieldNames()
    {
        var request = JsonSerializer.Serialize(new CreateEventRequest
        {
            EventType = 2,
            AvailableWeekdays = [DayOfWeek.Monday],
            Admin = new AdminRequest { Username = "Huy" }
        }, Json);
        var response = JsonSerializer.Serialize(new EventResponse { TimeZone = "Asia/Ho_Chi_Minh" }, Json);

        Assert.Contains("\"availableWeekdays\":[1]", request);
        Assert.Contains("\"admin\":{\"username\":\"Huy\"", request);
        Assert.Contains("\"timezone\":\"Asia/Ho_Chi_Minh\"", response);
    }

    [Fact]
    public void UpdateEventRequest_DoesNotContainAdminCredentials()
    {
        var request = JsonSerializer.Serialize(new UpdateEventRequest { Title = "Daily sync" }, Json);

        Assert.DoesNotContain("username", request, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", request, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Finalize_MeetingUrlIsOptionalAndUsesCamelCase()
    {
        const string link = "https://meet.google.com/abc-defg-hij";
        var request = JsonSerializer.Deserialize<FinalizeEventRequest>("""{"meetingUrl":"https://meet.google.com/abc-defg-hij"}""", Json);
        Assert.Equal(link, request!.MeetingUrl);
        Assert.Null(JsonSerializer.Deserialize<FinalizeEventRequest>("{}", Json)!.MeetingUrl);

        var schedule = new FinalScheduleResponse("2026-12-02", null, "09:45", "11:15", link);
        using var response = JsonSerializer.SerializeToDocument(new FinalizeEventResponse(2, schedule, 15), Json);
        Assert.Equal(link, response.RootElement.GetProperty("finalSchedule").GetProperty("meetingUrl").GetString());
        Assert.DoesNotContain("meetingUrl", JsonSerializer.Serialize(schedule with { MeetingUrl = null }, Json));
    }
}

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
}

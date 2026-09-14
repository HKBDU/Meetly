namespace Meetly.Service.Availability;

public sealed record UpdateAvailabilityResponse
{
    public long Revision { get; init; }
}

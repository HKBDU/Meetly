using System.Security.Claims;
using Meetly.Repository.Entity;
using Meetly.Repository.EventScheduling;
using Meetly.Service.Common;
using Meetly.Service.Email;
using Meetly.Service.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Meetly.Api.Tests;

/// <summary>Repository trong bộ nhớ, đủ để test luật nghiệp vụ của EventService mà không cần Postgres.</summary>
internal sealed class FakeEventRepository : IEventRepository
{
    public List<Events> Events { get; } = [];
    public List<EventParticipants> AddedParticipants { get; } = [];

    public Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        Task.FromResult(Events.SingleOrDefault(x => x.ShortCode == shortCode));

    public Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken) =>
        Task.FromResult(Events.Any(x => x.ShortCode == shortCode));

    public Task<bool> EmailExistsAsync(Guid eventId, string email, CancellationToken cancellationToken) =>
        Task.FromResult(false);

    public void Add(Events eventEntity) => Events.Add(eventEntity);

    public void Add(EventParticipants participant)
    {
        AddedParticipants.Add(participant);
        Events.SingleOrDefault(x => x.Id == participant.EventId)?.Participants.Add(participant);
    }

    public void Add(EventEmails email) { }

    public void ReplaceSlots(EventParticipants participant, IEnumerable<TimeSlots> slots) { }

    public void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates) =>
        eventEntity.AvailableDates = dates;

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

internal sealed class NoopNotifier : IEventRealtimeNotifier
{
    public Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) => Task.CompletedTask;
}

internal sealed class NoopEmailService : IEmailService
{
    public Task SendAsync(IReadOnlyCollection<string> recipients, string subject, string html, CancellationToken cancellationToken) => Task.CompletedTask;
}

internal static class TestServices
{
    public static JwtService Jwt() => new(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["JwtOptions:Issuer"] = "issuer",
        ["JwtOptions:Audience"] = "audience",
        ["JwtOptions:SecretKey"] = "a-long-enough-test-secret-key-1234567890",
        ["JwtOptions:ExpirationMinutes"] = "60"
    }).Build());

    public static EventService EventService(FakeEventRepository repository) => new(
        repository,
        Jwt(),
        new NoopNotifier(),
        new NoopEmailService(),
        Options.Create(new AppOptions { FrontendBaseUrl = "https://app.test" }),
        NullLogger<EventService>.Instance);

    public static ClaimsPrincipal User(Guid participantId, string shortCode) =>
        new(new ClaimsIdentity(
        [
            new Claim("participantId", participantId.ToString()),
            new Claim("shortCode", shortCode)
        ], "test"));
}

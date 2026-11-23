using System.Security.Claims;
using Meetly.Repository.Entity;
using Meetly.Repository.EventScheduling;
using Meetly.Service.Common;
using Meetly.Service.Email;
using Meetly.Service.EventScheduling;
using Meetly.Service.JwtService;
using Meetly.Service.Realtime;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Meetly.Api.Tests;

/// <summary>Repository trong bộ nhớ, đủ để test luật nghiệp vụ của EventService mà không cần Postgres.</summary>
internal sealed class FakeEventRepository : IEventRepository
{
    public List<Events> Events { get; } = [];
    public List<EventParticipants> AddedParticipants { get; } = [];

    /// <summary>Giả lập câu UPDATE ... WHERE Status = 1 trả về 0 dòng (event vừa bị chốt ở request khác).</summary>
    public bool BumpReturnsNull { get; set; }

    public Task<Events?> GetAsync(string shortCode, CancellationToken cancellationToken) =>
        Task.FromResult(Events.SingleOrDefault(x => x.ShortCode == shortCode));

    public Task<Events?> GetReadOnlyAsync(string shortCode, CancellationToken cancellationToken) =>
        GetAsync(shortCode, cancellationToken);

    public Task<List<string>> GetEmailsAsync(Guid eventId, CancellationToken cancellationToken) =>
        Task.FromResult(new List<string>());

    public Task<bool> ShortCodeExistsAsync(string shortCode, CancellationToken cancellationToken) =>
        Task.FromResult(Events.Any(x => x.ShortCode == shortCode));

    public void Add(Events eventEntity) => Events.Add(eventEntity);

    public void Add(EventParticipants participant)
    {
        AddedParticipants.Add(participant);
        Events.SingleOrDefault(x => x.Id == participant.EventId)?.Participants.Add(participant);
    }

    public void ReplaceAvailableDates(Events eventEntity, ICollection<EventAvailableDates> dates) =>
        eventEntity.AvailableDates = dates;

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IDbContextTransaction>(new FakeTransaction());

    public Task<long?> TryBumpRevisionAsync(Guid eventId, bool requireOpen, CancellationToken cancellationToken)
    {
        var entity = Events.Single(x => x.Id == eventId);
        if (BumpReturnsNull || (requireOpen && entity.Status != Repository.Enum.EventStatus.Open))
            return Task.FromResult<long?>(null);
        return Task.FromResult<long?>(entity.Revision + 1);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

internal sealed class FakeTransaction : IDbContextTransaction
{
    public Guid TransactionId { get; } = Guid.NewGuid();
    public bool Committed { get; private set; }
    public void Commit() => Committed = true;
    public Task CommitAsync(CancellationToken cancellationToken = default) { Committed = true; return Task.CompletedTask; }
    public void Rollback() { }
    public Task RollbackAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public void Dispose() { }
    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

internal sealed class NoopNotifier : IEventRealtimeNotifier
{
    public Task NotifyHeatmapUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task NotifyEventUpdatedAsync(string shortCode, long revision, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task NotifyEventFinalizedAsync(string shortCode, FinalizeEventResponse response, CancellationToken cancellationToken) => Task.CompletedTask;
}

internal sealed class FakeEmailQueue : IEmailQueue
{
    public List<EmailMessage> Messages { get; } = [];
    public bool Enqueue(EmailMessage message)
    {
        Messages.Add(message);
        return true;
    }
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
        new FakeEmailQueue(),
        Options.Create(new AppOptions { FrontendBaseUrl = "https://app.test" }),
        NullLogger<EventService>.Instance);

    public static ClaimsPrincipal User(Guid participantId, string shortCode) =>
        new(new ClaimsIdentity(
        [
            new Claim("participantId", participantId.ToString()),
            new Claim("shortCode", shortCode)
        ], "test"));
}

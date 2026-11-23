using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Meetly.Service.Email;

public sealed record EmailMessage(IReadOnlyCollection<string> Recipients, string Subject, string Html);

/// <summary>Xếp email để gửi nền: request (VD chốt lịch) trả về ngay, không chờ nhà cung cấp email.</summary>
public interface IEmailQueue
{
    /// <summary>False nếu hàng đợi đầy (email bị bỏ và đã ghi log).</summary>
    bool Enqueue(EmailMessage message);
}

/// <summary>
/// Hàng đợi trong bộ nhớ + worker nền, thử lại tối đa 3 lần với backoff tăng dần.
/// Email trong hàng đợi mất nếu process tắt; cần bền vững hơn thì thay bằng outbox trong DB.
/// </summary>
public sealed class BackgroundEmailQueue(
    IServiceScopeFactory scopeFactory,
    ILogger<BackgroundEmailQueue> logger) : BackgroundService, IEmailQueue
{
    private const int Capacity = 1000;
    private static readonly TimeSpan[] RetryDelays = [TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(8), TimeSpan.FromSeconds(30)];

    private readonly Channel<EmailMessage> _channel = Channel.CreateBounded<EmailMessage>(
        new BoundedChannelOptions(Capacity) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });

    public bool Enqueue(EmailMessage message)
    {
        if (_channel.Writer.TryWrite(message)) return true;
        logger.LogError("Email queue is full, dropping email {Subject}", message.Subject);
        return false;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _channel.Reader.ReadAllAsync(stoppingToken))
            await SendWithRetryAsync(message, stoppingToken);
    }

    private async Task SendWithRetryAsync(EmailMessage message, CancellationToken stoppingToken)
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                // IEmailService là typed HttpClient (transient), lấy mới mỗi lần gửi
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IEmailService>()
                    .SendAsync(message.Recipients, message.Subject, message.Html, stoppingToken);
                return;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception) when (attempt < RetryDelays.Length)
            {
                logger.LogWarning(exception, "Sending email {Subject} failed (attempt {Attempt}), retrying", message.Subject, attempt + 1);
                await Task.Delay(RetryDelays[attempt], stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Giving up sending email {Subject}", message.Subject);
                return;
            }
        }
    }
}

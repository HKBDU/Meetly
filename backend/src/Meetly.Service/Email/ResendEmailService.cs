using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Meetly.Service.Email;

/// <summary>
/// Gửi mỗi người nhận một email riêng qua `POST /emails/batch` của Resend để người nhận
/// không thấy địa chỉ của nhau (trước đây dồn hết vào một trường `to`).
/// </summary>
public sealed class ResendEmailService(
    HttpClient httpClient,
    IOptions<ResendOptions> options,
    ILogger<ResendEmailService> logger) : IEmailService
{
    /// <summary>Resend giới hạn 100 email cho mỗi request batch.</summary>
    private const int BatchSize = 100;

    private readonly ResendOptions _options = options.Value;

    public async Task SendAsync(
        IReadOnlyCollection<string> recipients,
        string subject,
        string html,
        CancellationToken cancellationToken)
    {
        var to = recipients
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (to.Length == 0)
            return;

        if (string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            throw new InvalidOperationException("Resend configuration is missing.");
        }

        var from = string.IsNullOrWhiteSpace(_options.FromName)
            ? _options.FromEmail
            : $"{_options.FromName} <{_options.FromEmail}>";

        foreach (var chunk in to.Chunk(BatchSize))
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "emails/batch")
            {
                Content = JsonContent.Create(chunk.Select(recipient => new
                {
                    from,
                    to = new[] { recipient },
                    subject,
                    html
                }))
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
                continue;

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError("Resend returned {StatusCode}: {Response}", response.StatusCode, error);
            throw new HttpRequestException($"Resend email request failed with status {(int)response.StatusCode}.");
        }
    }
}

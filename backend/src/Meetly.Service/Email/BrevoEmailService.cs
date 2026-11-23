using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Meetly.Service.Email;

/// <summary>
/// Gửi email qua Brevo transactional API (`POST /v3/smtp/email`). Mỗi người nhận là một
/// `messageVersions` riêng nên không ai thấy địa chỉ của người khác.
/// </summary>
public sealed class BrevoEmailService(
    HttpClient httpClient,
    IOptions<BrevoOptions> options,
    ILogger<BrevoEmailService> logger) : IEmailService
{
    /// <summary>Số messageVersions mỗi request, giữ nhỏ để một lần lỗi không kéo theo quá nhiều người nhận.</summary>
    private const int BatchSize = 100;

    private readonly BrevoOptions _options = options.Value;

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
            string.IsNullOrWhiteSpace(_options.SenderEmail) ||
            string.IsNullOrWhiteSpace(_options.ApiUrl))
        {
            throw new InvalidOperationException("Brevo configuration is missing.");
        }

        var sender = string.IsNullOrWhiteSpace(_options.SenderName)
            ? (object)new { email = _options.SenderEmail }
            : new { name = _options.SenderName, email = _options.SenderEmail };

        foreach (var chunk in to.Chunk(BatchSize))
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _options.ApiUrl)
            {
                Content = JsonContent.Create(new
                {
                    sender,
                    subject,
                    htmlContent = html,
                    messageVersions = chunk.Select(recipient => new
                    {
                        to = new[] { new { email = recipient } }
                    })
                })
            };
            request.Headers.Add("api-key", _options.ApiKey);
            request.Headers.Accept.ParseAdd("application/json");

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
                continue;

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError("Brevo returned {StatusCode}: {Response}", response.StatusCode, error);
            throw new HttpRequestException($"Brevo email request failed with status {(int)response.StatusCode}.");
        }
    }
}

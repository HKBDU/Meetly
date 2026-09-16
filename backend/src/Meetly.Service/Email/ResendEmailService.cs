using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Meetly.Service.Email;

public sealed class ResendEmailService(
    HttpClient httpClient,
    IOptions<ResendOptions> options,
    ILogger<ResendEmailService> logger) : IEmailService
{
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

        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new
            {
                from = string.IsNullOrWhiteSpace(_options.FromName)
                    ? _options.FromEmail
                    : $"{_options.FromName} <{_options.FromEmail}>",
                to,
                subject,
                html
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
            return;

        var error = await response.Content.ReadAsStringAsync(cancellationToken);
        logger.LogError("Resend returned {StatusCode}: {Response}", response.StatusCode, error);
        throw new HttpRequestException($"Resend email request failed with status {(int)response.StatusCode}.");
    }
}

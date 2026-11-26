namespace Meetly.Service.Email;

public interface IEmailService
{
    Task SendAsync(
        IReadOnlyCollection<string> recipients,
        string subject,
        string html,
        IReadOnlyCollection<EmailAttachment> attachments,
        CancellationToken cancellationToken);
}

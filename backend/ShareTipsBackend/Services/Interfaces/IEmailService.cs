namespace ShareTipsBackend.Services.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string username, string resetToken);
    Task SendWelcomeEmailAsync(string toEmail, string username);
    Task SendTicketResultEmailAsync(string toEmail, string username, string ticketTitle, string result, decimal profitOrLoss);
    Task SendSubscriptionExpiringEmailAsync(string toEmail, string username, string tipsterName, int daysRemaining);
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
}

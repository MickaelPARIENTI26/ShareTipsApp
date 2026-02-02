using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _isEnabled;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _isEnabled = !string.IsNullOrEmpty(_configuration["Email:SmtpHost"]);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string username, string resetToken)
    {
        var resetUrl = $"{_configuration["Email:AppBaseUrl"] ?? "https://sharetips.app"}/reset-password?token={resetToken}";

        var subject = "ShareTips - Réinitialisation de votre mot de passe";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
        .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
        .code {{ background: #e5e7eb; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎯 ShareTips</h1>
        </div>
        <div class='content'>
            <h2>Bonjour {username},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <p style='text-align: center;'>
                <a href='{resetUrl}' class='button'>Réinitialiser mon mot de passe</a>
            </p>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <div class='code'>{resetUrl}</div>
            <p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>
                ⚠️ Ce lien expire dans 1 heure.<br>
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
        </div>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} ShareTips - Tous droits réservés</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string username)
    {
        var subject = "Bienvenue sur ShareTips ! 🎉";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .feature {{ background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }}
        .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎯 Bienvenue sur ShareTips !</h1>
        </div>
        <div class='content'>
            <h2>Salut {username} ! 👋</h2>
            <p>Ton compte a été créé avec succès. Voici ce que tu peux faire :</p>

            <div class='feature'>
                <strong>📊 Créer des tickets</strong><br>
                Partage tes pronostics avec la communauté
            </div>

            <div class='feature'>
                <strong>🛒 Marketplace</strong><br>
                Découvre les meilleurs pronostiqueurs
            </div>

            <div class='feature'>
                <strong>💰 Gagner des crédits</strong><br>
                Vends tes tickets ou abonnements
            </div>

            <p style='text-align: center; margin-top: 20px;'>
                <strong>Tu as 1000 crédits offerts pour commencer ! 🎁</strong>
            </p>
        </div>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} ShareTips - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendTicketResultEmailAsync(string toEmail, string username, string ticketTitle, string result, decimal profitOrLoss)
    {
        var isValidated = result.ToLower() == "won";
        var emoji = isValidated ? "✅" : "❌";
        var resultText = isValidated ? "VALIDÉ" : "NON VALIDÉ";
        var resultColor = isValidated ? "#10b981" : "#ef4444";

        var subject = $"ShareTips - Résultat de ton pronostic : {resultText} {emoji}";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {resultColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .result-box {{ background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid {resultColor}; }}
        .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{emoji} Pronostic {resultText}</h1>
        </div>
        <div class='content'>
            <h2>Salut {username},</h2>
            <p>Le résultat de ton pronostic est tombé !</p>

            <div class='result-box'>
                <h3 style='margin: 0;'>{ticketTitle}</h3>
                <p style='font-size: 24px; color: {resultColor}; font-weight: bold; margin: 15px 0;'>
                    {(profitOrLoss >= 0 ? "+" : "")}{profitOrLoss} crédits
                </p>
            </div>

            <p style='text-align: center; margin-top: 20px;'>
                Consulte ton historique dans l'app pour plus de détails.
            </p>
        </div>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} ShareTips - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendSubscriptionExpiringEmailAsync(string toEmail, string username, string tipsterName, int daysRemaining)
    {
        var urgency = daysRemaining <= 1 ? "⚠️" : "📅";
        var subject = $"ShareTips - Ton abonnement expire {(daysRemaining <= 1 ? "demain" : $"dans {daysRemaining} jours")} {urgency}";

        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .warning-box {{ background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }}
        .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{urgency} Abonnement bientôt expiré</h1>
        </div>
        <div class='content'>
            <h2>Salut {username},</h2>

            <div class='warning-box'>
                <p style='margin: 0;'>
                    <strong>Ton abonnement à {tipsterName}</strong> expire
                    {(daysRemaining <= 1 ? "demain" : $"dans {daysRemaining} jours")}.
                </p>
            </div>

            <p style='margin-top: 20px;'>
                Pour continuer à accéder aux pronostics de {tipsterName}, pense à renouveler ton abonnement.
            </p>

            <p style='text-align: center; margin-top: 20px;'>
                <a href='{_configuration["Email:AppBaseUrl"] ?? "https://sharetips.app"}' class='button'>
                    Renouveler maintenant
                </a>
            </p>
        </div>
        <div class='footer'>
            <p>© {DateTime.UtcNow.Year} ShareTips - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        if (!_isEnabled)
        {
            _logger.LogWarning("Email service is disabled (SMTP not configured). Would send to {Email}: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "ShareTips",
                _configuration["Email:FromAddress"] ?? "noreply@sharetips.app"));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            var host = _configuration["Email:SmtpHost"]!;
            var port = _configuration.GetValue<int>("Email:SmtpPort", 587);
            var useSsl = _configuration.GetValue<bool>("Email:UseSsl", false);

            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls);

            var username = _configuration["Email:SmtpUsername"];
            var password = _configuration["Email:SmtpPassword"];

            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}: {Subject}", toEmail, subject);
            throw;
        }
    }
}

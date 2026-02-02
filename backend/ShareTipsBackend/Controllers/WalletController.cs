using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion du portefeuille et des crédits
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("financial")]
[Tags("Portefeuille")]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly IConfiguration _configuration;

    public WalletController(IWalletService walletService, IConfiguration configuration)
    {
        _walletService = walletService;
        _configuration = configuration;
    }

    /// <summary>
    /// Get current user's wallet
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(WalletDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWallet()
    {
        var userId = GetUserId();
        var wallet = await _walletService.GetByUserIdAsync(userId);

        if (wallet == null)
            return NotFound(new { error = "Wallet not found" });

        return Ok(wallet);
    }

    /// <summary>
    /// Get wallet transaction history
    /// </summary>
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IEnumerable<WalletTransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions()
    {
        var userId = GetUserId();
        var transactions = await _walletService.GetTransactionsAsync(userId);
        return Ok(transactions);
    }

    /// <summary>
    /// Credit wallet (add credits) - ADMIN ONLY
    /// Used for manual adjustments and support operations.
    /// Regular users should use the /deposit endpoint.
    /// </summary>
    [HttpPost("credit")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WalletOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WalletOperationResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Credit([FromBody] CreditWalletRequest request)
    {
        var userId = GetUserId();
        var result = await _walletService.CreditAsync(userId, request.Amount, request.Description);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Debit wallet (remove credits) - ADMIN ONLY
    /// Used for manual adjustments and support operations.
    /// </summary>
    [HttpPost("debit")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WalletOperationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WalletOperationResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Debit([FromBody] DebitWalletRequest request)
    {
        var userId = GetUserId();
        var result = await _walletService.DebitAsync(userId, request.Amount, request.Description);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Initiate a deposit via MoonPay (1€ = 10 credits)
    /// </summary>
    [HttpPost("deposit")]
    [ProducesResponseType(typeof(DepositResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DepositResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request)
    {
        var userId = GetUserId();
        var result = await _walletService.InitiateDepositAsync(userId, request.AmountEur);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// MoonPay webhook — called when payment is completed
    /// </summary>
    [HttpPost("moonpay/webhook")]
    [AllowAnonymous]
    [DisableRateLimiting]
    public async Task<IActionResult> MoonPayWebhook(
        [FromServices] IWebHostEnvironment env,
        [FromServices] ILogger<WalletController> logger)
    {
        // Read raw body for signature verification
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync();

        // Verify MoonPay signature
        var signature = Request.Headers["Moonpay-Signature"].FirstOrDefault();
        var webhookSecret = _configuration["MoonPay:WebhookSecret"];

        // SECURITY: Webhook secret is REQUIRED in production
        if (string.IsNullOrEmpty(webhookSecret))
        {
            if (!env.IsDevelopment())
            {
                logger.LogError("MoonPay webhook called but MOONPAY_WEBHOOK_SECRET is not configured!");
                return StatusCode(500, new { error = "Webhook not configured" });
            }

            // Allow in development without signature for testing
            logger.LogWarning("MoonPay webhook signature verification SKIPPED (development mode)");
        }
        else
        {
            // Signature is required when secret is configured
            if (string.IsNullOrEmpty(signature))
            {
                logger.LogWarning("MoonPay webhook received without signature");
                return Unauthorized(new { error = "Missing signature" });
            }

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
            var computedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody)));

            if (!string.Equals(computedHash, signature, StringComparison.Ordinal))
            {
                logger.LogWarning("MoonPay webhook received with invalid signature");
                return Unauthorized(new { error = "Invalid signature" });
            }

            logger.LogInformation("MoonPay webhook signature verified successfully");
        }

        // Deserialize the payload
        MoonPayWebhookPayload? payload;
        try
        {
            payload = System.Text.Json.JsonSerializer.Deserialize<MoonPayWebhookPayload>(rawBody,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return BadRequest(new { error = "Invalid payload" });
        }

        if (payload == null)
            return BadRequest(new { error = "Empty payload" });

        // Only process completed transactions
        if (!string.Equals(payload.Data.Status, "completed", StringComparison.OrdinalIgnoreCase))
            return Ok(new { message = "Status ignored", status = payload.Data.Status });

        // Use externalTransactionId (our internal txId) to find and confirm
        var externalTxId = payload.Data.ExternalTransactionId ?? payload.Data.Id;
        var confirmed = await _walletService.ConfirmDepositAsync(externalTxId);

        if (!confirmed)
            return NotFound(new { error = "Transaction not found" });

        return Ok(new { message = "Deposit confirmed" });
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user token");
        }

        return userId;
    }
}

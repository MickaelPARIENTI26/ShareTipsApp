using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Stripe;
using ShareTipsBackend.Data;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Stripe Connect integration - Onboarding and webhooks
/// </summary>
[Route("api/[controller]")]
[Tags("Stripe")]
public class StripeController : ApiControllerBase
{
    private readonly IStripeConnectService _stripeService;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeController> _logger;

    public StripeController(
        IStripeConnectService stripeService,
        ApplicationDbContext context,
        IConfiguration config,
        ILogger<StripeController> logger)
    {
        _stripeService = stripeService;
        _context = context;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Start Stripe Connect onboarding for tipsters
    /// </summary>
    [HttpPost("connect/onboard")]
    [Authorize]
    [EnableRateLimiting("financial")]
    [ProducesResponseType(typeof(OnboardingLinkDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartOnboarding()
    {
        try
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound(new { error = "User not found" });

            var result = await _stripeService.CreateConnectedAccountAsync(userId, user.Email);
            return Ok(result);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe error during onboarding");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during onboarding");
            return BadRequest(new { error = "Failed to start onboarding" });
        }
    }

    /// <summary>
    /// Get current Stripe Connect account status
    /// </summary>
    [HttpGet("connect/status")]
    [Authorize]
    [ProducesResponseType(typeof(ConnectedAccountStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var userId = GetUserId();
            var status = await _stripeService.GetAccountStatusAsync(userId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Stripe status");
            return BadRequest(new { error = "Failed to get status" });
        }
    }

    /// <summary>
    /// Refresh expired Stripe Connect onboarding link
    /// </summary>
    [HttpPost("connect/refresh-link")]
    [Authorize]
    [EnableRateLimiting("financial")]
    [ProducesResponseType(typeof(OnboardingLinkDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshLink()
    {
        try
        {
            var userId = GetUserId();
            var result = await _stripeService.RefreshAccountLinkAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing onboarding link");
            return BadRequest(new { error = "Failed to refresh link" });
        }
    }

    /// <summary>
    /// Get tipster wallet balance (EUR)
    /// </summary>
    [HttpGet("wallet")]
    [Authorize]
    [ProducesResponseType(typeof(TipsterWalletDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTipsterWallet()
    {
        var userId = GetUserId();
        var wallet = await _stripeService.GetTipsterBalanceAsync(userId);
        return Ok(wallet);
    }

    /// <summary>
    /// Request a payout to bank account
    /// </summary>
    [HttpPost("payout")]
    [Authorize]
    [EnableRateLimiting("financial")]
    [ProducesResponseType(typeof(PayoutResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestPayout([FromBody] PayoutRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _stripeService.RequestPayoutAsync(userId, request.AmountCents);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting payout");
            return BadRequest(new { error = "Failed to request payout" });
        }
    }

    /// <summary>
    /// Stripe webhook endpoint
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    [DisableRateLimiting]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        var webhookSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET")
            ?? _config["Stripe:WebhookSecret"];

        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("Stripe webhook secret not configured");
            // In development, we might want to process anyway
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return StatusCode(500, new { error = "Webhook not configured" });
            }
        }

        try
        {
            Event? stripeEvent;

            if (!string.IsNullOrEmpty(webhookSecret) && !string.IsNullOrEmpty(signature))
            {
                stripeEvent = EventUtility.ConstructEvent(json, signature, webhookSecret);
            }
            else
            {
                // Development mode without signature
                stripeEvent = EventUtility.ParseEvent(json);
            }

            _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);

            switch (stripeEvent.Type)
            {
                case "account.updated":
                    if (stripeEvent.Data.Object is Account account)
                    {
                        await _stripeService.UpdateAccountStatusFromWebhookAsync(account.Id);
                    }
                    break;

                case "payment_intent.succeeded":
                    if (stripeEvent.Data.Object is PaymentIntent piSucceeded)
                    {
                        await _stripeService.HandlePaymentSucceededAsync(piSucceeded.Id);
                    }
                    break;

                case "payment_intent.payment_failed":
                    if (stripeEvent.Data.Object is PaymentIntent piFailed)
                    {
                        var reason = piFailed.LastPaymentError?.Message ?? "Payment failed";
                        await _stripeService.HandlePaymentFailedAsync(piFailed.Id, reason);
                    }
                    break;

                case "payout.paid":
                case "payout.failed":
                case "payout.canceled":
                    if (stripeEvent.Data.Object is Payout payout)
                    {
                        await _stripeService.HandlePayoutWebhookAsync(payout.Id, stripeEvent.Type);
                    }
                    break;

                default:
                    _logger.LogDebug("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Invalid Stripe webhook signature");
            return BadRequest(new { error = "Invalid signature" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return StatusCode(500, new { error = "Webhook processing failed" });
        }
    }
}

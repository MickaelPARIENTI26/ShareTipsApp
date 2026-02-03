using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion des abonnements aux pronostiqueurs
/// </summary>
[Route("api/[controller]")]
[Authorize]
[Tags("Abonnements")]
public class SubscriptionsController : ApiControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    /// <summary>
    /// Subscribe using a subscription plan (via Stripe)
    /// </summary>
    [HttpPost("plan/{planId:guid}")]
    [ProducesResponseType(typeof(SubscriptionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubscribeWithPlan(Guid planId)
    {
        var userId = GetUserId();
        var result = await _subscriptionService.SubscribeWithPlanAsync(userId, planId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Initiate a Stripe-based subscription with a plan
    /// </summary>
    [HttpPost("initiate/{planId:guid}")]
    [ProducesResponseType(typeof(PaymentIntentResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> InitiateSubscription(Guid planId)
    {
        var userId = GetUserId();
        var result = await _subscriptionService.InitiateSubscriptionWithPlanAsync(userId, planId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Confirm a subscription after Stripe payment succeeded
    /// </summary>
    [HttpPost("confirm/{subscriptionId:guid}")]
    [ProducesResponseType(typeof(SubscriptionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmSubscription(Guid subscriptionId)
    {
        var result = await _subscriptionService.ConfirmSubscriptionAsync(subscriptionId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Unsubscribe from a tipster
    /// </summary>
    [HttpDelete("{tipsterId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unsubscribe(Guid tipsterId)
    {
        var userId = GetUserId();
        var result = await _subscriptionService.UnsubscribeAsync(userId, tipsterId);

        if (!result)
        {
            return NotFound(new { error = "Subscription not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Get my subscriptions (tipsters I follow)
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(IEnumerable<SubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySubscriptions()
    {
        var userId = GetUserId();
        var subscriptions = await _subscriptionService.GetMySubscriptionsAsync(userId);
        return Ok(subscriptions);
    }

    /// <summary>
    /// Get my subscribers (users who follow me)
    /// </summary>
    [HttpGet("subscribers")]
    [ProducesResponseType(typeof(IEnumerable<SubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySubscribers()
    {
        var userId = GetUserId();
        var subscribers = await _subscriptionService.GetMySubscribersAsync(userId);
        return Ok(subscribers);
    }

    /// <summary>
    /// Get subscription status with a tipster
    /// </summary>
    [HttpGet("status/{tipsterId:guid}")]
    [ProducesResponseType(typeof(SubscriptionStatusDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscriptionStatus(Guid tipsterId)
    {
        var userId = GetUserId();
        var status = await _subscriptionService.GetSubscriptionStatusAsync(userId, tipsterId);
        return Ok(status);
    }
}

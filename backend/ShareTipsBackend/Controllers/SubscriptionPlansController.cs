using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[Route("api/[controller]")]
[Authorize]
public class SubscriptionPlansController : ApiControllerBase
{
    private readonly ISubscriptionPlanService _subscriptionPlanService;

    public SubscriptionPlansController(ISubscriptionPlanService subscriptionPlanService)
    {
        _subscriptionPlanService = subscriptionPlanService;
    }

    /// <summary>
    /// Get my subscription plans (as tipster)
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(IEnumerable<SubscriptionPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPlans()
    {
        var userId = GetUserId();
        var plans = await _subscriptionPlanService.GetByTipsterIdAsync(userId);
        return Ok(plans);
    }

    /// <summary>
    /// Get active subscription plans for a tipster (public)
    /// </summary>
    [HttpGet("tipster/{tipsterId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SubscriptionPlanDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTipsterPlans(Guid tipsterId)
    {
        var plans = await _subscriptionPlanService.GetActiveByTipsterIdAsync(tipsterId);
        return Ok(plans);
    }

    /// <summary>
    /// Get a specific subscription plan
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SubscriptionPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var plan = await _subscriptionPlanService.GetByIdAsync(id);
        if (plan == null)
            return NotFound(new { error = "Plan not found" });
        return Ok(plan);
    }

    /// <summary>
    /// Create a new subscription plan
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SubscriptionPlanDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionPlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { error = "Title is required" });

        if (request.DurationInDays <= 0)
            return BadRequest(new { error = "Duration must be positive" });

        if (request.PriceCredits <= 0)
            return BadRequest(new { error = "Price must be positive" });

        var userId = GetUserId();
        var plan = await _subscriptionPlanService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
    }

    /// <summary>
    /// Update a subscription plan
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(SubscriptionPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubscriptionPlanRequest request)
    {
        var userId = GetUserId();
        var plan = await _subscriptionPlanService.UpdateAsync(id, userId, request);

        if (plan == null)
            return NotFound(new { error = "Plan not found or not owned by you" });

        return Ok(plan);
    }

    /// <summary>
    /// Delete a subscription plan
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var result = await _subscriptionPlanService.DeleteAsync(id, userId);

        if (!result)
            return NotFound(new { error = "Plan not found or not owned by you" });

        return NoContent();
    }
}

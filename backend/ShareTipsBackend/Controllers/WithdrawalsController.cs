using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("financial")]
public class WithdrawalsController : ApiControllerBase
{
    private readonly IWithdrawalService _withdrawalService;

    public WithdrawalsController(IWithdrawalService withdrawalService)
    {
        _withdrawalService = withdrawalService;
    }

    /// <summary>
    /// Create a withdrawal request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WithdrawalResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateWithdrawal([FromBody] CreateWithdrawalRequest request)
    {
        var userId = GetUserId();
        var result = await _withdrawalService.CreateWithdrawalAsync(userId, (int)(request.AmountEur * 100), request.Method);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get my withdrawal requests
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WithdrawalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyWithdrawals()
    {
        var userId = GetUserId();
        var withdrawals = await _withdrawalService.GetUserWithdrawalsAsync(userId);
        return Ok(withdrawals);
    }

    /// <summary>
    /// Get pending withdrawal requests (Admin only)
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<WithdrawalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingWithdrawals()
    {
        var withdrawals = await _withdrawalService.GetPendingWithdrawalsAsync();
        return Ok(withdrawals);
    }

    /// <summary>
    /// Process a withdrawal request (Admin only)
    /// </summary>
    [HttpPost("{id:guid}/process")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(WithdrawalResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessWithdrawal(Guid id, [FromBody] ProcessWithdrawalRequest request)
    {
        var result = await _withdrawalService.ProcessWithdrawalAsync(id, request.Approve, request.AdminNotes);

        if (!result.Success)
        {
            if (result.Message == "Withdrawal request not found")
                return NotFound(new { error = result.Message });
            return BadRequest(result);
        }

        return Ok(result);
    }
}

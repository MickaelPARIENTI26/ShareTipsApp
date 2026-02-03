using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion du portefeuille et des crédits
/// </summary>
[Route("api/[controller]")]
[Authorize]
[EnableRateLimiting("financial")]
[Tags("Portefeuille")]
public class WalletController : ApiControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
    {
        _walletService = walletService;
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
}

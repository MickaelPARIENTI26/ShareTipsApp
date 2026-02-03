using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion du portefeuille tipster (Stripe Connect)
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
    /// Get current user's tipster wallet (earnings from Stripe Connect)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(TipsterWalletDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWallet()
    {
        var userId = GetUserId();
        var wallet = await _walletService.GetTipsterWalletAsync(userId);

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
}

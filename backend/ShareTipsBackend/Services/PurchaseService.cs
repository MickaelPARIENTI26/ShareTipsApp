using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;
using ShareTipsBackend.Utilities;

namespace ShareTipsBackend.Services;

public class PurchaseService : IPurchaseService
{
    private readonly ApplicationDbContext _context;
    private readonly IConsentService _consentService;
    private readonly ILogger<PurchaseService> _logger;

    public PurchaseService(
        ApplicationDbContext context,
        IConsentService consentService,
        ILogger<PurchaseService> logger)
    {
        _context = context;
        _consentService = consentService;
        _logger = logger;
    }

    public async Task<PurchaseResultDto> PurchaseTicketAsync(Guid buyerId, Guid ticketId)
    {
        // Check consent first (before any transaction)
        var hasConsent = await _consentService.HasConsentAsync(buyerId, ConsentTypes.NoGuarantee);
        if (!hasConsent)
        {
            return new PurchaseResultDto(false, "Consent required", null, 0);
        }

        // Use transaction for atomicity
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Get ticket with creator
            var ticket = await _context.Tickets
                .Include(t => t.Creator)
                .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

            if (ticket == null)
            {
                return new PurchaseResultDto(false, "Ticket not found", null, 0);
            }

            // Business rule: Cannot buy own ticket
            if (ticket.CreatorId == buyerId)
            {
                return new PurchaseResultDto(false, "Cannot buy your own ticket", null, 0);
            }

            // Business rule: Ticket must be OPEN
            if (ticket.Status != TicketStatus.Open)
            {
                return new PurchaseResultDto(false, "Ticket is not available for purchase", null, 0);
            }

            // Check if already purchased by this buyer
            var alreadyPurchased = await _context.TicketPurchases
                .AnyAsync(p => p.TicketId == ticketId && p.BuyerId == buyerId);

            if (alreadyPurchased)
            {
                return new PurchaseResultDto(false, "You have already purchased this ticket", null, 0);
            }

            // Lock wallets in consistent order to prevent deadlocks
            var sellerId = ticket.CreatorId;
            var (buyerWallet, sellerWallet) = await WalletOperations.LockWalletsInOrderAsync(
                _context, buyerId, sellerId);

            if (buyerWallet == null)
            {
                return new PurchaseResultDto(false, "Buyer wallet not found", null, 0);
            }

            if (sellerWallet == null)
            {
                return new PurchaseResultDto(false, "Seller wallet not found", null, buyerWallet.BalanceCredits);
            }

            // Business rule: Sufficient credits (accounting for locked credits)
            var availableCredits = buyerWallet.BalanceCredits - buyerWallet.LockedCredits;
            if (availableCredits < ticket.PriceCredits)
            {
                return new PurchaseResultDto(false, "Insufficient credits", null, availableCredits);
            }

            // Calculate amounts using shared utility
            var totalPrice = ticket.PriceCredits;
            var (commissionCredits, sellerCredits) = WalletOperations.CalculateCommission(totalPrice);

            // Transfer credits and create transaction records
            WalletOperations.TransferCreditsWithCommission(
                _context,
                buyerWallet,
                sellerWallet,
                totalPrice,
                ticketId,
                TransactionType.Purchase,
                TransactionType.Sale);

            // Create purchase record
            var purchase = new TicketPurchase
            {
                Id = Guid.NewGuid(),
                TicketId = ticketId,
                BuyerId = buyerId,
                PriceCredits = totalPrice,
                CommissionCredits = commissionCredits,
                CreatedAt = DateTime.UtcNow
            };
            _context.TicketPurchases.Add(purchase);

            // Save and commit
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Load buyer info for response
            var buyer = await _context.Users.FindAsync(buyerId);

            var purchaseDto = new PurchaseDto(
                purchase.Id,
                ticket.Id,
                ticket.Title,
                ticket.CreatorId,
                ticket.Creator?.Username ?? "Unknown",
                buyerId,
                buyer?.Username ?? "Unknown",
                totalPrice,
                commissionCredits,
                sellerCredits,
                purchase.CreatedAt
            );

            return new PurchaseResultDto(true, "Purchase successful", purchaseDto, buyerWallet.BalanceCredits);
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key") == true ||
                                            ex.InnerException?.Message.Contains("unique constraint") == true)
        {
            // Race condition: another request already purchased the ticket
            _logger.LogWarning("Duplicate purchase attempt: BuyerId={BuyerId}, TicketId={TicketId}", buyerId, ticketId);
            await transaction.RollbackAsync();
            return new PurchaseResultDto(false, "You have already purchased this ticket", null, 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Purchase failed: BuyerId={BuyerId}, TicketId={TicketId}", buyerId, ticketId);
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<PurchaseDto>> GetPurchasesByBuyerAsync(Guid buyerId)
    {
        var purchases = await _context.TicketPurchases
            .Include(p => p.Ticket)
                .ThenInclude(t => t!.Creator)
            .Include(p => p.Buyer)
            .Where(p => p.BuyerId == buyerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return purchases.Select(MapToDto);
    }

    public async Task<PaginatedResult<PurchaseDto>> GetPurchasesByBuyerPaginatedAsync(Guid buyerId, int page, int pageSize)
    {
        var query = _context.TicketPurchases
            .Include(p => p.Ticket)
                .ThenInclude(t => t!.Creator)
            .Include(p => p.Buyer)
            .Where(p => p.BuyerId == buyerId)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();

        var purchases = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = purchases.Select(MapToDto);

        return PaginatedResult<PurchaseDto>.Create(dtos, page, pageSize, totalCount);
    }

    public async Task<IEnumerable<PurchaseDto>> GetSalesBySellerAsync(Guid sellerId)
    {
        var purchases = await _context.TicketPurchases
            .Include(p => p.Ticket)
                .ThenInclude(t => t!.Creator)
            .Include(p => p.Buyer)
            .Where(p => p.Ticket!.CreatorId == sellerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return purchases.Select(MapToDto);
    }

    private static PurchaseDto MapToDto(TicketPurchase purchase)
    {
        var sellerCredits = purchase.PriceCredits - purchase.CommissionCredits;

        return new PurchaseDto(
            purchase.Id,
            purchase.TicketId,
            purchase.Ticket?.Title ?? "Unknown",
            purchase.Ticket?.CreatorId ?? Guid.Empty,
            purchase.Ticket?.Creator?.Username ?? "Unknown",
            purchase.BuyerId,
            purchase.Buyer?.Username ?? "Unknown",
            purchase.PriceCredits,
            purchase.CommissionCredits,
            sellerCredits,
            purchase.CreatedAt
        );
    }
}

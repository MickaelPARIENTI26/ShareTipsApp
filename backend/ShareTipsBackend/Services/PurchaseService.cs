using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.Domain.Entities;
using ShareTipsBackend.Domain.Enums;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Services;

public class PurchaseService : IPurchaseService
{
    private readonly ApplicationDbContext _context;
    private readonly IConsentService _consentService;
    private readonly IStripeConnectService _stripeService;
    private readonly ILogger<PurchaseService> _logger;
    private const decimal PlatformFeePercent = 0.10m; // 10% commission

    public PurchaseService(
        ApplicationDbContext context,
        IConsentService consentService,
        IStripeConnectService stripeService,
        ILogger<PurchaseService> logger)
    {
        _context = context;
        _consentService = consentService;
        _stripeService = stripeService;
        _logger = logger;
    }

    /// <summary>
    /// Initiate a Stripe-based ticket purchase
    /// </summary>
    public async Task<PaymentIntentResultDto> InitiatePurchaseAsync(Guid buyerId, Guid ticketId)
    {
        // Check consent first
        var hasConsent = await _consentService.HasConsentAsync(buyerId, ConsentTypes.NoGuarantee);
        if (!hasConsent)
        {
            return new PaymentIntentResultDto(false, null, null, "Consentement requis");
        }

        // Validate ticket
        var ticket = await _context.Tickets
            .Include(t => t.Creator)
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.DeletedAt == null);

        if (ticket == null)
        {
            return new PaymentIntentResultDto(false, null, null, "Ticket introuvable");
        }

        if (ticket.Status != TicketStatus.Open)
        {
            return new PaymentIntentResultDto(false, null, null, "Ticket non disponible");
        }

        if (ticket.CreatorId == buyerId)
        {
            return new PaymentIntentResultDto(false, null, null, "Impossible d'acheter son propre ticket");
        }

        // Check if already purchased
        var alreadyPurchased = await _context.TicketPurchases
            .AnyAsync(p => p.TicketId == ticketId && p.BuyerId == buyerId);
        if (alreadyPurchased)
        {
            return new PaymentIntentResultDto(false, null, null, "Déjà acheté");
        }

        // Use EUR cents price
        var priceCents = ticket.PriceCents;

        var commissionCents = (int)Math.Ceiling(priceCents * PlatformFeePercent);
        var sellerAmountCents = priceCents - commissionCents;

        // Create pending purchase record
        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            BuyerId = buyerId,
            PriceCents = priceCents,
            CommissionCents = commissionCents,
            SellerAmountCents = sellerAmountCents,
            CreatedAt = DateTime.UtcNow
        };
        _context.TicketPurchases.Add(purchase);
        await _context.SaveChangesAsync();

        // Create Stripe PaymentIntent
        var result = await _stripeService.CreatePaymentIntentAsync(
            buyerId,
            ticket.CreatorId,
            priceCents,
            PaymentType.TicketPurchase,
            purchase.Id,
            $"Achat ticket: {ticket.Title}"
        );

        if (result.Success && result.PaymentId.HasValue)
        {
            purchase.StripePaymentId = result.PaymentId;
            await _context.SaveChangesAsync();
        }
        else
        {
            // Remove failed purchase record
            _context.TicketPurchases.Remove(purchase);
            await _context.SaveChangesAsync();
        }

        return result;
    }

    /// <summary>
    /// Confirm a purchase after Stripe payment succeeded
    /// </summary>
    public async Task<PurchaseResultDto> ConfirmPurchaseAsync(Guid purchaseId)
    {
        var purchase = await _context.TicketPurchases
            .Include(p => p.StripePayment)
            .Include(p => p.Ticket)
                .ThenInclude(t => t!.Creator)
            .Include(p => p.Buyer)
            .FirstOrDefaultAsync(p => p.Id == purchaseId);

        if (purchase == null)
        {
            return new PurchaseResultDto(false, "Achat introuvable", null, 0);
        }

        if (purchase.StripePayment?.Status != StripePaymentStatus.Succeeded)
        {
            return new PurchaseResultDto(false, "Paiement non confirmé", null, 0);
        }

        var purchaseDto = MapToDto(purchase);
        return new PurchaseResultDto(true, "Achat réussi", purchaseDto, 0);
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
        // Convert cents to EUR for DTO
        var priceEur = purchase.PriceCents / 100m;
        var commissionEur = purchase.CommissionCents / 100m;
        var sellerEarningsEur = purchase.SellerAmountCents / 100m;

        return new PurchaseDto(
            purchase.Id,
            purchase.TicketId,
            purchase.Ticket?.Title ?? "Unknown",
            purchase.Ticket?.CreatorId ?? Guid.Empty,
            purchase.Ticket?.Creator?.Username ?? "Unknown",
            purchase.BuyerId,
            purchase.Buyer?.Username ?? "Unknown",
            priceEur,
            commissionEur,
            sellerEarningsEur,
            purchase.CreatedAt
        );
    }
}

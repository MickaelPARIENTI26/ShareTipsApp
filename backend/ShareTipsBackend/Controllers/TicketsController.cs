using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTipsBackend.Common;
using ShareTipsBackend.Data;
using ShareTipsBackend.DTOs;
using ShareTipsBackend.Services.Interfaces;

namespace ShareTipsBackend.Controllers;

/// <summary>
/// Gestion des tickets de pronostics
/// </summary>
[Route("api/[controller]")]
[Authorize]
[Tags("Tickets")]
public class TicketsController : ApiControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly IAccessControlService _accessControl;
    private readonly ApplicationDbContext _context;

    public TicketsController(
        ITicketService ticketService,
        IAccessControlService accessControl,
        ApplicationDbContext context)
    {
        _ticketService = ticketService;
        _accessControl = accessControl;
        _context = context;
    }

    /// <summary>
    /// Get current user's tickets with pagination
    /// </summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(PaginatedResult<TicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();
        var tickets = await _ticketService.GetByUserIdPaginatedAsync(userId, page, pageSize);
        return Ok(tickets);
    }

    /// <summary>
    /// Get public tickets (marketplace) with pagination and filters
    /// </summary>
    [HttpGet("public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginatedResult<TicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicTickets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sports = null,
        [FromQuery] decimal? minOdds = null,
        [FromQuery] decimal? maxOdds = null,
        [FromQuery] int? minConfidence = null,
        [FromQuery] int? maxConfidence = null,
        [FromQuery] int? minSelections = null,
        [FromQuery] int? maxSelections = null,
        [FromQuery] bool? followedOnly = null,
        [FromQuery] Guid? creatorId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? ticketType = null)
    {
        Guid? userId = await GetUserIdFromAuthAsync();
        Guid? followedByUserId = followedOnly == true ? userId : null;
        var result = await _ticketService.GetPublicTicketsPaginatedAsync(
            page, pageSize, sports, minOdds, maxOdds, minConfidence, maxConfidence,
            minSelections, maxSelections, followedByUserId, creatorId, sortBy,
            excludeUserId: userId, currentUserId: userId, ticketType: ticketType);
        return Ok(result);
    }

    /// <summary>
    /// Get filter metadata (dynamic ranges for marketplace filters)
    /// </summary>
    [HttpGet("public/meta")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TicketFilterMetaDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilterMeta()
    {
        Guid? userId = await GetUserIdFromAuthAsync();
        var meta = await _ticketService.GetFilterMetaAsync(excludeUserId: userId);
        return Ok(meta);
    }

    /// <summary>
    /// Get a specific ticket by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TicketDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ticket = await _ticketService.GetByIdAsync(id);

        if (ticket == null)
            return NotFound(new { error = "Ticket not found" });

        // If ticket is private, check access using centralized AccessControlService
        if (!ticket.IsPublic)
        {
            var userId = await GetUserIdFromAuthAsync();

            if (!userId.HasValue)
            {
                // Anonymous user - show ticket without selections
                return Ok(ticket with
                {
                    Selections = new List<TicketSelectionDto>(),
                    IsPurchasedByCurrentUser = false,
                    IsSubscribedToCreator = false
                });
            }

            var accessResult = await _accessControl.CanAccessTicketAsync(userId.Value, id);

            if (!accessResult.HasAccess)
            {
                // User can see the ticket but not the selections
                return Ok(ticket with
                {
                    Selections = new List<TicketSelectionDto>(),
                    IsPurchasedByCurrentUser = false,
                    IsSubscribedToCreator = false
                });
            }

            // User has access - determine type for response
            var hasPurchased = accessResult.AccessType == AccessType.Purchase;
            var hasSubscription = accessResult.AccessType == AccessType.Subscription;

            return Ok(ticket with
            {
                IsPurchasedByCurrentUser = hasPurchased,
                IsSubscribedToCreator = hasSubscription
            });
        }

        return Ok(ticket);
    }

    /// <summary>
    /// Create a new ticket
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TicketDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto request)
    {
        try
        {
            var userId = GetUserId();
            var ticket = await _ticketService.CreateAsync(userId, request);
            return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update a ticket (only creator, before first match, if not purchased)
    /// </summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(TicketDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTicketDto request)
    {
        try
        {
            var userId = GetUserId();
            var ticket = await _ticketService.UpdateAsync(id, userId, request);

            if (ticket == null)
                return NotFound(new { error = "Ticket not found" });

            return Ok(ticket);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a ticket (only creator, before lock, if not purchased)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var result = await _ticketService.DeleteAsync(id, userId);

            if (!result)
                return NotFound(new { error = "Ticket not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

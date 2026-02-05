import apiClient from '../../api/client';
import { ticketApi, type CreateTicketPayload } from '../../api/ticket.api';

// Mock the client
jest.mock('../../api/client', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ticketApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call POST /api/tickets with ticket payload', async () => {
      const mockTicket = {
        id: 'ticket-123',
        title: 'My Ticket',
        isPublic: true,
        priceEur: 5.0,
        confidenceIndex: 8,
        selections: [],
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockTicket });

      const payload: CreateTicketPayload = {
        title: 'My Ticket',
        isPublic: true,
        priceEur: 5.0,
        confidenceIndex: 8,
        selections: [
          {
            matchId: 'match-1',
            sport: 'FOOTBALL',
            marketType: '1X2',
            selectionCode: 'HOME',
            odds: 1.85,
            matchLabel: 'Team A vs Team B',
            leagueName: 'Ligue 1',
          },
        ],
      };

      const result = await ticketApi.create(payload);

      expect(mockedClient.post).toHaveBeenCalledWith('/api/tickets', payload);
      expect(result.data.id).toBe('ticket-123');
    });
  });

  describe('getMyTickets', () => {
    it('should call GET /api/tickets/my', async () => {
      const mockTickets = [
        { id: 'ticket-1', title: 'Ticket 1' },
        { id: 'ticket-2', title: 'Ticket 2' },
      ];
      mockedClient.get.mockResolvedValueOnce({ data: mockTickets });

      const result = await ticketApi.getMyTickets();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/my');
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getMyTicketsPaginated', () => {
    it('should call GET /api/tickets/my with pagination params', async () => {
      const mockResponse = {
        items: [{ id: 'ticket-1' }],
        totalCount: 25,
        page: 2,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await ticketApi.getMyTicketsPaginated(2, 10);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/my?page=2&pageSize=10');
      expect(result.data.page).toBe(2);
      expect(result.data.hasNextPage).toBe(true);
    });

    it('should use default pagination values', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0, page: 1, pageSize: 15 },
      });

      await ticketApi.getMyTicketsPaginated();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/my?page=1&pageSize=15');
    });
  });

  describe('getById', () => {
    it('should call GET /api/tickets/:id', async () => {
      const mockTicket = {
        id: 'ticket-abc-123',
        title: 'Specific Ticket',
        selections: [
          { matchId: 'm1', selectionLabel: 'Home Win', odds: 1.75 },
        ],
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockTicket });

      const result = await ticketApi.getById('ticket-abc-123');

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/ticket-abc-123');
      expect(result.data.title).toBe('Specific Ticket');
    });

    it('should handle not found errors', async () => {
      const error = { response: { status: 404, data: { error: 'Ticket not found' } } };
      mockedClient.get.mockRejectedValueOnce(error);

      await expect(ticketApi.getById('nonexistent')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});

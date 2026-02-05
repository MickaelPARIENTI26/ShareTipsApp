import apiClient from '../../api/client';
import { marketplaceApi, type MarketplaceFilters } from '../../api/marketplace.api';

// Mock the client
jest.mock('../../api/client', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('marketplaceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTickets', () => {
    it('should call GET /api/tickets/public with empty params when no filters', async () => {
      const mockResponse = {
        items: [{ id: 'ticket-1' }, { id: 'ticket-2' }],
        totalCount: 50,
        page: 1,
        pageSize: 20,
        hasNextPage: true,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await marketplaceApi.getPublicTickets({});

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: {},
      });
      expect(result.data.items).toHaveLength(2);
    });

    it('should include sport filters in params', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        sports: ['FOOTBALL', 'TENNIS'],
        page: 1,
        pageSize: 15,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: {
          sports: 'FOOTBALL,TENNIS',
          page: '1',
          pageSize: '15',
        },
      });
    });

    it('should include odds range filters', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        minOdds: 1.5,
        maxOdds: 3.0,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          minOdds: '1.5',
          maxOdds: '3',
        }),
      });
    });

    it('should include confidence filters', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        minConfidence: 7,
        maxConfidence: 10,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          minConfidence: '7',
          maxConfidence: '10',
        }),
      });
    });

    it('should include selection count filters', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        minSelections: 3,
        maxSelections: 10,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          minSelections: '3',
          maxSelections: '10',
        }),
      });
    });

    it('should include followedOnly flag', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        followedOnly: true,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          followedOnly: 'true',
        }),
      });
    });

    it('should include ticketType filter', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        ticketType: 'private',
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          ticketType: 'private',
        }),
      });
    });

    it('should include pagination params', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 100, page: 3 },
      });

      const filters: MarketplaceFilters = {
        page: 3,
        pageSize: 25,
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          page: '3',
          pageSize: '25',
        }),
      });
    });

    it('should include creatorId and sortBy params', async () => {
      mockedClient.get.mockResolvedValueOnce({
        data: { items: [], totalCount: 0 },
      });

      const filters: MarketplaceFilters = {
        creatorId: 'user-123',
        sortBy: 'createdAt',
      };

      await marketplaceApi.getPublicTickets(filters);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public', {
        params: expect.objectContaining({
          creatorId: 'user-123',
          sortBy: 'createdAt',
        }),
      });
    });
  });

  describe('getFilterMeta', () => {
    it('should call GET /api/tickets/public/meta', async () => {
      const mockMeta = {
        availableSports: ['FOOTBALL', 'BASKETBALL', 'TENNIS'],
        minOdds: 1.1,
        maxOdds: 50.0,
        minConfidence: 1,
        maxConfidence: 10,
        minSelections: 1,
        maxSelections: 20,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockMeta });

      const result = await marketplaceApi.getFilterMeta();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/tickets/public/meta');
      expect(result.data.availableSports).toContain('FOOTBALL');
    });
  });
});

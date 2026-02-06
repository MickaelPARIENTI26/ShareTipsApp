import apiClient from '../../api/client';
import { matchApi } from '../../api/match.api';

// Mock the client
jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('matchApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /api/matches without params', async () => {
      const mockMatches = [
        { id: 'match-1', homeTeam: 'PSG', awayTeam: 'OM' },
        { id: 'match-2', homeTeam: 'Lyon', awayTeam: 'Monaco' },
      ];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getAll();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('should call GET /api/matches with sport filter', async () => {
      const mockMatches = [{ id: 'match-1', homeTeam: 'PSG', awayTeam: 'OM' }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getAll({ sport: 'FOOTBALL' });

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches', {
        params: { sport: 'FOOTBALL' },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should call GET /api/matches with league filter', async () => {
      const mockMatches = [{ id: 'match-1', homeTeam: 'Lakers', awayTeam: 'Celtics' }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getAll({ leagueId: 'nba-123' });

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches', {
        params: { leagueId: 'nba-123' },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should call GET /api/matches with days filter', async () => {
      const mockMatches = [{ id: 'match-1', homeTeam: 'PSG', awayTeam: 'OM' }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getAll({ days: 7 });

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches', {
        params: { days: 7 },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should call GET /api/matches with all filters', async () => {
      const mockMatches = [{ id: 'match-1', homeTeam: 'PSG', awayTeam: 'OM' }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getAll({
        sport: 'FOOTBALL',
        leagueId: 'ligue1-123',
        days: 3,
      });

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches', {
        params: { sport: 'FOOTBALL', leagueId: 'ligue1-123', days: 3 },
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should call GET /api/matches/:id', async () => {
      const mockMatch = {
        id: 'match-abc-123',
        homeTeam: { name: 'PSG' },
        awayTeam: { name: 'OM' },
        league: { name: 'Ligue 1' },
        startTime: '2024-01-15T20:00:00Z',
        markets: [],
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockMatch });

      const result = await matchApi.getById('match-abc-123');

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/match-abc-123');
      expect(result.data.id).toBe('match-abc-123');
      expect(result.data.homeTeam.name).toBe('PSG');
    });

    it('should handle not found errors', async () => {
      const error = { response: { status: 404, data: { error: 'Match not found' } } };
      mockedClient.get.mockRejectedValueOnce(error);

      await expect(matchApi.getById('nonexistent')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('getMatchesWithMarkets', () => {
    it('should call GET /api/matches/with-markets without params', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          homeTeam: { name: 'PSG' },
          awayTeam: { name: 'OM' },
          markets: [
            {
              type: 'h2h',
              selections: [
                { code: '1', label: 'PSG', odds: 1.5 },
                { code: 'X', label: 'Draw', odds: 4.0 },
                { code: '2', label: 'OM', odds: 6.0 },
              ],
            },
          ],
        },
      ];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getMatchesWithMarkets();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/with-markets', { params: {} });
      expect(result).toHaveLength(1);
      expect(result[0].markets).toHaveLength(1);
    });

    it('should call GET /api/matches/with-markets with sportCode', async () => {
      const mockMatches = [{ id: 'match-1', markets: [] }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getMatchesWithMarkets('FOOTBALL');

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/with-markets', {
        params: { sport: 'FOOTBALL' },
      });
      expect(result).toHaveLength(1);
    });

    it('should call GET /api/matches/with-markets with leagueId', async () => {
      const mockMatches = [{ id: 'match-1', markets: [] }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getMatchesWithMarkets(undefined, 'ligue1-123');

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/with-markets', {
        params: { leagueId: 'ligue1-123' },
      });
      expect(result).toHaveLength(1);
    });

    it('should call GET /api/matches/with-markets with days', async () => {
      const mockMatches = [{ id: 'match-1', markets: [] }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getMatchesWithMarkets(undefined, undefined, 5);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/with-markets', {
        params: { days: 5 },
      });
      expect(result).toHaveLength(1);
    });

    it('should call GET /api/matches/with-markets with all params', async () => {
      const mockMatches = [{ id: 'match-1', markets: [] }];
      mockedClient.get.mockResolvedValueOnce({ data: mockMatches });

      const result = await matchApi.getMatchesWithMarkets('BASKETBALL', 'nba-123', 7);

      expect(mockedClient.get).toHaveBeenCalledWith('/api/matches/with-markets', {
        params: { sport: 'BASKETBALL', leagueId: 'nba-123', days: 7 },
      });
      expect(result).toHaveLength(1);
    });

    it('should handle empty response', async () => {
      mockedClient.get.mockResolvedValueOnce({ data: [] });

      const result = await matchApi.getMatchesWithMarkets('FOOTBALL');

      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      const error = { response: { status: 500, data: { error: 'Internal server error' } } };
      mockedClient.get.mockRejectedValueOnce(error);

      await expect(matchApi.getMatchesWithMarkets()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });
});

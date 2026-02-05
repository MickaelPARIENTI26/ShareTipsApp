import { useProfileStore } from '../../store/profile.store';
import { userApi } from '../../api/user.api';

// Mock the API
jest.mock('../../api/user.api', () => ({
  userApi: {
    getMe: jest.fn(),
  },
}));

const mockedUserApi = userApi as jest.Mocked<typeof userApi>;

describe('profile.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useProfileStore.setState({
      stats: null,
      lastFetchedAt: null,
      loading: false,
      error: null,
    });
  });

  describe('isStale', () => {
    it('should return true if no data has been fetched', () => {
      const { isStale } = useProfileStore.getState();

      expect(isStale()).toBe(true);
    });

    it('should return true if data is older than 5 minutes', () => {
      // Set fetch time to 6 minutes ago
      useProfileStore.setState({ lastFetchedAt: Date.now() - 6 * 60 * 1000 });

      const { isStale } = useProfileStore.getState();

      expect(isStale()).toBe(true);
    });

    it('should return false if data is fresh (less than 5 minutes)', () => {
      // Set fetch time to 2 minutes ago
      useProfileStore.setState({ lastFetchedAt: Date.now() - 2 * 60 * 1000 });

      const { isStale } = useProfileStore.getState();

      expect(isStale()).toBe(false);
    });
  });

  describe('hydrate', () => {
    const mockStats = {
      ticketsCreated: 50,
      ticketsSold: 30,
      avgOdds: 2.15,
      roi: 12.5,
      followersCount: 100,
    };

    it('should load stats from API if no data', async () => {
      mockedUserApi.getMe.mockResolvedValueOnce({
        data: { stats: mockStats },
      } as any);

      const { hydrate } = useProfileStore.getState();
      await hydrate();

      const { stats, loading, error } = useProfileStore.getState();
      expect(stats).toEqual(mockStats);
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should not refetch if data is fresh', async () => {
      useProfileStore.setState({
        stats: mockStats,
        lastFetchedAt: Date.now(), // Fresh data
      });

      const { hydrate } = useProfileStore.getState();
      await hydrate();

      expect(mockedUserApi.getMe).not.toHaveBeenCalled();
    });

    it('should refetch if data is stale', async () => {
      mockedUserApi.getMe.mockResolvedValueOnce({
        data: { stats: mockStats },
      } as any);

      useProfileStore.setState({
        stats: { ...mockStats, ticketsCreated: 40 }, // Old data
        lastFetchedAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      });

      const { hydrate } = useProfileStore.getState();
      await hydrate();

      expect(mockedUserApi.getMe).toHaveBeenCalled();
      expect(useProfileStore.getState().stats?.ticketsCreated).toBe(50);
    });

    it('should not fetch if already loading', async () => {
      useProfileStore.setState({ loading: true });

      const { hydrate } = useProfileStore.getState();
      await hydrate();

      expect(mockedUserApi.getMe).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockedUserApi.getMe.mockRejectedValueOnce(new Error('Network error'));

      const { hydrate } = useProfileStore.getState();
      await hydrate();

      const { error, loading } = useProfileStore.getState();
      expect(error).toBe('Erreur de chargement');
      expect(loading).toBe(false);
    });
  });

  describe('refresh', () => {
    const mockStats = {
      ticketsCreated: 60,
      ticketsSold: 35,
      avgOdds: 2.2,
      roi: 15.0,
      followersCount: 120,
    };

    it('should force reload even with fresh data', async () => {
      mockedUserApi.getMe.mockResolvedValueOnce({
        data: { stats: mockStats },
      } as any);

      useProfileStore.setState({
        stats: { ...mockStats, ticketsCreated: 50 },
        lastFetchedAt: Date.now(), // Fresh data
      });

      const { refresh } = useProfileStore.getState();
      await refresh();

      expect(mockedUserApi.getMe).toHaveBeenCalled();
      expect(useProfileStore.getState().stats?.ticketsCreated).toBe(60);
    });

    it('should update lastFetchedAt after refresh', async () => {
      mockedUserApi.getMe.mockResolvedValueOnce({
        data: { stats: mockStats },
      } as any);

      const beforeRefresh = Date.now();

      const { refresh } = useProfileStore.getState();
      await refresh();

      const { lastFetchedAt } = useProfileStore.getState();
      expect(lastFetchedAt).toBeGreaterThanOrEqual(beforeRefresh);
    });

    it('should handle errors during refresh', async () => {
      mockedUserApi.getMe.mockRejectedValueOnce(new Error('Server error'));

      const { refresh } = useProfileStore.getState();
      await refresh();

      const { error, loading } = useProfileStore.getState();
      expect(error).toBe('Erreur de chargement');
      expect(loading).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should clear all cached data', () => {
      useProfileStore.setState({
        stats: {
          ticketsCreated: 50,
          ticketsSold: 30,
          avgOdds: 2.15,
          roi: 12.5,
          followersCount: 100,
        },
        lastFetchedAt: Date.now(),
        loading: true,
        error: 'Some error',
      });

      const { invalidate } = useProfileStore.getState();
      invalidate();

      const state = useProfileStore.getState();
      expect(state.stats).toBeNull();
      expect(state.lastFetchedAt).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

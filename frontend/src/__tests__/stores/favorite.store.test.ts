import { useFavoriteStore } from '../../store/favorite.store';
import { favoriteApi } from '../../api/favorite.api';

// Mock the favorite API
jest.mock('../../api/favorite.api', () => ({
  favoriteApi: {
    getMyFavorites: jest.fn(),
    toggleFavorite: jest.fn(),
  },
}));

describe('useFavoriteStore', () => {
  beforeEach(() => {
    // Reset the store state
    useFavoriteStore.setState({
      favoritedIds: new Set(),
      loading: false,
      hydrated: false,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useFavoriteStore.getState();

      expect(state.favoritedIds.size).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.hydrated).toBe(false);
    });
  });

  describe('hydrate', () => {
    it('should load favorites from API', async () => {
      const mockFavorites = [
        { ticketId: 'ticket-1' },
        { ticketId: 'ticket-2' },
        { ticketId: 'ticket-3' },
      ];

      (favoriteApi.getMyFavorites as jest.Mock).mockResolvedValueOnce({
        data: mockFavorites,
      });

      await useFavoriteStore.getState().hydrate();

      const state = useFavoriteStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.favoritedIds.size).toBe(3);
      expect(state.favoritedIds.has('ticket-1')).toBe(true);
      expect(state.favoritedIds.has('ticket-2')).toBe(true);
      expect(state.favoritedIds.has('ticket-3')).toBe(true);
    });

    it('should not reload if already hydrated', async () => {
      useFavoriteStore.setState({ hydrated: true });

      await useFavoriteStore.getState().hydrate();

      expect(favoriteApi.getMyFavorites).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', async () => {
      (favoriteApi.getMyFavorites as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await useFavoriteStore.getState().hydrate();

      const state = useFavoriteStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should set loading state during hydration', async () => {
      let capturedLoadingState = false;

      (favoriteApi.getMyFavorites as jest.Mock).mockImplementationOnce(async () => {
        capturedLoadingState = useFavoriteStore.getState().loading;
        return { data: [] };
      });

      await useFavoriteStore.getState().hydrate();

      expect(capturedLoadingState).toBe(true);
      expect(useFavoriteStore.getState().loading).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should add ticket to favorites (optimistic update)', async () => {
      (favoriteApi.toggleFavorite as jest.Mock).mockResolvedValueOnce({});

      await useFavoriteStore.getState().toggle('new-ticket');

      const state = useFavoriteStore.getState();
      expect(state.favoritedIds.has('new-ticket')).toBe(true);
      expect(favoriteApi.toggleFavorite).toHaveBeenCalledWith('new-ticket');
    });

    it('should remove ticket from favorites', async () => {
      useFavoriteStore.setState({
        favoritedIds: new Set(['existing-ticket']),
      });

      (favoriteApi.toggleFavorite as jest.Mock).mockResolvedValueOnce({});

      await useFavoriteStore.getState().toggle('existing-ticket');

      const state = useFavoriteStore.getState();
      expect(state.favoritedIds.has('existing-ticket')).toBe(false);
    });

    it('should revert on API error (add case)', async () => {
      (favoriteApi.toggleFavorite as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      await useFavoriteStore.getState().toggle('ticket-to-add');

      const state = useFavoriteStore.getState();
      expect(state.favoritedIds.has('ticket-to-add')).toBe(false);
    });

    it('should revert on API error (remove case)', async () => {
      useFavoriteStore.setState({
        favoritedIds: new Set(['ticket-to-remove']),
      });

      (favoriteApi.toggleFavorite as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      await useFavoriteStore.getState().toggle('ticket-to-remove');

      const state = useFavoriteStore.getState();
      expect(state.favoritedIds.has('ticket-to-remove')).toBe(true);
    });
  });

  describe('isFavorited', () => {
    it('should return true for favorited tickets', () => {
      useFavoriteStore.setState({
        favoritedIds: new Set(['fav-ticket']),
      });

      expect(useFavoriteStore.getState().isFavorited('fav-ticket')).toBe(true);
    });

    it('should return false for non-favorited tickets', () => {
      expect(useFavoriteStore.getState().isFavorited('unknown-ticket')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all favorites and reset hydration', () => {
      useFavoriteStore.setState({
        favoritedIds: new Set(['a', 'b', 'c']),
        hydrated: true,
      });

      useFavoriteStore.getState().clear();

      const state = useFavoriteStore.getState();
      expect(state.favoritedIds.size).toBe(0);
      expect(state.hydrated).toBe(false);
    });
  });
});

import { useNotificationStore } from '../../store/notification.store';
import { notificationApi } from '../../api/notification.api';

// Mock the API
jest.mock('../../api/notification.api', () => ({
  notificationApi: {
    getUnreadCount: jest.fn(),
  },
}));

const mockedNotificationApi = notificationApi as jest.Mocked<typeof notificationApi>;

describe('notification.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useNotificationStore.setState({
      unreadCount: 0,
      loading: false,
      lastFetchedAt: null,
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch and update unread count', async () => {
      mockedNotificationApi.getUnreadCount.mockResolvedValueOnce({
        data: { count: 5 },
      } as any);

      const { fetchUnreadCount } = useNotificationStore.getState();
      await fetchUnreadCount();

      const { unreadCount, loading, lastFetchedAt } = useNotificationStore.getState();
      expect(unreadCount).toBe(5);
      expect(loading).toBe(false);
      expect(lastFetchedAt).not.toBeNull();
    });

    it('should debounce requests within 5 seconds', async () => {
      mockedNotificationApi.getUnreadCount.mockResolvedValue({
        data: { count: 3 },
      } as any);

      // Set a recent fetch time
      useNotificationStore.setState({ lastFetchedAt: Date.now() });

      const { fetchUnreadCount } = useNotificationStore.getState();
      await fetchUnreadCount();

      // Should not have called API due to debounce
      expect(mockedNotificationApi.getUnreadCount).not.toHaveBeenCalled();
    });

    it('should allow fetch after debounce period', async () => {
      mockedNotificationApi.getUnreadCount.mockResolvedValueOnce({
        data: { count: 10 },
      } as any);

      // Set fetch time to more than 5 seconds ago
      useNotificationStore.setState({ lastFetchedAt: Date.now() - 6000 });

      const { fetchUnreadCount } = useNotificationStore.getState();
      await fetchUnreadCount();

      expect(mockedNotificationApi.getUnreadCount).toHaveBeenCalled();
      expect(useNotificationStore.getState().unreadCount).toBe(10);
    });

    it('should handle API errors silently', async () => {
      // Suppress console.warn for this test
      const originalWarn = console.warn;
      console.warn = jest.fn();

      mockedNotificationApi.getUnreadCount.mockRejectedValueOnce(new Error('Network error'));

      const { fetchUnreadCount } = useNotificationStore.getState();
      await fetchUnreadCount();

      const { unreadCount, loading } = useNotificationStore.getState();
      expect(unreadCount).toBe(0); // Unchanged
      expect(loading).toBe(false);

      console.warn = originalWarn;
    });
  });

  describe('decrementUnreadCount', () => {
    it('should decrement unread count by 1', () => {
      useNotificationStore.setState({ unreadCount: 5 });

      const { decrementUnreadCount } = useNotificationStore.getState();
      decrementUnreadCount();

      expect(useNotificationStore.getState().unreadCount).toBe(4);
    });

    it('should not go below 0', () => {
      useNotificationStore.setState({ unreadCount: 0 });

      const { decrementUnreadCount } = useNotificationStore.getState();
      decrementUnreadCount();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should decrement from 1 to 0', () => {
      useNotificationStore.setState({ unreadCount: 1 });

      const { decrementUnreadCount } = useNotificationStore.getState();
      decrementUnreadCount();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('resetUnreadCount', () => {
    it('should reset unread count to 0', () => {
      useNotificationStore.setState({ unreadCount: 15 });

      const { resetUnreadCount } = useNotificationStore.getState();
      resetUnreadCount();

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset all state', () => {
      useNotificationStore.setState({
        unreadCount: 10,
        loading: true,
        lastFetchedAt: Date.now(),
      });

      const { clear } = useNotificationStore.getState();
      clear();

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.lastFetchedAt).toBeNull();
    });
  });
});

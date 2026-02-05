import { useFollowStore } from '../../store/follow.store';
import { followApi } from '../../api/follow.api';

// Mock the API
jest.mock('../../api/follow.api', () => ({
  followApi: {
    getFollowing: jest.fn(),
    follow: jest.fn(),
    unfollow: jest.fn(),
  },
}));

const mockedFollowApi = followApi as jest.Mocked<typeof followApi>;

describe('follow.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useFollowStore.setState({
      followedIds: new Set(),
      loading: false,
      hydrated: false,
    });
  });

  describe('hydrate', () => {
    it('should load followed users from API', async () => {
      mockedFollowApi.getFollowing.mockResolvedValueOnce({
        data: [
          { userId: 'user-1', username: 'User One' },
          { userId: 'user-2', username: 'User Two' },
        ],
      } as any);

      const { hydrate } = useFollowStore.getState();
      await hydrate('current-user-id');

      const { followedIds, hydrated, loading } = useFollowStore.getState();
      expect(followedIds.has('user-1')).toBe(true);
      expect(followedIds.has('user-2')).toBe(true);
      expect(followedIds.size).toBe(2);
      expect(hydrated).toBe(true);
      expect(loading).toBe(false);
    });

    it('should not refetch if already hydrated', async () => {
      useFollowStore.setState({ hydrated: true });

      const { hydrate } = useFollowStore.getState();
      await hydrate('user-id');

      expect(mockedFollowApi.getFollowing).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockedFollowApi.getFollowing.mockRejectedValueOnce(new Error('Network error'));

      const { hydrate } = useFollowStore.getState();
      await hydrate('user-id');

      const { hydrated, loading } = useFollowStore.getState();
      expect(hydrated).toBe(true);
      expect(loading).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should optimistically add user to followedIds when following', async () => {
      mockedFollowApi.follow.mockResolvedValueOnce({ data: { success: true } } as any);

      const { toggle } = useFollowStore.getState();

      // Start toggle (don't await yet)
      const togglePromise = toggle('new-user');

      // Check optimistic update
      expect(useFollowStore.getState().followedIds.has('new-user')).toBe(true);

      await togglePromise;

      expect(mockedFollowApi.follow).toHaveBeenCalledWith('new-user');
      expect(useFollowStore.getState().followedIds.has('new-user')).toBe(true);
    });

    it('should optimistically remove user from followedIds when unfollowing', async () => {
      mockedFollowApi.unfollow.mockResolvedValueOnce({ data: { success: true } } as any);
      useFollowStore.setState({ followedIds: new Set(['user-to-unfollow']) });

      const { toggle } = useFollowStore.getState();

      // Start toggle (don't await yet)
      const togglePromise = toggle('user-to-unfollow');

      // Check optimistic update
      expect(useFollowStore.getState().followedIds.has('user-to-unfollow')).toBe(false);

      await togglePromise;

      expect(mockedFollowApi.unfollow).toHaveBeenCalledWith('user-to-unfollow');
    });

    it('should revert on API error when following', async () => {
      mockedFollowApi.follow.mockRejectedValueOnce(new Error('Server error'));

      const { toggle } = useFollowStore.getState();
      await toggle('new-user');

      // Should revert back
      expect(useFollowStore.getState().followedIds.has('new-user')).toBe(false);
    });

    it('should revert on API error when unfollowing', async () => {
      mockedFollowApi.unfollow.mockRejectedValueOnce(new Error('Server error'));
      useFollowStore.setState({ followedIds: new Set(['existing-user']) });

      const { toggle } = useFollowStore.getState();
      await toggle('existing-user');

      // Should revert back
      expect(useFollowStore.getState().followedIds.has('existing-user')).toBe(true);
    });
  });

  describe('isFollowing', () => {
    it('should return true if user is followed', () => {
      useFollowStore.setState({ followedIds: new Set(['user-1', 'user-2']) });

      const { isFollowing } = useFollowStore.getState();

      expect(isFollowing('user-1')).toBe(true);
      expect(isFollowing('user-2')).toBe(true);
    });

    it('should return false if user is not followed', () => {
      useFollowStore.setState({ followedIds: new Set(['user-1']) });

      const { isFollowing } = useFollowStore.getState();

      expect(isFollowing('user-not-followed')).toBe(false);
    });
  });

  describe('setFollowing', () => {
    it('should add user to followedIds', () => {
      const { setFollowing } = useFollowStore.getState();

      setFollowing('new-user', true);

      expect(useFollowStore.getState().followedIds.has('new-user')).toBe(true);
    });

    it('should remove user from followedIds', () => {
      useFollowStore.setState({ followedIds: new Set(['existing-user']) });

      const { setFollowing } = useFollowStore.getState();
      setFollowing('existing-user', false);

      expect(useFollowStore.getState().followedIds.has('existing-user')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset to initial state', () => {
      useFollowStore.setState({
        followedIds: new Set(['user-1', 'user-2']),
        hydrated: true,
      });

      const { clear } = useFollowStore.getState();
      clear();

      const { followedIds, hydrated } = useFollowStore.getState();
      expect(followedIds.size).toBe(0);
      expect(hydrated).toBe(false);
    });
  });
});

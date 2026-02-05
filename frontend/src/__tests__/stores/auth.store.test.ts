import { useAuthStore } from '../../store/auth.store';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../../api/auth.api';

// Mock the auth API
jest.mock('../../api/auth.api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock other stores to prevent import issues
jest.mock('../../store/follow.store', () => ({
  useFollowStore: { getState: () => ({ clear: jest.fn() }) },
}));
jest.mock('../../store/favorite.store', () => ({
  useFavoriteStore: { getState: () => ({ clear: jest.fn() }) },
}));
jest.mock('../../store/ticketBuilder.store', () => ({
  useTicketBuilderStore: { getState: () => ({ clear: jest.fn() }) },
}));
jest.mock('../../store/wallet.store', () => ({
  useWalletStore: { getState: () => ({ clear: jest.fn() }) },
}));
jest.mock('../../store/notification.store', () => ({
  useNotificationStore: { getState: () => ({ clear: jest.fn() }) },
}));
jest.mock('../../store/consent.store', () => ({
  useConsentStore: { getState: () => ({ reset: jest.fn() }) },
}));
jest.mock('../../store/profile.store', () => ({
  useProfileStore: { getState: () => ({ invalidate: jest.fn() }) },
}));

// Helper to create a valid JWT token
function createMockJwt(payload: object, expiresInSeconds: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = btoa(JSON.stringify({ ...payload, exp }));
  const signature = btoa('mock-signature');
  return `${header}.${fullPayload}.${signature}`;
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      hydrated: false,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockToken = createMockJwt({
        sub: 'user-123',
        email: 'test@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'testuser',
      });

      (authApi.login as jest.Mock).mockResolvedValueOnce({
        data: {
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token',
        },
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.user?.username).toBe('testuser');
      expect(state.token).toBe(mockToken);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      // Verify SecureStore was called
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', mockToken);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_refresh_token', 'mock-refresh-token');
    });

    it('should set loading state during login', async () => {
      const mockToken = createMockJwt({
        sub: 'user-123',
        email: 'test@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'testuser',
      });

      let capturedLoadingState = false;

      (authApi.login as jest.Mock).mockImplementationOnce(async () => {
        capturedLoadingState = useAuthStore.getState().loading;
        return {
          data: {
            accessToken: mockToken,
            refreshToken: 'mock-refresh-token',
          },
        };
      });

      await useAuthStore.getState().login('test@example.com', 'password');

      expect(capturedLoadingState).toBe(true);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      (authApi.login as jest.Mock).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong-password')
      ).rejects.toBeDefined();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockToken = createMockJwt({
        sub: 'new-user-123',
        email: 'newuser@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'newuser',
      });

      (authApi.register as jest.Mock).mockResolvedValueOnce({
        data: {
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token',
        },
      });

      await useAuthStore.getState().register(
        'newuser@example.com',
        'newuser',
        'password123',
        '1990-01-01'
      );

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('newuser@example.com');
      expect(state.user?.username).toBe('newuser');
    });

    it('should handle registration error', async () => {
      const errorMessage = 'Email already registered';
      (authApi.register as jest.Mock).mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      await expect(
        useAuthStore.getState().register(
          'existing@example.com',
          'user',
          'password',
          '1990-01-01'
        )
      ).rejects.toBeDefined();

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should clear auth state on logout', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', username: 'test' },
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);

      // Verify SecureStore was cleared
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('hydrate', () => {
    it('should restore auth state from SecureStore', async () => {
      const mockToken = createMockJwt({
        sub: 'user-123',
        email: 'test@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'testuser',
      });

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(mockToken) // TOKEN_KEY
        .mockResolvedValueOnce('mock-refresh') // REFRESH_TOKEN_KEY
        .mockResolvedValueOnce(JSON.stringify(mockUser)); // USER_KEY

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should clear expired token on hydrate', async () => {
      // Create an expired token
      const expiredToken = createMockJwt({
        sub: 'user-123',
        email: 'test@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'testuser',
      }, -3600); // Expired 1 hour ago

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce('mock-refresh')
        .mockResolvedValueOnce(JSON.stringify(mockUser));

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('should handle missing tokens gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should set new tokens and update user', async () => {
      const mockToken = createMockJwt({
        sub: 'user-456',
        email: 'updated@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'updateduser',
      });

      await useAuthStore.getState().setTokens(mockToken, 'new-refresh-token');

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockToken);
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.user?.email).toBe('updated@example.com');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should throw on invalid token', async () => {
      await expect(
        useAuthStore.getState().setTokens('invalid-token', 'refresh')
      ).rejects.toThrow('Invalid token received');
    });
  });
});

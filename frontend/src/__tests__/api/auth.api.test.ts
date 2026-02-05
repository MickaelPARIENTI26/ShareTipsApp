import apiClient from '../../api/client';
import { authApi } from '../../api/auth.api';

// Mock the client
jest.mock('../../api/client', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /api/auth/login with credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: { id: 'user-1', email: 'test@example.com', username: 'testuser' },
        },
      };
      mockedClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.data.accessToken).toBe('access-token-123');
    });

    it('should propagate errors from the API', async () => {
      const error = new Error('Invalid credentials');
      mockedClient.post.mockRejectedValueOnce(error);

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call POST /api/auth/register with user data', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: '2025-02-05T00:00:00Z',
        },
      };
      mockedClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'securePass123',
        dateOfBirth: '1990-01-15',
      });

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'new@example.com',
        username: 'newuser',
        password: 'securePass123',
        dateOfBirth: '1990-01-15',
      });
      expect(result.data.accessToken).toBe('new-access-token');
    });
  });

  describe('refresh', () => {
    it('should call POST /api/auth/refresh with refresh token', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };
      mockedClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.refresh('old-refresh-token');

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result.data.accessToken).toBe('new-access-token');
    });
  });

  describe('forgotPassword', () => {
    it('should call POST /api/auth/forgot-password with email', async () => {
      const mockResponse = {
        data: { success: true, message: 'Email sent' },
      };
      mockedClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.forgotPassword('user@example.com');

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result.data.success).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should call POST /api/auth/reset-password with token and new password', async () => {
      const mockResponse = {
        data: { success: true, message: 'Password reset successful' },
      };
      mockedClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.resetPassword('reset-token-abc', 'newSecurePass123');

      expect(mockedClient.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'reset-token-abc',
        newPassword: 'newSecurePass123',
      });
      expect(result.data.success).toBe(true);
    });
  });
});

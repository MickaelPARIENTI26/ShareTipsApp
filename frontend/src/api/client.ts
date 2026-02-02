import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

// API URL from environment variable (set in .env file)
// Fallback to localhost for development if not set
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5250';

// Retry configuration for network errors
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  retryStatusCodes: [502, 503, 504], // Gateway errors
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track refresh state to avoid multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (error: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Retry logic for network/gateway errors
    const statusCode = error.response?.status;
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const isRetryableStatus = statusCode && RETRY_CONFIG.retryStatusCodes.includes(statusCode);

    if ((isNetworkError || isRetryableStatus) && originalRequest) {
      const retryCount = originalRequest._retryCount ?? 0;
      if (retryCount < RETRY_CONFIG.maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay * (retryCount + 1)));
        return apiClient(originalRequest);
      }
    }

    // Skip refresh logic for auth endpoints or if already retried
    if (
      error.response?.status !== 401 ||
      originalRequest?.url?.includes('/auth/') ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    const { refreshToken, logout, setTokens } = useAuthStore.getState();

    // No refresh token available, logout
    if (!refreshToken) {
      await logout();
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          },
          reject
        );
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call refresh endpoint directly to avoid circular dependency
      const response = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens in store
      await setTokens(accessToken, newRefreshToken);

      // Notify all queued requests
      onRefreshed(accessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed - reject all queued requests and logout
      onRefreshFailed(refreshError);
      await logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;

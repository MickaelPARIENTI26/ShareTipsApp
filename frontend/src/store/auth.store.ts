import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth.api';
import type { User } from '../types';
import { useFollowStore } from './follow.store';
import { useFavoriteStore } from './favorite.store';
import { useTicketBuilderStore } from './ticketBuilder.store';
import { useWalletStore } from './wallet.store';
import { useNotificationStore } from './notification.store';
import { useConsentStore } from './consent.store';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
}

/**
 * Decode JWT payload (without verification - server validates signature)
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const json = JSON.parse(atob(payload));
    return json as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if JWT is expired (with 30s buffer for clock skew)
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  const buffer = 30; // 30 seconds buffer
  return payload.exp < now + buffer;
}

function decodeUserFromJwt(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, dateOfBirth: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      const user = decodeUserFromJwt(data.accessToken);

      if (!user) {
        throw new Error('Invalid token received');
      }

      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      set({
        user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Impossible de se connecter';
      set({ loading: false, error: message });
      throw error;
    }
  },

  register: async (email, username, password, dateOfBirth) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.register({ email, username, password, dateOfBirth });
      const user = decodeUserFromJwt(data.accessToken);

      if (!user) {
        throw new Error('Invalid token received');
      }

      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      set({
        user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Impossible de s'inscrire";
      set({ loading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    // Clear all user-specific stores to prevent data leakage between sessions
    useFollowStore.getState().clear();
    useFavoriteStore.getState().clear();
    useTicketBuilderStore.getState().clear();
    useWalletStore.getState().clear();
    useNotificationStore.getState().clear();
    useConsentStore.getState().reset();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        // Validate token structure and expiration
        if (isTokenExpired(token)) {
          // Token expired - clear and require re-login
          // In a full implementation, you'd try to refresh here
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          set({ hydrated: true });
          return;
        }

        const user: User = JSON.parse(userJson);
        set({ user, token, refreshToken, isAuthenticated: true });
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } finally {
      set({ hydrated: true });
    }
  },

  clearError: () => set({ error: null }),

  setTokens: async (accessToken: string, newRefreshToken: string) => {
    const user = decodeUserFromJwt(accessToken);

    if (!user) {
      throw new Error('Invalid token received');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    set({
      user,
      token: accessToken,
      refreshToken: newRefreshToken,
      isAuthenticated: true,
    });
  },
}));

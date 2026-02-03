import { create } from 'zustand';
import { userApi } from '../api/user.api';
import type { UserStatsDto } from '../types';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface ProfileState {
  stats: UserStatsDto | null;
  lastFetchedAt: number | null;
  loading: boolean;
  error: string | null;

  // Hydrate: loads data only if not cached or stale
  hydrate: () => Promise<void>;

  // Refresh: forces a reload (for pull-to-refresh)
  refresh: () => Promise<void>;

  // Invalidate: clears cache (called on logout or after actions)
  invalidate: () => void;

  // Check if data is stale
  isStale: () => boolean;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  stats: null,
  lastFetchedAt: null,
  loading: false,
  error: null,

  isStale: () => {
    const { lastFetchedAt } = get();
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt > CACHE_DURATION;
  },

  hydrate: async () => {
    const { stats, isStale, loading } = get();

    // Skip if already loading
    if (loading) return;

    // Skip if we have fresh data
    if (stats && !isStale()) return;

    set({ loading: true, error: null });

    try {
      const { data } = await userApi.getMe();
      set({
        stats: data.stats,
        lastFetchedAt: Date.now(),
        loading: false,
        error: null,
      });
    } catch {
      set({
        loading: false,
        error: 'Erreur de chargement',
      });
    }
  },

  refresh: async () => {
    set({ loading: true, error: null });

    try {
      const { data } = await userApi.getMe();
      set({
        stats: data.stats,
        lastFetchedAt: Date.now(),
        loading: false,
        error: null,
      });
    } catch {
      set({
        loading: false,
        error: 'Erreur de chargement',
      });
    }
  },

  invalidate: () => {
    set({
      stats: null,
      lastFetchedAt: null,
      loading: false,
      error: null,
    });
  },
}));

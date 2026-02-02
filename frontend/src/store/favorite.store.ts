import { create } from 'zustand';
import { favoriteApi } from '../api/favorite.api';

interface FavoriteState {
  favoritedIds: Set<string>;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (ticketId: string) => Promise<void>;
  isFavorited: (ticketId: string) => boolean;
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>()((set, get) => ({
  favoritedIds: new Set(),
  loading: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true });
    try {
      const { data } = await favoriteApi.getMyFavorites();
      set({
        favoritedIds: new Set(data.map((f) => f.ticketId)),
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (ticketId: string) => {
    const { favoritedIds } = get();
    const wasFavorited = favoritedIds.has(ticketId);

    // Optimistic update
    set((state) => {
      const next = new Set(state.favoritedIds);
      if (wasFavorited) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return { favoritedIds: next };
    });

    try {
      await favoriteApi.toggleFavorite(ticketId);
    } catch {
      // Revert on error
      set((state) => {
        const next = new Set(state.favoritedIds);
        if (wasFavorited) {
          next.add(ticketId);
        } else {
          next.delete(ticketId);
        }
        return { favoritedIds: next };
      });
    }
  },

  isFavorited: (ticketId: string) => get().favoritedIds.has(ticketId),

  clear: () => set({ favoritedIds: new Set(), hydrated: false }),
}));

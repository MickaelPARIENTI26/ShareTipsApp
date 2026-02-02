import { create } from 'zustand';
import { followApi } from '../api/follow.api';

interface FollowState {
  followedIds: Set<string>;
  loading: boolean;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  toggle: (targetUserId: string) => Promise<void>;
  setFollowing: (userId: string, following: boolean) => void;
  isFollowing: (userId: string) => boolean;
  clear: () => void;
}

export const useFollowStore = create<FollowState>()((set, get) => ({
  followedIds: new Set(),
  loading: false,
  hydrated: false,

  hydrate: async (userId: string) => {
    if (get().hydrated) return;
    set({ loading: true });
    try {
      const { data } = await followApi.getFollowing(userId);
      set({
        followedIds: new Set(data.map((f) => f.userId)),
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  toggle: async (targetUserId: string) => {
    const { followedIds } = get();
    const wasFollowing = followedIds.has(targetUserId);

    // Optimistic update
    set((state) => {
      const next = new Set(state.followedIds);
      if (wasFollowing) {
        next.delete(targetUserId);
      } else {
        next.add(targetUserId);
      }
      return { followedIds: next };
    });

    try {
      if (wasFollowing) {
        await followApi.unfollow(targetUserId);
      } else {
        await followApi.follow(targetUserId);
      }
    } catch {
      // Revert on error
      set((state) => {
        const next = new Set(state.followedIds);
        if (wasFollowing) {
          next.add(targetUserId);
        } else {
          next.delete(targetUserId);
        }
        return { followedIds: next };
      });
    }
  },

  isFollowing: (userId: string) => get().followedIds.has(userId),

  // Update local state without API call (for syncing when API was called elsewhere)
  setFollowing: (userId: string, following: boolean) => {
    set((state) => {
      const next = new Set(state.followedIds);
      if (following) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return { followedIds: next };
    });
  },

  clear: () => set({ followedIds: new Set(), hydrated: false }),
}));

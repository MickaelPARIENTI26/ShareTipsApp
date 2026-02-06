import { create } from 'zustand';
import { notificationApi } from '../api/notification.api';

interface NotificationState {
  unreadCount: number;
  loading: boolean;
  lastFetchedAt: number | null;
  pushToken: string | null;
  fetchUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  setPushToken: (token: string | null) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  unreadCount: 0,
  loading: false,
  lastFetchedAt: null,
  pushToken: null,

  fetchUnreadCount: async () => {
    // Debounce: don't fetch if we fetched less than 5 seconds ago
    const now = Date.now();
    const lastFetched = get().lastFetchedAt;
    if (lastFetched && now - lastFetched < 5000) {
      return;
    }

    set({ loading: true });
    try {
      const { data } = await notificationApi.getUnreadCount();
      set({ unreadCount: data.count, lastFetchedAt: now });
    } catch (error) {
      // Silently fail - badge will just show 0
      console.warn('Failed to fetch unread count:', error);
    } finally {
      set({ loading: false });
    }
  },

  decrementUnreadCount: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },

  setPushToken: (token: string | null) => {
    set({ pushToken: token });
  },

  clear: () => {
    set({ unreadCount: 0, loading: false, lastFetchedAt: null, pushToken: null });
  },
}));

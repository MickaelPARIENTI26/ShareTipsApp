import { create } from 'zustand';
import { userApi } from '../api/user.api';
import type { WalletDto } from '../types/user.types';

interface WalletState {
  wallet: WalletDto | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setBalance: (availableCredits: number) => void;
  refresh: () => Promise<void>;
  clear: () => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  wallet: null,
  loading: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    set({ loading: true, error: null });
    try {
      const { data } = await userApi.getWallet();
      set({
        wallet: data,
        hydrated: true,
      });
    } catch {
      set({ error: 'Impossible de charger le solde', hydrated: true });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await userApi.getWallet();
      set({ wallet: data });
    } catch {
      set({ error: 'Impossible de charger le solde' });
    } finally {
      set({ loading: false });
    }
  },

  // Update balance directly (after purchase, subscription, etc.)
  setBalance: (availableCredits: number) => {
    set((state) => ({
      wallet: state.wallet
        ? { ...state.wallet, availableCredits }
        : { credits: availableCredits, lockedCredits: 0, availableCredits },
    }));
  },

  clear: () => set({ wallet: null, hydrated: false, error: null }),
}));

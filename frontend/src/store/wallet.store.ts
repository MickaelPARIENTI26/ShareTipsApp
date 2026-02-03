import { create } from 'zustand';
import { stripeApi } from '../api/stripe.api';
import type { TipsterWalletDto } from '../types';

interface WalletState {
  wallet: TipsterWalletDto | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
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
      const { data } = await stripeApi.getTipsterWallet();
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
      const { data } = await stripeApi.getTipsterWallet();
      set({ wallet: data });
    } catch {
      set({ error: 'Impossible de charger le solde' });
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ wallet: null, hydrated: false, error: null }),
}));

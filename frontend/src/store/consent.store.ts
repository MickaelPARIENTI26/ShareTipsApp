import { create } from 'zustand';
import { consentApi } from '../api/consent.api';

interface ConsentState {
  hasConsented: boolean;
  consentedAt: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  hydrate: () => Promise<void>;
  giveConsent: () => Promise<boolean>;
  reset: () => void;
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  hasConsented: false,
  consentedAt: null,
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await consentApi.getStatus();
      set({
        hasConsented: data.hasConsented,
        consentedAt: data.consentedAt,
        loading: false,
      });
    } catch {
      set({ loading: false, error: 'Failed to load consent status' });
    }
  },

  giveConsent: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await consentApi.giveConsent();
      if (data.success) {
        set({
          hasConsented: true,
          consentedAt: data.consentedAt,
          loading: false,
        });
        return true;
      } else {
        set({ loading: false, error: data.message ?? 'Failed to give consent' });
        return false;
      }
    } catch {
      set({ loading: false, error: 'Failed to give consent' });
      return false;
    }
  },

  reset: () => {
    set({ hasConsented: false, consentedAt: null, loading: false, error: null });
  },
}));

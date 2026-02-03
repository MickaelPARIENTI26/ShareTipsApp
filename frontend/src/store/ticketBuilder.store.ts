import { create } from 'zustand';
import type { TicketSelection } from '../types';

export type TicketVisibility = 'PUBLIC' | 'PRIVATE';

interface TicketBuilderState {
  selections: TicketSelection[];
  isOpen: boolean;
  isManuallyCollapsed: boolean;
  confidenceIndex: number | null;
  visibility: TicketVisibility;
  priceEur: number | null;

  addSelection: (selection: TicketSelection) => void;
  removeSelection: (matchId: string) => void;
  toggleSelection: (selection: TicketSelection) => void;
  clear: () => void;
  totalOdds: () => number;
  isSelected: (selectionId: string) => boolean;
  openTicketBuilder: () => void;
  closeTicketBuilder: () => void;
  toggleTicketBuilder: () => void;
  setConfidenceIndex: (value: number) => void;
  setVisibility: (value: TicketVisibility) => void;
  setPriceEur: (value: number | null) => void;
}

export const useTicketBuilderStore = create<TicketBuilderState>()((set, get) => ({
  selections: [],
  isOpen: false,
  isManuallyCollapsed: false,
  confidenceIndex: null,
  visibility: 'PUBLIC',
  priceEur: null,

  addSelection: (selection) =>
    set((state) => {
      const filtered = state.selections.filter(
        (s) => s.matchId !== selection.matchId
      );
      return {
        selections: [...filtered, selection],
        isOpen: state.isManuallyCollapsed ? state.isOpen : true,
      };
    }),

  removeSelection: (matchId) =>
    set((state) => {
      const next = state.selections.filter((s) => s.matchId !== matchId);
      if (next.length === 0) {
        return { selections: next, isOpen: false, isManuallyCollapsed: false };
      }
      return { selections: next };
    }),

  toggleSelection: (selection) => {
    const existing = get().selections.find(
      (s) => s.selectionId === selection.selectionId
    );
    if (existing) {
      get().removeSelection(selection.matchId);
    } else {
      get().addSelection(selection);
    }
  },

  clear: () =>
    set({
      selections: [],
      isOpen: false,
      isManuallyCollapsed: false,
      confidenceIndex: null,
      visibility: 'PUBLIC',
      priceEur: null,
    }),

  totalOdds: () => get().selections.reduce((acc, s) => acc * s.odds, 1),

  isSelected: (selectionId) =>
    get().selections.some((s) => s.selectionId === selectionId),

  openTicketBuilder: () => set({ isOpen: true, isManuallyCollapsed: false }),
  closeTicketBuilder: () => set({ isOpen: false, isManuallyCollapsed: true }),
  toggleTicketBuilder: () =>
    set((state) => {
      const nextOpen = !state.isOpen;
      return {
        isOpen: nextOpen,
        isManuallyCollapsed: !nextOpen,
      };
    }),

  setConfidenceIndex: (value) => set({ confidenceIndex: value }),
  setVisibility: (value) =>
    set({ visibility: value, priceEur: value === 'PUBLIC' ? null : null }),
  setPriceEur: (value) => set({ priceEur: value }),
}));

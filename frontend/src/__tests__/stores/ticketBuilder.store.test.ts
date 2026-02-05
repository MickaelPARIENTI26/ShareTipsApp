import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import type { TicketSelection } from '../../types';

// Helper to create a mock selection
const createSelection = (overrides: Partial<TicketSelection> = {}): TicketSelection => ({
  matchId: 'match-1',
  selectionId: 'sel-1',
  matchLabel: 'Team A vs Team B',
  selectionLabel: '1X2 - Home',
  odds: 1.85,
  sportCode: 'FOOTBALL',
  leagueName: 'Ligue 1',
  startTime: '2025-01-15T20:00:00Z',
  marketType: '1X2',
  marketLabel: 'Match Result',
  ...overrides,
});

describe('ticketBuilder.store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useTicketBuilderStore.getState().clear();
  });

  describe('addSelection', () => {
    it('should add a selection to the ticket', () => {
      const { addSelection } = useTicketBuilderStore.getState();
      const selection = createSelection();

      addSelection(selection);

      const { selections } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0]).toEqual(selection);
    });

    it('should replace selection if same matchId exists', () => {
      const { addSelection } = useTicketBuilderStore.getState();
      const selection1 = createSelection({ selectionId: 'sel-1', selectionLabel: '1X2 - Home' });
      const selection2 = createSelection({ selectionId: 'sel-2', selectionLabel: '1X2 - Away' });

      addSelection(selection1);
      addSelection(selection2);

      const { selections } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0].selectionId).toBe('sel-2');
      expect(selections[0].selectionLabel).toBe('1X2 - Away');
    });

    it('should open ticket builder when adding selection', () => {
      const { addSelection } = useTicketBuilderStore.getState();

      addSelection(createSelection());

      const { isOpen } = useTicketBuilderStore.getState();
      expect(isOpen).toBe(true);
    });

    it('should not auto-open if manually collapsed', () => {
      const { addSelection, closeTicketBuilder } = useTicketBuilderStore.getState();

      // Manually collapse
      closeTicketBuilder();

      addSelection(createSelection());

      const { isOpen } = useTicketBuilderStore.getState();
      expect(isOpen).toBe(false);
    });
  });

  describe('removeSelection', () => {
    it('should remove a selection by matchId', () => {
      const { addSelection, removeSelection } = useTicketBuilderStore.getState();
      addSelection(createSelection({ matchId: 'match-1' }));
      addSelection(createSelection({ matchId: 'match-2', selectionId: 'sel-2' }));

      removeSelection('match-1');

      const { selections } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(1);
      expect(selections[0].matchId).toBe('match-2');
    });

    it('should close and reset collapsed state when removing last selection', () => {
      const { addSelection, removeSelection } = useTicketBuilderStore.getState();
      addSelection(createSelection());

      removeSelection('match-1');

      const { selections, isOpen, isManuallyCollapsed } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(0);
      expect(isOpen).toBe(false);
      expect(isManuallyCollapsed).toBe(false);
    });
  });

  describe('toggleSelection', () => {
    it('should add selection if not present', () => {
      const { toggleSelection } = useTicketBuilderStore.getState();
      const selection = createSelection();

      toggleSelection(selection);

      const { selections } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(1);
    });

    it('should remove selection if already present', () => {
      const { addSelection, toggleSelection } = useTicketBuilderStore.getState();
      const selection = createSelection();

      addSelection(selection);
      toggleSelection(selection);

      const { selections } = useTicketBuilderStore.getState();
      expect(selections).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should reset all state to initial values', () => {
      const { addSelection, setConfidenceIndex, setVisibility, setPriceEur, clear } =
        useTicketBuilderStore.getState();

      addSelection(createSelection());
      setConfidenceIndex(8);
      setVisibility('PRIVATE');
      setPriceEur(5.0);

      clear();

      const state = useTicketBuilderStore.getState();
      expect(state.selections).toHaveLength(0);
      expect(state.isOpen).toBe(false);
      expect(state.isManuallyCollapsed).toBe(false);
      expect(state.confidenceIndex).toBeNull();
      expect(state.visibility).toBe('PUBLIC');
      expect(state.priceEur).toBeNull();
    });
  });

  describe('totalOdds', () => {
    it('should return 1 when no selections', () => {
      const { totalOdds } = useTicketBuilderStore.getState();

      expect(totalOdds()).toBe(1);
    });

    it('should return product of all odds', () => {
      const { addSelection, totalOdds } = useTicketBuilderStore.getState();

      addSelection(createSelection({ matchId: 'm1', selectionId: 's1', odds: 1.5 }));
      addSelection(createSelection({ matchId: 'm2', selectionId: 's2', odds: 2.0 }));
      addSelection(createSelection({ matchId: 'm3', selectionId: 's3', odds: 1.8 }));

      expect(totalOdds()).toBeCloseTo(5.4, 2);
    });
  });

  describe('isSelected', () => {
    it('should return true if selectionId is in selections', () => {
      const { addSelection, isSelected } = useTicketBuilderStore.getState();
      addSelection(createSelection({ selectionId: 'sel-123' }));

      expect(isSelected('sel-123')).toBe(true);
    });

    it('should return false if selectionId is not in selections', () => {
      const { isSelected } = useTicketBuilderStore.getState();

      expect(isSelected('nonexistent')).toBe(false);
    });
  });

  describe('ticket builder visibility', () => {
    it('should open ticket builder', () => {
      const { openTicketBuilder } = useTicketBuilderStore.getState();

      openTicketBuilder();

      const { isOpen, isManuallyCollapsed } = useTicketBuilderStore.getState();
      expect(isOpen).toBe(true);
      expect(isManuallyCollapsed).toBe(false);
    });

    it('should close ticket builder and mark as manually collapsed', () => {
      const { openTicketBuilder, closeTicketBuilder } = useTicketBuilderStore.getState();

      openTicketBuilder();
      closeTicketBuilder();

      const { isOpen, isManuallyCollapsed } = useTicketBuilderStore.getState();
      expect(isOpen).toBe(false);
      expect(isManuallyCollapsed).toBe(true);
    });

    it('should toggle ticket builder state', () => {
      const { toggleTicketBuilder } = useTicketBuilderStore.getState();

      expect(useTicketBuilderStore.getState().isOpen).toBe(false);

      toggleTicketBuilder();
      expect(useTicketBuilderStore.getState().isOpen).toBe(true);

      toggleTicketBuilder();
      expect(useTicketBuilderStore.getState().isOpen).toBe(false);
    });
  });

  describe('ticket settings', () => {
    it('should set confidence index', () => {
      const { setConfidenceIndex } = useTicketBuilderStore.getState();

      setConfidenceIndex(7);

      expect(useTicketBuilderStore.getState().confidenceIndex).toBe(7);
    });

    it('should set visibility', () => {
      const { setVisibility } = useTicketBuilderStore.getState();

      setVisibility('PRIVATE');

      expect(useTicketBuilderStore.getState().visibility).toBe('PRIVATE');
    });

    it('should set price in EUR', () => {
      const { setPriceEur } = useTicketBuilderStore.getState();

      setPriceEur(4.99);

      expect(useTicketBuilderStore.getState().priceEur).toBe(4.99);
    });

    it('should allow null price', () => {
      const { setPriceEur } = useTicketBuilderStore.getState();

      setPriceEur(5.0);
      setPriceEur(null);

      expect(useTicketBuilderStore.getState().priceEur).toBeNull();
    });
  });
});

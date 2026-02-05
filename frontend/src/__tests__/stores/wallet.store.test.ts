import { useWalletStore } from '../../store/wallet.store';
import { stripeApi } from '../../api/stripe.api';

// Mock the API
jest.mock('../../api/stripe.api', () => ({
  stripeApi: {
    getTipsterWallet: jest.fn(),
  },
}));

const mockedStripeApi = stripeApi as jest.Mocked<typeof stripeApi>;

describe('wallet.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useWalletStore.setState({
      wallet: null,
      loading: false,
      error: null,
      hydrated: false,
    });
  });

  describe('hydrate', () => {
    it('should load wallet data from API', async () => {
      const mockWallet = {
        availableBalance: 150.5,
        pendingPayout: 0,
        totalEarned: 500.0,
      };
      mockedStripeApi.getTipsterWallet.mockResolvedValueOnce({ data: mockWallet } as any);

      const { hydrate } = useWalletStore.getState();
      await hydrate();

      const { wallet, hydrated, loading, error } = useWalletStore.getState();
      expect(wallet).toEqual(mockWallet);
      expect(hydrated).toBe(true);
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should not refetch if already hydrated', async () => {
      useWalletStore.setState({ hydrated: true });

      const { hydrate } = useWalletStore.getState();
      await hydrate();

      expect(mockedStripeApi.getTipsterWallet).not.toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      mockedStripeApi.getTipsterWallet.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { hydrate } = useWalletStore.getState();
      const hydratePromise = hydrate();

      expect(useWalletStore.getState().loading).toBe(true);

      await hydratePromise;

      expect(useWalletStore.getState().loading).toBe(false);
    });

    it('should handle API errors and set error message', async () => {
      mockedStripeApi.getTipsterWallet.mockRejectedValueOnce(new Error('Network error'));

      const { hydrate } = useWalletStore.getState();
      await hydrate();

      const { wallet, error, hydrated, loading } = useWalletStore.getState();
      expect(wallet).toBeNull();
      expect(error).toBe('Impossible de charger le solde');
      expect(hydrated).toBe(true);
      expect(loading).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should reload wallet data even if already hydrated', async () => {
      const mockWallet = {
        availableBalance: 200.0,
        pendingPayout: 50.0,
        totalEarned: 750.0,
      };
      mockedStripeApi.getTipsterWallet.mockResolvedValueOnce({ data: mockWallet } as any);

      useWalletStore.setState({
        wallet: { availableBalance: 100, pendingPayout: 0, totalEarned: 500 },
        hydrated: true,
      });

      const { refresh } = useWalletStore.getState();
      await refresh();

      const { wallet } = useWalletStore.getState();
      expect(wallet?.availableBalance).toBe(200.0);
      expect(mockedStripeApi.getTipsterWallet).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during refresh', async () => {
      mockedStripeApi.getTipsterWallet.mockRejectedValueOnce(new Error('Server error'));

      const { refresh } = useWalletStore.getState();
      await refresh();

      const { error, loading } = useWalletStore.getState();
      expect(error).toBe('Impossible de charger le solde');
      expect(loading).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset wallet state', () => {
      useWalletStore.setState({
        wallet: { availableBalance: 100, pendingPayout: 0, totalEarned: 500 },
        hydrated: true,
        error: 'Some error',
      });

      const { clear } = useWalletStore.getState();
      clear();

      const { wallet, hydrated, error } = useWalletStore.getState();
      expect(wallet).toBeNull();
      expect(hydrated).toBe(false);
      expect(error).toBeNull();
    });
  });
});

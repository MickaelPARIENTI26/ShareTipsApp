import { useConsentStore } from '../../store/consent.store';
import { consentApi } from '../../api/consent.api';

// Mock the API
jest.mock('../../api/consent.api', () => ({
  consentApi: {
    getStatus: jest.fn(),
    giveConsent: jest.fn(),
  },
}));

const mockedConsentApi = consentApi as jest.Mocked<typeof consentApi>;

describe('consent.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    useConsentStore.setState({
      hasConsented: false,
      consentedAt: null,
      loading: false,
      error: null,
    });
  });

  describe('hydrate', () => {
    it('should load consent status from API', async () => {
      mockedConsentApi.getStatus.mockResolvedValueOnce({
        data: {
          hasConsented: true,
          consentedAt: '2025-01-15T10:30:00Z',
        },
      } as any);

      const { hydrate } = useConsentStore.getState();
      await hydrate();

      const { hasConsented, consentedAt, loading, error } = useConsentStore.getState();
      expect(hasConsented).toBe(true);
      expect(consentedAt).toBe('2025-01-15T10:30:00Z');
      expect(loading).toBe(false);
      expect(error).toBeNull();
    });

    it('should handle user without consent', async () => {
      mockedConsentApi.getStatus.mockResolvedValueOnce({
        data: {
          hasConsented: false,
          consentedAt: null,
        },
      } as any);

      const { hydrate } = useConsentStore.getState();
      await hydrate();

      const { hasConsented, consentedAt } = useConsentStore.getState();
      expect(hasConsented).toBe(false);
      expect(consentedAt).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      mockedConsentApi.getStatus.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { hydrate } = useConsentStore.getState();
      const hydratePromise = hydrate();

      expect(useConsentStore.getState().loading).toBe(true);

      await hydratePromise;

      expect(useConsentStore.getState().loading).toBe(false);
    });

    it('should handle API errors', async () => {
      mockedConsentApi.getStatus.mockRejectedValueOnce(new Error('Network error'));

      const { hydrate } = useConsentStore.getState();
      await hydrate();

      const { error, loading } = useConsentStore.getState();
      expect(error).toBe('Failed to load consent status');
      expect(loading).toBe(false);
    });
  });

  describe('giveConsent', () => {
    it('should successfully give consent', async () => {
      mockedConsentApi.giveConsent.mockResolvedValueOnce({
        data: {
          success: true,
          consentedAt: '2025-01-15T12:00:00Z',
        },
      } as any);

      const { giveConsent } = useConsentStore.getState();
      const result = await giveConsent();

      const { hasConsented, consentedAt, loading } = useConsentStore.getState();
      expect(result).toBe(true);
      expect(hasConsented).toBe(true);
      expect(consentedAt).toBe('2025-01-15T12:00:00Z');
      expect(loading).toBe(false);
    });

    it('should return false and set error when API returns failure', async () => {
      mockedConsentApi.giveConsent.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'User already consented',
        },
      } as any);

      const { giveConsent } = useConsentStore.getState();
      const result = await giveConsent();

      const { error, hasConsented } = useConsentStore.getState();
      expect(result).toBe(false);
      expect(hasConsented).toBe(false);
      expect(error).toBe('User already consented');
    });

    it('should handle API errors', async () => {
      mockedConsentApi.giveConsent.mockRejectedValueOnce(new Error('Server error'));

      const { giveConsent } = useConsentStore.getState();
      const result = await giveConsent();

      const { error, loading } = useConsentStore.getState();
      expect(result).toBe(false);
      expect(error).toBe('Failed to give consent');
      expect(loading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useConsentStore.setState({
        hasConsented: true,
        consentedAt: '2025-01-15T10:30:00Z',
        loading: true,
        error: 'Some error',
      });

      const { reset } = useConsentStore.getState();
      reset();

      const state = useConsentStore.getState();
      expect(state.hasConsented).toBe(false);
      expect(state.consentedAt).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

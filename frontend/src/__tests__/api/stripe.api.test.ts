import apiClient from '../../api/client';
import { stripeApi } from '../../api/stripe.api';

// Mock the client
jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('stripeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startOnboarding', () => {
    it('should call POST /api/stripe/connect/onboard', async () => {
      const mockResponse = {
        url: 'https://connect.stripe.com/onboarding/xxx',
        expiresAt: '2024-01-15T21:00:00Z',
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.startOnboarding();

      expect(mockedClient.post).toHaveBeenCalledWith('/api/stripe/connect/onboard');
      expect(result.data.url).toContain('stripe.com');
    });

    it('should handle errors', async () => {
      const error = { response: { status: 400, data: { error: 'User already onboarded' } } };
      mockedClient.post.mockRejectedValueOnce(error);

      await expect(stripeApi.startOnboarding()).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('getStatus', () => {
    it('should call GET /api/stripe/connect/status and return completed status', async () => {
      const mockResponse = {
        status: 'Completed',
        chargesEnabled: true,
        payoutsEnabled: true,
        requirementsMessage: null,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.getStatus();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/stripe/connect/status');
      expect(result.data.status).toBe('Completed');
      expect(result.data.chargesEnabled).toBe(true);
      expect(result.data.payoutsEnabled).toBe(true);
    });

    it('should return pending status with requirements message', async () => {
      const mockResponse = {
        status: 'Pending',
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsMessage: 'Veuillez vérifier votre identité',
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.getStatus();

      expect(result.data.status).toBe('Pending');
      expect(result.data.requirementsMessage).toBe('Veuillez vérifier votre identité');
    });

    it('should return none status for non-connected users', async () => {
      const mockResponse = {
        status: 'None',
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsMessage: null,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.getStatus();

      expect(result.data.status).toBe('None');
    });
  });

  describe('refreshLink', () => {
    it('should call POST /api/stripe/connect/refresh-link', async () => {
      const mockResponse = {
        url: 'https://connect.stripe.com/onboarding/refresh-xxx',
        expiresAt: '2024-01-15T22:00:00Z',
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.refreshLink();

      expect(mockedClient.post).toHaveBeenCalledWith('/api/stripe/connect/refresh-link');
      expect(result.data.url).toContain('stripe.com');
    });
  });

  describe('getTipsterWallet', () => {
    it('should call GET /api/stripe/wallet', async () => {
      const mockResponse = {
        availableBalance: 150.5,
        pendingPayout: 25.0,
        totalEarned: 500.0,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.getTipsterWallet();

      expect(mockedClient.get).toHaveBeenCalledWith('/api/stripe/wallet');
      expect(result.data.availableBalance).toBe(150.5);
      expect(result.data.pendingPayout).toBe(25.0);
      expect(result.data.totalEarned).toBe(500.0);
    });

    it('should handle zero balances', async () => {
      const mockResponse = {
        availableBalance: 0,
        pendingPayout: 0,
        totalEarned: 0,
      };
      mockedClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.getTipsterWallet();

      expect(result.data.availableBalance).toBe(0);
    });

    it('should handle authentication errors', async () => {
      const error = { response: { status: 401, data: { error: 'Unauthorized' } } };
      mockedClient.get.mockRejectedValueOnce(error);

      await expect(stripeApi.getTipsterWallet()).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe('requestPayout', () => {
    it('should call POST /api/stripe/payout with full amount (null)', async () => {
      const mockResponse = {
        success: true,
        message: null,
        amount: 150.5,
        payoutId: 'po_xxx123',
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.requestPayout();

      expect(mockedClient.post).toHaveBeenCalledWith('/api/stripe/payout', {
        amountCents: null,
      });
      expect(result.data.success).toBe(true);
      expect(result.data.amount).toBe(150.5);
    });

    it('should call POST /api/stripe/payout with specific amount', async () => {
      const mockResponse = {
        success: true,
        message: null,
        amount: 50.0,
        payoutId: 'po_xxx456',
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.requestPayout(5000); // 50.00 EUR in cents

      expect(mockedClient.post).toHaveBeenCalledWith('/api/stripe/payout', {
        amountCents: 5000,
      });
      expect(result.data.amount).toBe(50.0);
    });

    it('should handle insufficient balance error', async () => {
      const mockResponse = {
        success: false,
        message: 'Solde insuffisant',
        amount: null,
        payoutId: null,
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.requestPayout(100000);

      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe('Solde insuffisant');
    });

    it('should handle minimum payout error', async () => {
      const mockResponse = {
        success: false,
        message: 'Minimum de retrait: 10 EUR',
        amount: null,
        payoutId: null,
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.requestPayout(500); // 5 EUR

      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe('Minimum de retrait: 10 EUR');
    });

    it('should handle not connected error', async () => {
      const mockResponse = {
        success: false,
        message: "Configurez d'abord vos paiements Stripe",
        amount: null,
        payoutId: null,
      };
      mockedClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await stripeApi.requestPayout();

      expect(result.data.success).toBe(false);
      expect(result.data.message).toContain('Stripe');
    });
  });
});

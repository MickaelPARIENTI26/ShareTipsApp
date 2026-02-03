import apiClient from './client';
import type {
  OnboardingLinkDto,
  ConnectedAccountStatusDto,
  TipsterWalletDto,
  PayoutResultDto,
  PayoutRequest,
} from '../types';

export const stripeApi = {
  // Onboarding
  startOnboarding: () =>
    apiClient.post<OnboardingLinkDto>('/api/stripe/connect/onboard'),

  getStatus: () =>
    apiClient.get<ConnectedAccountStatusDto>('/api/stripe/connect/status'),

  refreshLink: () =>
    apiClient.post<OnboardingLinkDto>('/api/stripe/connect/refresh-link'),

  // Tipster wallet
  getTipsterWallet: () =>
    apiClient.get<TipsterWalletDto>('/api/stripe/wallet'),

  requestPayout: (amountCents?: number) =>
    apiClient.post<PayoutResultDto>('/api/stripe/payout', {
      amountCents: amountCents ?? null,
    } as PayoutRequest),
};

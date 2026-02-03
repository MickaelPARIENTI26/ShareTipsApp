import apiClient from './client';
import type {
  SubscriptionDto,
  SubscriptionResultDto,
  SubscriptionStatusDto,
  PaymentIntentResultDto,
} from '../types';

export const subscriptionApi = {
  // Stripe-based subscription initiation
  initiateSubscription: (planId: string) =>
    apiClient.post<PaymentIntentResultDto>(`/api/subscriptions/initiate/${planId}`),

  // Confirm subscription after Stripe payment
  confirmSubscription: (subscriptionId: string) =>
    apiClient.post<SubscriptionResultDto>(`/api/subscriptions/confirm/${subscriptionId}`),

  unsubscribe: (tipsterId: string) =>
    apiClient.delete(`/api/subscriptions/${tipsterId}`),

  getMySubscriptions: () =>
    apiClient.get<SubscriptionDto[]>('/api/subscriptions/my'),

  getSubscriptionStatus: (tipsterId: string) =>
    apiClient.get<SubscriptionStatusDto>(
      `/api/subscriptions/status/${tipsterId}`
    ),
};

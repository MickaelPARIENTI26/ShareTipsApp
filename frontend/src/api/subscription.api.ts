import apiClient from './client';
import type {
  SubscriptionDto,
  SubscriptionResultDto,
  SubscriptionStatusDto,
  PaymentIntentResultDto,
} from '../types';

export const subscriptionApi = {
  // Free follow (0 credits)
  subscribe: (tipsterId: string, priceCredits = 0) =>
    apiClient.post<SubscriptionResultDto>(
      `/api/subscriptions/${tipsterId}`,
      { tipsterId, priceCredits }
    ),

  // Legacy credits-based
  subscribeWithPlan: (planId: string) =>
    apiClient.post<SubscriptionResultDto>(`/api/subscriptions/plan/${planId}`),

  // Stripe-based subscription
  initiateSubscription: (planId: string) =>
    apiClient.post<PaymentIntentResultDto>(`/api/subscriptions/initiate/${planId}`),

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

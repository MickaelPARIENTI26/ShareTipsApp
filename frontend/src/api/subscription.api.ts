import apiClient from './client';
import type {
  SubscriptionDto,
  SubscriptionResultDto,
  SubscriptionStatusDto,
} from '../types';

export const subscriptionApi = {
  subscribe: (tipsterId: string, priceCredits = 0) =>
    apiClient.post<SubscriptionResultDto>(
      `/api/subscriptions/${tipsterId}`,
      { tipsterId, priceCredits }
    ),

  subscribeWithPlan: (planId: string) =>
    apiClient.post<SubscriptionResultDto>(`/api/subscriptions/plan/${planId}`),

  unsubscribe: (tipsterId: string) =>
    apiClient.delete(`/api/subscriptions/${tipsterId}`),

  getMySubscriptions: () =>
    apiClient.get<SubscriptionDto[]>('/api/subscriptions/my'),

  getSubscriptionStatus: (tipsterId: string) =>
    apiClient.get<SubscriptionStatusDto>(
      `/api/subscriptions/status/${tipsterId}`
    ),
};

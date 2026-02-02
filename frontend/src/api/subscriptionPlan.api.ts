import apiClient from './client';
import type {
  SubscriptionPlanDto,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from '../types';

export const subscriptionPlanApi = {
  getMyPlans: () =>
    apiClient.get<SubscriptionPlanDto[]>('/api/subscriptionplans/my'),

  getTipsterPlans: (tipsterId: string) =>
    apiClient.get<SubscriptionPlanDto[]>(`/api/subscriptionplans/tipster/${tipsterId}`),

  getById: (id: string) =>
    apiClient.get<SubscriptionPlanDto>(`/api/subscriptionplans/${id}`),

  create: (request: CreateSubscriptionPlanRequest) =>
    apiClient.post<SubscriptionPlanDto>('/api/subscriptionplans', request),

  update: (id: string, request: UpdateSubscriptionPlanRequest) =>
    apiClient.patch<SubscriptionPlanDto>(`/api/subscriptionplans/${id}`, request),

  delete: (id: string) =>
    apiClient.delete(`/api/subscriptionplans/${id}`),
};

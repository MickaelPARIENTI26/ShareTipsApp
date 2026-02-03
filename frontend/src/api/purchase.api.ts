import apiClient from './client';
import type {
  PurchaseDto,
  PurchaseResultDto,
  PaginatedResult,
  PaymentIntentResultDto,
} from '../types';

export const purchaseApi = {
  // Legacy credits-based purchase
  purchaseTicket: (ticketId: string) =>
    apiClient.post<PurchaseResultDto>('/api/purchases', { ticketId }),

  // Stripe-based purchase (new)
  initiatePurchase: (ticketId: string) =>
    apiClient.post<PaymentIntentResultDto>('/api/purchases/initiate', { ticketId }),

  confirmPurchase: (purchaseId: string) =>
    apiClient.post<PurchaseResultDto>(`/api/purchases/confirm/${purchaseId}`),

  getMyPurchases: () =>
    apiClient.get<PurchaseDto[]>('/api/purchases/my'),

  getMyPurchasesPaginated: (page: number = 1, pageSize: number = 15) =>
    apiClient.get<PaginatedResult<PurchaseDto>>(`/api/purchases/my?page=${page}&pageSize=${pageSize}`),

  getMySales: () =>
    apiClient.get<PurchaseDto[]>('/api/purchases/sales'),
};

import apiClient from './client';
import type { PurchaseDto, PurchaseResultDto, PaginatedResult } from '../types';

export const purchaseApi = {
  purchaseTicket: (ticketId: string) =>
    apiClient.post<PurchaseResultDto>('/api/purchases', { ticketId }),

  getMyPurchases: () =>
    apiClient.get<PurchaseDto[]>('/api/purchases/my'),

  getMyPurchasesPaginated: (page: number = 1, pageSize: number = 15) =>
    apiClient.get<PaginatedResult<PurchaseDto>>(`/api/purchases/my?page=${page}&pageSize=${pageSize}`),

  getMySales: () =>
    apiClient.get<PurchaseDto[]>('/api/purchases/sales'),
};

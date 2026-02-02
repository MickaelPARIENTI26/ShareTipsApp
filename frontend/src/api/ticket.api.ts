import apiClient from './client';
import type { PaginatedResult, TicketDto } from '../types';

export interface CreateTicketSelectionPayload {
  matchId: string;
  sport: string;
  marketType: string;
  selectionCode: string;
  odds: number;
  matchLabel?: string;
  leagueName?: string;
}

export interface CreateTicketPayload {
  title: string;
  isPublic: boolean;
  priceCredits: number;
  confidenceIndex: number;
  selections: CreateTicketSelectionPayload[];
}

export const ticketApi = {
  create: (payload: CreateTicketPayload) =>
    apiClient.post<TicketDto>('/api/tickets', payload),

  getMyTickets: () =>
    apiClient.get<TicketDto[]>('/api/tickets/my'),

  getMyTicketsPaginated: (page: number = 1, pageSize: number = 15) =>
    apiClient.get<PaginatedResult<TicketDto>>(`/api/tickets/my?page=${page}&pageSize=${pageSize}`),

  getById: (id: string) =>
    apiClient.get<TicketDto>(`/api/tickets/${id}`),
};

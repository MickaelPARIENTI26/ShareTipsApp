import apiClient from './client';
import type { PaginatedResult, TicketDto, TicketFilterMetaDto } from '../types';

export interface MarketplaceFilters {
  page?: number;
  pageSize?: number;
  sports?: string[];
  minOdds?: number;
  maxOdds?: number;
  minConfidence?: number;
  maxConfidence?: number;
  minSelections?: number;
  maxSelections?: number;
  followedOnly?: boolean;
  creatorId?: string;
  sortBy?: string;
  ticketType?: 'public' | 'private';
}

export const marketplaceApi = {
  getPublicTickets: (filters: MarketplaceFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.pageSize) params.pageSize = String(filters.pageSize);
    if (filters.sports?.length) params.sports = filters.sports.join(',');
    if (filters.minOdds) params.minOdds = String(filters.minOdds);
    if (filters.maxOdds) params.maxOdds = String(filters.maxOdds);
    if (filters.minConfidence)
      params.minConfidence = String(filters.minConfidence);
    if (filters.maxConfidence)
      params.maxConfidence = String(filters.maxConfidence);
    if (filters.minSelections)
      params.minSelections = String(filters.minSelections);
    if (filters.maxSelections)
      params.maxSelections = String(filters.maxSelections);
    if (filters.followedOnly) params.followedOnly = 'true';
    if (filters.creatorId) params.creatorId = filters.creatorId;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.ticketType) params.ticketType = filters.ticketType;

    return apiClient.get<PaginatedResult<TicketDto>>('/api/tickets/public', {
      params,
    });
  },

  getFilterMeta: () =>
    apiClient.get<TicketFilterMetaDto>('/api/tickets/public/meta'),
};

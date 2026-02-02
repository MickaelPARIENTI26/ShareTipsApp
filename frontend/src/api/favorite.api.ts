import apiClient from './client';
import type { FavoriteTicketDto, FavoriteResultDto, PaginatedResult } from '../types';

export const favoriteApi = {
  toggleFavorite: (ticketId: string) =>
    apiClient.post<FavoriteResultDto>('/api/favorites/toggle', { ticketId }),

  getMyFavorites: () =>
    apiClient.get<FavoriteTicketDto[]>('/api/favorites/my'),

  getMyFavoritesPaginated: (page: number = 1, pageSize: number = 15) =>
    apiClient.get<PaginatedResult<FavoriteTicketDto>>(`/api/favorites/my?page=${page}&pageSize=${pageSize}`),

  checkFavorite: (ticketId: string) =>
    apiClient.get<{ isFavorited: boolean }>(
      `/api/favorites/check/${ticketId}`
    ),
};

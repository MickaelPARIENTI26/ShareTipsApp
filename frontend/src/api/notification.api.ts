import apiClient from './client';
import type { NotificationDto, PaginatedResult } from '../types';

export interface UnreadCountDto {
  count: number;
}

export const notificationApi = {
  getMyNotifications: (page = 1, pageSize = 20) =>
    apiClient.get<PaginatedResult<NotificationDto>>('/api/notifications', {
      params: { page, pageSize },
    }),

  getUnreadCount: () =>
    apiClient.get<UnreadCountDto>('/api/notifications/unread-count'),

  markOneAsRead: (id: string) =>
    apiClient.post(`/api/notifications/read/${id}`),

  markAllAsRead: () =>
    apiClient.post('/api/notifications/read-all'),

  markAsRead: (notificationIds: string[]) =>
    apiClient.post('/api/notifications/mark-read', { notificationIds }),

  delete: (id: string) =>
    apiClient.delete(`/api/notifications/${id}`),
};

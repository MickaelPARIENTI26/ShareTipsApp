import apiClient from './client';

export interface NotificationPreferencesDto {
  newTicket: boolean;
  matchStart: boolean;
  ticketResult: boolean;
  subscriptionExpire: boolean;
}

export interface UpdateNotificationPreferencesDto {
  newTicket: boolean;
  matchStart: boolean;
  ticketResult: boolean;
  subscriptionExpire: boolean;
}

export const notificationPreferencesApi = {
  getMyPreferences: () =>
    apiClient.get<NotificationPreferencesDto>('/api/notification-preferences'),

  updateMyPreferences: (dto: UpdateNotificationPreferencesDto) =>
    apiClient.put<NotificationPreferencesDto>('/api/notification-preferences', dto),
};

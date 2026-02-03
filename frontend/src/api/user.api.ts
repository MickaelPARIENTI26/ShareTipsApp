import apiClient from './client';
import type { WalletTransactionDto } from '../types/user.types';
import type { CurrentUserDto, UserProfileDto, TipsterStatsDto, TipsterWalletDto } from '../types';

export const userApi = {
  getMe: () => apiClient.get<CurrentUserDto>('/api/users/me'),

  getWallet: () => apiClient.get<TipsterWalletDto>('/api/wallet'),

  getTransactions: () =>
    apiClient.get<WalletTransactionDto[]>('/api/wallet/transactions'),

  getUserProfile: (userId: string) =>
    apiClient.get<UserProfileDto>(`/api/users/${userId}/profile`),

  getTipsterStats: (userId: string) =>
    apiClient.get<TipsterStatsDto>(`/api/users/${userId}/stats`),
};

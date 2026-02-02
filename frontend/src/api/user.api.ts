import apiClient from './client';
import type {
  WalletDto,
  WalletTransactionDto,
  DepositResponse,
} from '../types/user.types';
import type { CurrentUserDto, UserProfileDto, TipsterStatsDto } from '../types';

export const userApi = {
  getMe: () => apiClient.get<CurrentUserDto>('/api/users/me'),

  getWallet: () => apiClient.get<WalletDto>('/api/wallet'),

  getTransactions: () =>
    apiClient.get<WalletTransactionDto[]>('/api/wallet/transactions'),

  deposit: (amountEur: number) =>
    apiClient.post<DepositResponse>('/api/wallet/deposit', { amountEur }),

  getUserProfile: (userId: string) =>
    apiClient.get<UserProfileDto>(`/api/users/${userId}/profile`),

  getTipsterStats: (userId: string) =>
    apiClient.get<TipsterStatsDto>(`/api/users/${userId}/stats`),
};

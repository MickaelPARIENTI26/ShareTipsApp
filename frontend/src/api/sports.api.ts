import apiClient from './client';
import type { SportDto } from '../types/sport.types';

export const sportsApi = {
  getAll: () => apiClient.get<SportDto[]>('/api/sports'),
};

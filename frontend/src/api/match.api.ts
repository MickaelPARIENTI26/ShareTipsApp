import apiClient from './client';
import type { MatchListItem, MatchDetail } from '../types';

export const matchApi = {
  getAll: (params?: { sport?: string; leagueId?: string; days?: number }) =>
    apiClient.get<MatchListItem[]>('/api/matches', { params }),

  getById: (id: string) =>
    apiClient.get<MatchDetail>(`/api/matches/${id}`),

  /** Fetch matches with full market details in a single optimized call */
  async getMatchesWithMarkets(
    sportCode?: string,
    leagueId?: string,
    days?: number
  ): Promise<MatchDetail[]> {
    const params: Record<string, string | number> = {};
    if (sportCode) params.sport = sportCode;
    if (leagueId) params.leagueId = leagueId;
    if (days) params.days = days;

    const { data } = await apiClient.get<MatchDetail[]>('/api/matches/with-markets', { params });
    return data;
  },
};

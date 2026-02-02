import apiClient from './client';
import type { MatchListItem, MatchDetail } from '../types';

export const matchApi = {
  getAll: (params?: { sport?: string; leagueId?: string; days?: number }) =>
    apiClient.get<MatchListItem[]>('/api/matches', { params }),

  getById: (id: string) =>
    apiClient.get<MatchDetail>(`/api/matches/${id}`),

  /** Fetch match list (optionally by sport), then load full details with markets in parallel. */
  async getMatchesWithMarkets(sportCode?: string): Promise<MatchDetail[]> {
    const params = sportCode ? { sport: sportCode } : undefined;
    const { data: list } = await matchApi.getAll(params);
    const details = await Promise.all(
      list.map((m) => matchApi.getById(m.id).then((r) => r.data))
    );
    return details;
  },
};

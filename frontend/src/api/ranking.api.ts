import apiClient from './client';

export interface RankingEntryDto {
  rank: number;
  userId: string;
  username: string;
  roi: number;
  winRate: number;
  avgOdds: number;
  totalTickets: number;
  winCount: number;
  loseCount: number;
}

export interface RankingResponseDto {
  period: string;
  periodStart: string;
  periodEnd: string;
  rankings: RankingEntryDto[];
}

export type RankingPeriod = 'daily' | 'weekly' | 'monthly';

export const rankingApi = {
  getRanking: (period: RankingPeriod = 'weekly', limit: number = 100) =>
    apiClient.get<RankingResponseDto>('/api/ranking', {
      params: { period, limit: String(limit) },
    }),
};

import apiClient from './client';
import type {
  UserGamificationDto,
  BadgeDto,
  UserBadgeDto,
  XpGainResultDto,
  LeaderboardEntryDto,
} from '../types/gamification.types';

export const gamificationApi = {
  /** Get my gamification profile */
  getMyGamification: () =>
    apiClient.get<UserGamificationDto>('/api/gamification/me'),

  /** Get gamification profile for a user */
  getUserGamification: (userId: string) =>
    apiClient.get<UserGamificationDto>(`/api/gamification/user/${userId}`),

  /** Record daily login and get XP */
  recordDailyLogin: () =>
    apiClient.post<XpGainResultDto>('/api/gamification/daily-login'),

  /** Get my earned badges */
  getMyBadges: () =>
    apiClient.get<UserBadgeDto[]>('/api/gamification/my-badges'),

  /** Get badges for a user */
  getUserBadges: (userId: string) =>
    apiClient.get<UserBadgeDto[]>(`/api/gamification/user/${userId}/badges`),

  /** Get all available badges */
  getAllBadges: () =>
    apiClient.get<BadgeDto[]>('/api/gamification/badges'),

  /** Get XP leaderboard */
  getLeaderboard: (limit: number = 20) =>
    apiClient.get<LeaderboardEntryDto[]>(`/api/gamification/leaderboard?limit=${limit}`),

  /** Check and award any pending badges */
  checkBadges: () =>
    apiClient.post<BadgeDto[]>('/api/gamification/check-badges'),
};

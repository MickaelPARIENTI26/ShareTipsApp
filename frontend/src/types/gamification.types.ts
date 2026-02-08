export interface UserGamificationDto {
  level: number;
  levelName: string;
  currentXp: number;
  totalXpEarned: number;
  xpForNextLevel: number;
  progressPercent: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
  currentWinStreak: number;
  longestWinStreak: number;
  badgeCount: number;
}

export interface BadgeDto {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
}

export interface UserBadgeDto {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

export interface XpGainResultDto {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newLevel?: number;
  newLevelName?: string;
  newBadges?: BadgeDto[];
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  username: string;
  level: number;
  levelName: string;
  totalXp: number;
  badgeCount: number;
}

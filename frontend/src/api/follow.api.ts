import apiClient from './client';

export interface FollowResultDto {
  isFollowing: boolean;
  message: string;
}

export interface FollowInfoDto {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowerDto {
  userId: string;
  username: string;
  followedAt: string;
}

export const followApi = {
  follow: (userId: string) =>
    apiClient.post<FollowResultDto>(`/api/users/${userId}/follow`),

  unfollow: (userId: string) =>
    apiClient.post<FollowResultDto>(`/api/users/${userId}/unfollow`),

  getFollowInfo: (userId: string) =>
    apiClient.get<FollowInfoDto>(`/api/users/${userId}/follow-info`),

  getFollowers: (userId: string) =>
    apiClient.get<FollowerDto[]>(`/api/users/${userId}/followers`),

  getFollowing: (userId: string) =>
    apiClient.get<FollowerDto[]>(`/api/users/${userId}/following`),
};

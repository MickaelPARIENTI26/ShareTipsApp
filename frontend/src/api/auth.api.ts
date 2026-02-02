import apiClient from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordResponse,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<ForgotPasswordResponse>('/api/auth/reset-password', { token, newPassword }),
};

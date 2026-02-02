import apiClient from './client';

export interface ConsentStatusDto {
  hasConsented: boolean;
  consentedAt: string | null;
}

export interface GiveConsentResponse {
  success: boolean;
  message: string | null;
  consentedAt: string | null;
}

export const consentApi = {
  /**
   * Get consent status for the current user
   */
  getStatus: () => apiClient.get<ConsentStatusDto>('/api/consent/status'),

  /**
   * Give consent (user accepts the disclaimer)
   */
  giveConsent: () => apiClient.post<GiveConsentResponse>('/api/consent'),
};

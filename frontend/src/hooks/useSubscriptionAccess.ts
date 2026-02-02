import { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '../api/subscription.api';
import type { SubscriptionStatusDto } from '../types';

export interface SubscriptionAccessState {
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  status: SubscriptionStatusDto | null;
  remainingDays: number;
  wasSubscribed: boolean;
  refresh: () => Promise<void>;
}

/**
 * Centralized hook for checking subscription access to a tipster.
 * This hook can be reused across the app and will be extended for Stripe integration.
 *
 * @param tipsterId - The tipster's UUID to check subscription for
 * @param enabled - Whether to fetch the subscription status (default: true)
 * @returns SubscriptionAccessState with subscription info and loading/error states
 */
export function useSubscriptionAccess(
  tipsterId: string | undefined,
  enabled = true
): SubscriptionAccessState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatusDto | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!tipsterId || !enabled) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await subscriptionApi.getSubscriptionStatus(tipsterId);
      setStatus(response.data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la vérification de l\'abonnement';
      setError(errorMessage);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [tipsterId, enabled]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isSubscribed: status?.isSubscribed ?? false,
    isLoading,
    error,
    status,
    remainingDays: status?.remainingDays ?? 0,
    wasSubscribed: status?.wasSubscribed ?? false,
    refresh: fetchStatus,
  };
}

export default useSubscriptionAccess;

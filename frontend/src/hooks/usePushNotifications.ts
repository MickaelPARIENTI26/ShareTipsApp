import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  registerForPushNotificationsAsync,
  registerDeviceTokenWithBackend,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  clearBadgeCount,
} from '../services/pushNotifications';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import type { RootStackParamList } from '../types';

/**
 * Hook to manage push notifications
 * - Requests permission and registers token on mount (if authenticated)
 * - Handles notification navigation
 * - Clears badge when app opens
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  const isAuthenticated = useAuthStore((s) => !!s.token);
  const setPushToken = useNotificationStore((s) => s.setPushToken);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Handle notification tap navigation
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data?.type) {
        switch (data.type) {
          case 'TicketWon':
          case 'TicketLost':
            if (data.data) {
              try {
                const parsed = JSON.parse(data.data as string);
                if (parsed.ticketId) {
                  navigation.navigate('TicketDetail', { ticketId: parsed.ticketId });
                }
              } catch {
                navigation.navigate('Notifications');
              }
            }
            break;
          case 'FollowNewTicket':
          case 'NewTicket':
            if (data.data) {
              try {
                const parsed = JSON.parse(data.data as string);
                if (parsed.ticketId) {
                  navigation.navigate('TicketDetail', { ticketId: parsed.ticketId });
                } else if (parsed.tipsterId) {
                  navigation.navigate('TipsterProfile', {
                    tipsterId: parsed.tipsterId,
                    tipsterUsername: parsed.tipsterUsername || 'Pronostiqueur'
                  });
                }
              } catch {
                navigation.navigate('Notifications');
              }
            }
            break;
          case 'MatchStart':
            if (data.data) {
              try {
                const parsed = JSON.parse(data.data as string);
                if (parsed.matchId) {
                  navigation.navigate('MatchDetails', { matchId: parsed.matchId });
                } else if (parsed.ticketId) {
                  navigation.navigate('TicketDetail', { ticketId: parsed.ticketId });
                }
              } catch {
                navigation.navigate('Notifications');
              }
            }
            break;
          case 'SubscriptionExpire':
            navigation.navigate('MesAbonnements');
            break;
          default:
            navigation.navigate('Notifications');
        }
      } else {
        navigation.navigate('Notifications');
      }
    },
    [navigation]
  );

  // Register for push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const setupPushNotifications = async () => {
      // Get push token
      const token = await registerForPushNotificationsAsync();

      if (!isMounted || !token) return;

      setExpoPushToken(token);
      setPushToken(token); // Store in notification store for logout

      // Register with backend
      await registerDeviceTokenWithBackend(token);

      // Check if app was opened via notification
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        handleNotificationResponse(lastResponse);
      }

      // Clear badge
      await clearBadgeCount();
    };

    setupPushNotifications();

    // Listen for incoming notifications
    notificationListener.current = addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener(handleNotificationResponse);

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, handleNotificationResponse, setPushToken]);

  return {
    expoPushToken,
    notification,
  };
}

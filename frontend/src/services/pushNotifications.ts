import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../api/client';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  token: string | null;
  notification: Notifications.Notification | null;
}

/**
 * Request permission and get the Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    // projectId is required for push tokens - skip silently if not configured
    if (!projectId) {
      console.log('Push notifications: No projectId configured (expected in Expo Go)');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
    }

    return tokenData.data;
  } catch (error) {
    // Silently handle - push notifications are optional
    console.log('Push notifications unavailable:', (error as Error).message);
    return null;
  }
}

/**
 * Register the device token with the backend
 */
export async function registerDeviceTokenWithBackend(token: string): Promise<boolean> {
  try {
    const deviceId = Device.modelId || Device.deviceName || 'unknown';
    const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';

    await apiClient.post('/api/devicetokens/register', {
      token,
      platform: Platform.OS,
      deviceId,
      deviceName,
    });

    console.log('Device token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register device token with backend:', error);
    return false;
  }
}

/**
 * Unregister the device token from the backend (e.g., on logout)
 */
export async function unregisterDeviceToken(token: string): Promise<void> {
  try {
    await apiClient.post('/api/devicetokens/unregister', { token });
    console.log('Device token unregistered');
  } catch (error) {
    console.error('Failed to unregister device token:', error);
  }
}

/**
 * Add a listener for incoming notifications
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (when user taps on notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (if app was opened via notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

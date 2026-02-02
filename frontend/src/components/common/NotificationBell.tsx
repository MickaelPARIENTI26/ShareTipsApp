import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useNotificationStore } from '../../store/notification.store';
import type { RootStackParamList } from '../../types';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  color,
}) => {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Fetch on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  const handlePress = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const iconColor = color ?? colors.text;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={size} color={iconColor} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NotificationBell;

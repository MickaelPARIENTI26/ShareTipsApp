import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { notificationApi } from '../api/notification.api';
import { useNotificationStore } from '../store/notification.store';
import type { NotificationDto, NotificationData, RootStackParamList } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette } from '../theme';

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  NewTicket: 'receipt-outline',
  MatchStart: 'football-outline',
  TicketWon: 'trophy-outline',
  TicketLost: 'close-circle-outline',
  SubscriptionExpire: 'time-outline',
  FollowNewTicket: 'person-add-outline',
};

const NOTIFICATION_COLORS: Record<string, (colors: ThemeColors) => string> = {
  NewTicket: (colors) => colors.primary,
  MatchStart: (colors) => colors.warning,
  TicketWon: (colors) => colors.success,
  TicketLost: (colors) => colors.danger,
  SubscriptionExpire: (colors) => colors.warning,
  FollowNewTicket: (colors) => colors.primary,
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function parseDataJson(dataJson: string | null): NotificationData | null {
  if (!dataJson) return null;
  try {
    return JSON.parse(dataJson);
  } catch {
    return null;
  }
}

interface NotificationItemProps {
  item: NotificationDto;
  onPress: (item: NotificationDto) => void;
  onDelete: (id: string) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}

// Memoized for FlatList performance
const NotificationItem = React.memo<NotificationItemProps>(function NotificationItem({
  item,
  onPress,
  onDelete,
  colors,
  styles,
}) {
  const iconName = NOTIFICATION_ICONS[item.type] ?? 'notifications-outline';
  const iconColor = NOTIFICATION_COLORS[item.type]?.(colors) ?? colors.primary;

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.notificationItemUnread]}
      onPress={() => onPress(item)}
      onLongPress={handleDelete}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const NotificationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { decrementUnreadCount, resetUnreadCount, fetchUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await notificationApi.getMyNotifications(pageNum, 20);
      if (append) {
        setNotifications((prev) => [...prev, ...data.items]);
      } else {
        setNotifications(data.items);
      }
      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, false);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  }, [hasMore, loading, page, fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnreadCount();
    } catch {
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    }
  }, [resetUnreadCount]);

  const handleNotificationPress = useCallback(
    async (notification: NotificationDto) => {
      // Mark as read
      if (!notification.isRead) {
        try {
          await notificationApi.markOneAsRead(notification.id);
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
          );
          decrementUnreadCount();
        } catch {
          // silent
        }
      }

      // Navigate based on type
      const data = parseDataJson(notification.dataJson);
      if (!data) return;

      switch (notification.type) {
        case 'NewTicket':
        case 'TicketWon':
        case 'TicketLost':
        case 'FollowNewTicket':
        case 'MatchStart':
          if (data.ticketId) {
            navigation.navigate('TicketDetail', { ticketId: data.ticketId });
          }
          break;
        case 'SubscriptionExpire':
          if (data.tipsterId) {
            navigation.navigate('TipsterProfile', {
              tipsterId: data.tipsterId,
              tipsterUsername: '',
            });
          }
          break;
      }
    },
    [navigation, decrementUnreadCount]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        decrementUnreadCount();
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer la notification');
    }
  }, [notifications, decrementUnreadCount]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const goToPreferences = useCallback(() => {
    navigation.navigate('NotificationPreferences');
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header actions */}
      <View style={styles.headerActions}>
        {notifications.length > 0 && unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity style={styles.settingsBtn} onPress={goToPreferences}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onPress={handleNotificationPress}
            onDelete={handleDelete}
            colors={colors}
            styles={styles}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyHint}>
              Vous recevrez des notifications sur vos tickets et abonnements
            </Text>
          </View>
        }
      />
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // Loading state
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          gap: spacing.md,
        },
        loadingText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        headerActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
        markAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        markAllText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.primary,
        },
        settingsBtn: {
          padding: spacing.xxs,
        },
        list: {
          padding: spacing.sm,
          paddingBottom: spacing.lg,
        },
        notificationItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        notificationItemUnread: {
          backgroundColor: colors.primaryBg,
          borderColor: colors.primary + '30',
        },
        iconContainer: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        },
        notificationContent: {
          flex: 1,
        },
        notificationTitle: {
          ...typography.bodyLarge,
          fontWeight: '600',
          color: colors.text,
          marginBottom: spacing.xxs,
        },
        notificationTitleUnread: {
          fontWeight: '700',
        },
        notificationMessage: {
          ...typography.body,
          color: colors.textSecondary,
          lineHeight: 18,
          marginBottom: spacing.xs,
        },
        notificationDate: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        unreadDot: {
          width: 10,
          height: 10,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          marginLeft: spacing.xs,
          marginTop: spacing.xxs,
        },
        // Empty state
        emptyContainer: {
          alignItems: 'center',
          paddingTop: spacing.xxl,
          paddingHorizontal: spacing.lg,
        },
        emptyIconWrapper: {
          width: 80,
          height: 80,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        emptyHint: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors]
  );

export default NotificationsScreen;

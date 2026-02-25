import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { notificationApi } from '../api/notification.api';
import { useNotificationStore } from '../store/notification.store';
import type { NotificationDto, NotificationData, RootStackParamList } from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  NewTicket: 'receipt-outline',
  MatchStart: 'football-outline',
  TicketWon: 'trophy-outline',
  TicketLost: 'close-circle-outline',
  SubscriptionExpire: 'time-outline',
  FollowNewTicket: 'person-add-outline',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  NewTicket: DS.colors.green,
  MatchStart: '#FBBF24',
  TicketWon: DS.colors.greenLight,
  TicketLost: '#EF4444',
  SubscriptionExpire: '#FBBF24',
  FollowNewTicket: DS.colors.green,
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface NotificationItemProps {
  item: NotificationDto;
  onPress: (item: NotificationDto) => void;
  onDelete: (id: string) => void;
  index: number;
}

const NotificationItem = React.memo<NotificationItemProps>(function NotificationItem({
  item,
  onPress,
  onDelete,
  index,
}) {
  const iconName = NOTIFICATION_ICONS[item.type] ?? 'notifications-outline';
  const iconColor = NOTIFICATION_COLORS[item.type] ?? DS.colors.green;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

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
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.notificationItemUnread]}
        onPress={() => onPress(item)}
        onLongPress={handleDelete}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
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
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const NotificationsScreen: React.FC = () => {
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
        <ActivityIndicator size="large" color={DS.colors.green} />
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
            <Ionicons name="checkmark-done" size={18} color={DS.colors.green} />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity style={styles.settingsBtn} onPress={goToPreferences}>
          <Ionicons name="settings-outline" size={22} color={DS.colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DS.colors.green}
            colors={[DS.colors.green]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <NotificationItem
            item={item}
            onPress={handleNotificationPress}
            onDelete={handleDelete}
            index={index}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="notifications-off-outline" size={40} color={DS.colors.green} />
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

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: DS.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
    backgroundColor: DS.colors.cardBg,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.green,
  },
  settingsBtn: {
    padding: 4,
  },
  list: {
    padding: 12,
    paddingBottom: 120,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    backgroundColor: DS.colors.greenBgSubtle,
    borderColor: 'rgba(45, 140, 78, 0.3)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 13,
    color: DS.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: DS.colors.textSecondary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DS.colors.green,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
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
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default NotificationsScreen;

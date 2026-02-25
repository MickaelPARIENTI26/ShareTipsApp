import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { purchaseApi } from '../api/purchase.api';
import { subscriptionApi } from '../api/subscription.api';
import type { RootStackParamList, PurchaseDto, SubscriptionDto } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette } from '../theme';

type TabType = 'achats' | 'abonnements';

// Unified item for display
interface HistoryItem {
  id: string;
  type: 'purchase' | 'subscription';
  title: string;
  subtitle: string;
  date: string;
  status: string;
  targetId: string; // ticketId or tipsterId
  targetUsername: string;
  priceEur: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const endDate = new Date(end).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startDate} → ${endDate}`;
}

function getSubscriptionStatusLabel(status: string, endDate: string): string {
  if (status === 'Active') {
    const remaining = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (remaining > 0) {
      return `Actif (${remaining}j restants)`;
    }
    return 'Actif';
  }
  if (status === 'Expired') return 'Expiré';
  if (status === 'Cancelled') return 'Annulé';
  return status;
}

const HistoryCard: React.FC<{
  item: HistoryItem;
  onPress: () => void;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({ item, onPress, styles, colors }) => {
  const isPurchase = item.type === 'purchase';
  const isActive = item.status === 'Active' || item.status === 'Actif';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isPurchase ? colors.primary + '18' : colors.success + '18' },
          ]}
        >
          <Ionicons
            name={isPurchase ? 'document-text' : 'people'}
            size={20}
            color={isPurchase ? colors.primary : colors.success}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Text style={styles.dateText}>{item.date}</Text>
          {!isPurchase && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.success + '18' : colors.textTertiary + '18' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? colors.success : colors.textTertiary },
                ]}
              >
                {item.status}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.priceText}>{item.priceEur.toFixed(2)} €</Text>
      </View>
    </TouchableOpacity>
  );
};

const HistoriqueScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<TabType>('achats');
  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Smooth tab transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === activeTab) return;

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: tab === 'achats' ? 10 : -10,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tab);
      slideAnim.setValue(tab === 'achats' ? -10 : 10);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab, fadeAnim, slideAnim]);

  const fetchData = useCallback(async () => {
    try {
      const [purchasesRes, subscriptionsRes] = await Promise.all([
        purchaseApi.getMyPurchases(),
        subscriptionApi.getMySubscriptions(),
      ]);
      setPurchases(Array.isArray(purchasesRes.data) ? purchasesRes.data : []);
      setSubscriptions(Array.isArray(subscriptionsRes.data) ? subscriptionsRes.data : []);
    } catch {
      // Silent error handling - ensure arrays are set
      setPurchases([]);
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Transform data to unified format
  const purchaseItems: HistoryItem[] = useMemo(
    () =>
      (purchases || []).map((p) => ({
        id: p.id,
        type: 'purchase' as const,
        title: p.ticketTitle,
        subtitle: `Accès au ticket de @${p.sellerUsername}`,
        date: formatDate(p.createdAt),
        status: 'Accessible',
        targetId: p.ticketId,
        targetUsername: p.sellerUsername,
        priceEur: p.priceEur,
      })),
    [purchases]
  );

  const subscriptionItems: HistoryItem[] = useMemo(
    () =>
      (subscriptions || []).map((s) => ({
        id: s.id,
        type: 'subscription' as const,
        title: `Accès premium @${s.tipsterUsername}`,
        subtitle: formatDateRange(s.startDate, s.endDate),
        date: formatDate(s.createdAt),
        status: getSubscriptionStatusLabel(s.status, s.endDate),
        targetId: s.tipsterId,
        targetUsername: s.tipsterUsername,
        priceEur: s.priceEur,
      })),
    [subscriptions]
  );

  const displayItems = activeTab === 'achats' ? purchaseItems : subscriptionItems;

  const handleItemPress = useCallback(
    (item: HistoryItem) => {
      if (item.type === 'purchase') {
        navigation.navigate('TicketDetail', { ticketId: item.targetId });
      } else {
        navigation.navigate('TipsterProfile', {
          tipsterId: item.targetId,
          tipsterUsername: item.targetUsername,
        });
      }
    },
    [navigation]
  );

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
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achats' && styles.tabActive]}
          onPress={() => handleTabChange('achats')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === 'achats' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'achats' && styles.tabTextActive,
            ]}
          >
            Tickets achetés
          </Text>
          {(purchases?.length ?? 0) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{purchases.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'abonnements' && styles.tabActive]}
          onPress={() => handleTabChange('abonnements')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'abonnements' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'abonnements' && styles.tabTextActive,
            ]}
          >
            Souscriptions
          </Text>
          {(subscriptions?.length ?? 0) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{subscriptions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Animated content wrapper */}
      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            {activeTab === 'achats'
              ? 'Retrouvez ici les tickets auxquels vous avez accès.'
              : 'Retrouvez ici vos abonnements aux pronostiqueurs.'}
          </Text>
        </View>

        {/* List */}
        <FlatList
        data={displayItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onPress={() => handleItemPress(item)}
            styles={styles}
            colors={colors}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons
                name={activeTab === 'achats' ? 'document-outline' : 'people-outline'}
                size={40}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'achats' ? 'Aucun achat' : 'Aucune souscription'}
            </Text>
            <Text style={styles.emptyHint}>
              {activeTab === 'achats'
                ? 'Achetez des tickets pour y accéder ici.'
                : 'Souscrivez à des pronostiqueurs pour accéder à leurs contenus premium.'}
            </Text>
          </View>
        }
      />
      </Animated.View>
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

        // Animated content wrapper
        animatedContent: {
          flex: 1,
        },

        // Tabs
        tabs: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          marginHorizontal: spacing.md,
          marginTop: spacing.md,
          borderRadius: radius.lg,
          padding: spacing.xxs,
        },
        tab: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          gap: spacing.xs,
        },
        tabActive: {
          backgroundColor: colors.primaryBg,
        },
        tabText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.primary,
        },
        tabBadge: {
          backgroundColor: colors.primary,
          minWidth: 18,
          height: 18,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xxs,
        },
        tabBadgeText: {
          ...typography.badge,
          color: colors.textOnPrimary,
        },

        // Info banner
        infoBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primaryBg,
          marginHorizontal: spacing.md,
          marginTop: spacing.sm,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          gap: spacing.xs,
        },
        infoText: {
          flex: 1,
          ...typography.caption,
          color: colors.primary,
          lineHeight: 16,
        },

        // List
        listContent: {
          padding: spacing.md,
          paddingBottom: spacing.xl,
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: palette.opacity[8],
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        },
        cardInfo: {
          flex: 1,
        },
        cardTitle: {
          ...typography.bodyLarge,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 2,
        },
        cardSubtitle: {
          ...typography.body,
          color: colors.textSecondary,
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
          paddingTop: spacing.sm,
        },
        cardMeta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        dateText: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        statusBadge: {
          paddingHorizontal: spacing.xs,
          paddingVertical: 3,
          borderRadius: radius.sm,
        },
        statusText: {
          ...typography.caption,
          fontWeight: '600',
        },
        priceText: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
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
          maxWidth: 280,
        },
      }),
    [colors]
  );

export default HistoriqueScreen;

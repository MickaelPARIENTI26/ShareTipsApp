import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { purchaseApi } from '../api/purchase.api';
import { subscriptionApi } from '../api/subscription.api';
import type { RootStackParamList, PurchaseDto, SubscriptionDto } from '../types';
import { useTheme, type ThemeColors } from '../theme';

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
  priceCredits: number;
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
        <Text style={styles.priceText}>{item.priceCredits} cr.</Text>
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

  const fetchData = useCallback(async () => {
    try {
      const [purchasesRes, subscriptionsRes] = await Promise.all([
        purchaseApi.getMyPurchases(),
        subscriptionApi.getMySubscriptions(),
      ]);
      setPurchases(purchasesRes.data);
      setSubscriptions(subscriptionsRes.data);
    } catch {
      // Silent error handling
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
      purchases.map((p) => ({
        id: p.id,
        type: 'purchase' as const,
        title: p.ticketTitle,
        subtitle: `Accès au ticket de @${p.sellerUsername}`,
        date: formatDate(p.createdAt),
        status: 'Accessible',
        targetId: p.ticketId,
        targetUsername: p.sellerUsername,
        priceCredits: p.priceCredits,
      })),
    [purchases]
  );

  const subscriptionItems: HistoryItem[] = useMemo(
    () =>
      subscriptions.map((s) => ({
        id: s.id,
        type: 'subscription' as const,
        title: `Accès premium @${s.tipsterUsername}`,
        subtitle: formatDateRange(s.startDate, s.endDate),
        date: formatDate(s.createdAt),
        status: getSubscriptionStatusLabel(s.status, s.endDate),
        targetId: s.tipsterId,
        targetUsername: s.tipsterUsername,
        priceCredits: s.priceCredits,
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achats' && styles.tabActive]}
          onPress={() => setActiveTab('achats')}
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
          {purchases.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{purchases.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'abonnements' && styles.tabActive]}
          onPress={() => setActiveTab('abonnements')}
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
          {subscriptions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{subscriptions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'achats' ? 'document-outline' : 'people-outline'}
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'achats' ? 'Aucun achat' : 'Aucune souscription'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'achats'
                ? 'Achetez des tickets pour y accéder ici.'
                : 'Souscrivez à des pronostiqueurs pour accéder à leurs contenus premium.'}
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
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },

        // Tabs
        tabs: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 12,
          padding: 4,
        },
        tab: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          borderRadius: 8,
          gap: 6,
        },
        tabActive: {
          backgroundColor: colors.primaryLight,
        },
        tabText: {
          fontSize: 13,
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
          borderRadius: 9,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 5,
        },
        tabBadgeText: {
          fontSize: 10,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },

        // Info banner
        infoBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primaryLight,
          marginHorizontal: 16,
          marginTop: 12,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
        },
        infoText: {
          flex: 1,
          fontSize: 12,
          color: colors.primary,
          lineHeight: 16,
        },

        // List
        listContent: {
          padding: 16,
          paddingBottom: 32,
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 12,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        cardInfo: {
          flex: 1,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 2,
        },
        cardSubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.separator,
          paddingTop: 10,
        },
        cardMeta: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        dateText: {
          fontSize: 12,
          color: colors.textTertiary,
        },
        statusBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        },
        statusText: {
          fontSize: 11,
          fontWeight: '600',
        },
        priceText: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },

        // Empty state
        emptyState: {
          alignItems: 'center',
          paddingTop: 60,
          gap: 8,
        },
        emptyTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        emptyText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        },
      }),
    [colors]
  );

export default HistoriqueScreen;

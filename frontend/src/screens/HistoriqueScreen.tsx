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
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TabType = 'achats' | 'abonnements';

interface HistoryItem {
  id: string;
  type: 'purchase' | 'subscription';
  title: string;
  subtitle: string;
  date: string;
  status: string;
  targetId: string;
  targetUsername: string;
  priceEur: number;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// HISTORY CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const HistoryCard: React.FC<{
  item: HistoryItem;
  onPress: () => void;
  index: number;
}> = ({ item, onPress, index }) => {
  const isPurchase = item.type === 'purchase';
  const isActive = item.status === 'Active' || item.status === 'Actif' || item.status.includes('Actif');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isPurchase ? DS.colors.greenBgSubtle : 'rgba(251, 191, 36, 0.15)' },
            ]}
          >
            <Ionicons
              name={isPurchase ? 'document-text' : 'people'}
              size={20}
              color={isPurchase ? DS.colors.green : '#FBBF24'}
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
                  { backgroundColor: isActive ? DS.colors.greenBgSubtle : 'rgba(138, 154, 143, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? DS.colors.green : DS.colors.textSecondary },
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
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const HistoriqueScreen: React.FC = () => {
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
        <ActivityIndicator size="large" color={DS.colors.green} />
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
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === 'achats' ? DS.colors.white : DS.colors.textSecondary}
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
          activeOpacity={0.8}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'abonnements' ? DS.colors.white : DS.colors.textSecondary}
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
          <Ionicons name="information-circle" size={16} color={DS.colors.green} />
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
          renderItem={({ item, index }) => (
            <HistoryCard
              item={item}
              onPress={() => handleItemPress(item)}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DS.colors.green}
              colors={[DS.colors.green]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons
                  name={activeTab === 'achats' ? 'document-outline' : 'people-outline'}
                  size={40}
                  color={DS.colors.green}
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

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  // Loading state
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

  // Animated content wrapper
  animatedContent: {
    flex: 1,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: DS.colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
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
    backgroundColor: DS.colors.green,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  tabTextActive: {
    color: DS.colors.white,
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DS.colors.white,
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.greenBgSubtle,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: DS.colors.green,
    lineHeight: 16,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
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
    color: DS.colors.white,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: DS.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: DS.colors.cardBorder,
    paddingTop: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: DS.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },

  // Empty state
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

export default HistoriqueScreen;

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripeSafe } from '../hooks/useStripeSafe';

import { userApi } from '../api/user.api';
import { followApi, type FollowInfoDto } from '../api/follow.api';
import { marketplaceApi } from '../api/marketplace.api';
import { subscriptionApi } from '../api/subscription.api';
import { subscriptionPlanApi } from '../api/subscriptionPlan.api';
import { useAuthStore } from '../store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';
import { useFollowStore } from '../store/follow.store';
import { useConsentStore } from '../store/consent.store';
import { getErrorMessage } from '../utils/errors';
import { SubscriptionGate } from '../components/SubscriptionGate';
import type {
  RootStackParamList,
  UserProfileDto,
  TicketDto,
  TipsterStatsDto,
  SubscriptionStatusDto,
  SubscriptionPlanDto,
} from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, size, fontSize } from '../theme';
import { TicketCard } from '../components/marketplace/TicketCard';
import { DS } from '../theme/designSystem';

type TabKey = 'public' | 'private' | 'stats';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(days: number): string {
  if (days === 1) return '1 jour';
  if (days < 7) return `${days} jours`;
  if (days === 7) return '1 semaine';
  if (days === 30) return '1 mois';
  if (days === 90) return '3 mois';
  if (days === 365) return '1 an';
  return `${days} jours`;
}

// --- Stat item ---
const StatItem: React.FC<{
  label: string;
  value: string;
  styles: ReturnType<typeof useStyles>;
}> = ({ label, value, styles }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// --- Stats content ---
const StatsContent: React.FC<{
  tipsterStats: TipsterStatsDto;
  ranking: UserProfileDto['ranking'];
  styles: ReturnType<typeof useStyles>;
}> = ({ tipsterStats, ranking, styles }) => (
  <View style={styles.statsContent}>
    {/* General */}
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Général</Text>
      <View style={styles.statsRow}>
        <StatItem
          label="Tickets"
          value={String(tipsterStats.totalTicketsCreated)}
          styles={styles}
        />
        <StatItem label="Vendus" value={String(tipsterStats.ticketsSold)} styles={styles} />
        <StatItem
          label="Acheteurs"
          value={String(tipsterStats.uniqueBuyers)}
          styles={styles}
        />
      </View>
    </View>

    {/* Performance */}
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Performance</Text>
      <View style={styles.statsRow}>
        <StatItem
          label="Validés"
          value={String(tipsterStats.winningTickets)}
          styles={styles}
        />
        <StatItem
          label="Non validés"
          value={String(tipsterStats.losingTickets)}
          styles={styles}
        />
        <StatItem
          label="En cours"
          value={String(tipsterStats.pendingTickets)}
          styles={styles}
        />
        <StatItem
          label="Taux réussite"
          value={`${tipsterStats.winRate.toFixed(1)}%`}
          styles={styles}
        />
      </View>
    </View>

    {/* Odds & Confidence */}
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Cotes & Confiance</Text>
      <View style={styles.statsRow}>
        <StatItem
          label="Cote moy."
          value={tipsterStats.averageOdds.toFixed(2)}
          styles={styles}
        />
        <StatItem
          label="Cote val. moy."
          value={tipsterStats.averageWinningOdds?.toFixed(2) ?? '–'}
          styles={styles}
        />
        <StatItem
          label="Max val."
          value={tipsterStats.highestWinningOdd?.toFixed(2) ?? '–'}
          styles={styles}
        />
        <StatItem
          label="Confiance"
          value={`${tipsterStats.averageConfidence.toFixed(1)}/10`}
          styles={styles}
        />
      </View>
    </View>

    {/* Streaks */}
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Séries</Text>
      <View style={styles.statsRow}>
        <StatItem
          label="Série val. max"
          value={String(tipsterStats.longestWinningStreak)}
          styles={styles}
        />
        <StatItem
          label="Série non val."
          value={String(tipsterStats.longestLosingStreak)}
          styles={styles}
        />
      </View>
    </View>

    {/* Revenue */}
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Revenus</Text>
      <View style={styles.statsRow}>
        <StatItem
          label="Brut"
          value={`${tipsterStats.revenueGrossEur.toFixed(2)} €`}
          styles={styles}
        />
        <StatItem
          label="Net"
          value={`${tipsterStats.revenueNetEur.toFixed(2)} €`}
          styles={styles}
        />
      </View>
    </View>

    {/* Rankings */}
    {ranking && (
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Classement</Text>
        <View style={styles.rankingRow}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankLabel}>Jour</Text>
            <Text style={styles.rankValue}>#{ranking.daily}</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankLabel}>Semaine</Text>
            <Text style={styles.rankValue}>#{ranking.weekly}</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankLabel}>Mois</Text>
            <Text style={styles.rankValue}>#{ranking.monthly}</Text>
          </View>
        </View>
      </View>
    )}
  </View>
);

// --- Main screen ---
const TipsterProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const { initPaymentSheet, presentPaymentSheet } = useStripeSafe();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute();
  const { tipsterId, tipsterUsername } =
    route.params as RootStackParamList['TipsterProfile'];
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProfile = currentUserId === tipsterId;

  // Global favorite store
  const isFavorited = useFavoriteStore((s) => s.isFavorited);
  const toggleFavorite = useFavoriteStore((s) => s.toggle);
  const hydrateFavorites = useFavoriteStore((s) => s.hydrate);

  // Global follow store (for sync with other screens)
  const setGlobalFollowing = useFollowStore((s) => s.setFollowing);
  const hydrateFollows = useFollowStore((s) => s.hydrate);

  // Consent store
  const hasConsented = useConsentStore((s) => s.hasConsented);
  const hydrateConsent = useConsentStore((s) => s.hydrate);
  const giveConsent = useConsentStore((s) => s.giveConsent);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [tipsterStats, setTipsterStats] = useState<TipsterStatsDto | null>(
    null
  );
  const [publicTickets, setPublicTickets] = useState<TicketDto[]>([]);
  const [privateTickets, setPrivateTickets] = useState<TicketDto[]>([]);
  const [followInfo, setFollowInfo] = useState<FollowInfoDto | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatusDto | null>(
    null
  );
  const [subLoading, setSubLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Plans modal state
  const [plansModalVisible, setPlansModalVisible] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('public');

  // Smooth tab transition animation
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  const handleTabChange = useCallback((tab: TabKey) => {
    if (tab === activeTab) return;

    const tabIndex = { public: 0, private: 1, stats: 2 };
    const direction = tabIndex[tab] > tabIndex[activeTab] ? 1 : -1;

    // Animate out
    Animated.parallel([
      Animated.timing(tabFadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(tabSlideAnim, {
        toValue: -10 * direction,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tab);
      tabSlideAnim.setValue(10 * direction);

      // Animate in
      Animated.parallel([
        Animated.timing(tabFadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(tabSlideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab, tabFadeAnim, tabSlideAnim]);

  // Pagination state
  const [publicPage, setPublicPage] = useState(1);
  const [privatePage, setPrivatePage] = useState(1);
  const [publicHasMore, setPublicHasMore] = useState(true);
  const [privateHasMore, setPrivateHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 15;

  const fetchData = useCallback(async () => {
    try {
      const [
        profileRes,
        publicRes,
        privateRes,
        followRes,
        statsRes,
        subRes,
      ] = await Promise.all([
        userApi.getUserProfile(tipsterId),
        marketplaceApi.getPublicTickets({
          creatorId: tipsterId,
          pageSize: PAGE_SIZE,
          page: 1,
          ticketType: 'public',
        }),
        marketplaceApi.getPublicTickets({
          creatorId: tipsterId,
          pageSize: PAGE_SIZE,
          page: 1,
          ticketType: 'private',
        }),
        followApi.getFollowInfo(tipsterId),
        userApi.getTipsterStats(tipsterId),
        subscriptionApi
          .getSubscriptionStatus(tipsterId)
          .catch(() => ({ data: null })),
      ]);
      setProfile(profileRes.data);
      setPublicTickets(publicRes.data.items);
      setPrivateTickets(privateRes.data.items);
      setPublicHasMore(publicRes.data.hasNextPage);
      setPrivateHasMore(privateRes.data.hasNextPage);
      setPublicPage(1);
      setPrivatePage(1);
      setFollowInfo(followRes.data);
      setTipsterStats(statsRes.data);
      if (subRes.data) setSubStatus(subRes.data);
      // Hydrate favorites from global store
      hydrateFavorites();
      // Hydrate follows from global store
      if (currentUserId) {
        hydrateFollows(currentUserId);
      }
      // Hydrate consent status
      hydrateConsent();
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tipsterId, hydrateFavorites, hydrateFollows, hydrateConsent, currentUserId]);

  const loadMoreTickets = useCallback(async () => {
    if (loadingMore) return;

    const isPublic = activeTab === 'public';
    const hasMore = isPublic ? publicHasMore : privateHasMore;
    const currentPage = isPublic ? publicPage : privatePage;

    if (!hasMore) return;

    setLoadingMore(true);
    try {
      const { data } = await marketplaceApi.getPublicTickets({
        creatorId: tipsterId,
        pageSize: PAGE_SIZE,
        page: currentPage + 1,
        ticketType: isPublic ? 'public' : 'private',
      });

      if (isPublic) {
        setPublicTickets((prev) => [...prev, ...data.items]);
        setPublicHasMore(data.hasNextPage);
        setPublicPage(currentPage + 1);
      } else {
        setPrivateTickets((prev) => [...prev, ...data.items]);
        setPrivateHasMore(data.hasNextPage);
        setPrivatePage(currentPage + 1);
      }
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, publicHasMore, privateHasMore, publicPage, privatePage, loadingMore, tipsterId]);

  const onEndReached = useCallback(() => {
    if (activeTab !== 'stats') {
      loadMoreTickets();
    }
  }, [activeTab, loadMoreTickets]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const isFollowing = followInfo?.isFollowing ?? false;

  const handleFollow = useCallback(async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { data } = await followApi.unfollow(tipsterId);
        setFollowInfo((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: data.isFollowing,
                followerCount: prev.followerCount - 1,
              }
            : prev
        );
        // Sync with global store (without API call, since we already made it)
        setGlobalFollowing(tipsterId, false);
      } else {
        const { data } = await followApi.follow(tipsterId);
        setFollowInfo((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: data.isFollowing,
                followerCount: prev.followerCount + 1,
              }
            : prev
        );
        // Sync with global store (without API call, since we already made it)
        setGlobalFollowing(tipsterId, true);
      }
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setFollowLoading(false);
    }
  }, [isFollowing, tipsterId, setGlobalFollowing]);

  const openPlansModal = useCallback(async () => {
    setPlansModalVisible(true);
    setPlansLoading(true);
    try {
      const { data } = await subscriptionPlanApi.getTipsterPlans(tipsterId);
      setPlans(data);
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setPlansLoading(false);
    }
  }, [tipsterId]);

  const closePlansModal = useCallback(() => {
    setPlansModalVisible(false);
  }, []);

  const handleSelectPlan = useCallback(
    async (plan: SubscriptionPlanDto) => {
      // Check consent first
      if (!hasConsented) {
        if (!consentChecked) {
          Alert.alert('Consentement requis', 'Veuillez cocher la case de consentement avant de vous abonner.');
          return;
        }
        const success = await giveConsent();
        if (!success) {
          Alert.alert('Erreur', "Impossible d'enregistrer le consentement");
          return;
        }
      }

      // Free plan - subscribe directly via Stripe (free subscription)
      if (plan.priceEur <= 0) {
        setSubLoading(true);
        closePlansModal();
        try {
          const { data } = await subscriptionApi.initiateSubscription(plan.id);
          if (data.success) {
            // Confirm free subscription
            await subscriptionApi.confirmSubscription(data.paymentId!);
            const statusRes = await subscriptionApi.getSubscriptionStatus(tipsterId);
            setSubStatus(statusRes.data);
            Alert.alert('Abonnement activé', 'Vous êtes maintenant abonné !');
          } else {
            Alert.alert('Erreur', data.message ?? 'Abonnement impossible');
          }
        } catch (err) {
          Alert.alert('Erreur', getErrorMessage(err));
        } finally {
          setSubLoading(false);
        }
        return;
      }

      // Paid plan - use Stripe Payment Sheet
      setSubLoading(true);
      closePlansModal();

      try {
        // 1. Create PaymentIntent on server
        const { data: initData } = await subscriptionApi.initiateSubscription(plan.id);

        if (!initData.success || !initData.clientSecret) {
          Alert.alert('Erreur', initData.message ?? 'Impossible de créer le paiement');
          setSubLoading(false);
          return;
        }

        // 2. Initialize Payment Sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: initData.clientSecret,
          merchantDisplayName: 'ShareTips',
        });

        if (initError) {
          Alert.alert('Erreur', initError.message);
          setSubLoading(false);
          return;
        }

        // 3. Present Payment Sheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          // User cancelled - not an error
          if (presentError.code !== 'Canceled') {
            Alert.alert('Erreur', presentError.message);
          }
          setSubLoading(false);
          return;
        }

        // 4. Confirm subscription on server
        if (initData.paymentId) {
          await subscriptionApi.confirmSubscription(initData.paymentId);
        }

        // Refresh subscription status
        const statusRes = await subscriptionApi.getSubscriptionStatus(tipsterId);
        setSubStatus(statusRes.data);
        Alert.alert('Abonnement activé', 'Vous êtes maintenant abonné !');
      } catch (err) {
        Alert.alert('Erreur', getErrorMessage(err));
      } finally {
        setSubLoading(false);
      }
    },
    [tipsterId, closePlansModal, hasConsented, consentChecked, giveConsent, initPaymentSheet, presentPaymentSheet]
  );

  const handleUnsubscribe = useCallback(() => {
    Alert.alert(
      'Se désabonner',
      `Vous n'aurez plus accès aux tickets privés de ${tipsterUsername}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se désabonner',
          style: 'destructive',
          onPress: async () => {
            setSubLoading(true);
            try {
              await subscriptionApi.unsubscribe(tipsterId);
              setSubStatus({
                isSubscribed: false,
                endDate: null,
                remainingDays: 0,
                wasSubscribed: true,
                previousEndDate: subStatus?.endDate ?? null,
              });
            } catch (err) {
              Alert.alert('Erreur', getErrorMessage(err));
            } finally {
              setSubLoading(false);
            }
          },
        },
      ]
    );
  }, [tipsterId, tipsterUsername, subStatus]);

  const handleToggleFavorite = useCallback(
    (ticketId: string) => {
      toggleFavorite(ticketId);
    },
    [toggleFavorite]
  );

  const handleBuy = useCallback((ticket: TicketDto) => {
    // Navigate to ticket detail for Stripe payment
    navigation.navigate('TicketDetail', { ticketId: ticket.id });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const activeTickets =
    activeTab === 'public' ? publicTickets : privateTickets;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'public', label: 'Publics', count: publicTickets.length },
    { key: 'private', label: 'Privés', count: privateTickets.length },
    { key: 'stats', label: 'Statistiques' },
  ];

  const headerComponent = (
    <View>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {tipsterUsername.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>@{tipsterUsername}</Text>

        {/* Tipster Stats Row: 🏆 #42 • 📊 2.45 • ✅ 67% */}
        {tipsterStats && (
          <View style={styles.headerStatsRow}>
            {/* Ranking */}
            <View style={styles.headerStat}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.headerStatText}>
                #{profile?.ranking?.monthly || '—'}
              </Text>
            </View>

            <Text style={styles.headerStatSeparator}>•</Text>

            {/* Average Odds */}
            <View style={styles.headerStat}>
              <Ionicons name="stats-chart" size={14} color={DS.colors.green} />
              <Text style={styles.headerStatText}>
                {tipsterStats.averageOdds.toFixed(2)}
              </Text>
            </View>

            <Text style={styles.headerStatSeparator}>•</Text>

            {/* Win Rate */}
            <View style={styles.headerStat}>
              <Ionicons name="checkmark-circle" size={14} color={DS.colors.green} />
              <Text style={styles.headerStatText}>
                {(tipsterStats.winRate * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Follow counts */}
        {followInfo && (
          <View style={styles.followCountsRow}>
            <Text style={styles.followCountText}>
              <Text style={styles.followCountBold}>
                {followInfo.followerCount}
              </Text>{' '}
              {followInfo.followerCount === 1 ? 'abonné' : 'abonnés'}
            </Text>
            <Text style={styles.followCountDot}>·</Text>
            <Text style={styles.followCountText}>
              <Text style={styles.followCountBold}>
                {followInfo.followingCount}
              </Text>{' '}
              abonnements
            </Text>
          </View>
        )}

        {/* Follow button (hidden on own profile) */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followBtnActive,
            ]}
            onPress={handleFollow}
            disabled={followLoading}
            activeOpacity={0.7}
          >
            {followLoading ? (
              <ActivityIndicator
                size="small"
                color={isFollowing ? colors.primary : colors.textOnPrimary}
              />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'add'}
                  size={18}
                  color={isFollowing ? colors.primary : colors.textOnPrimary}
                />
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? 'Suivi' : 'Suivre'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Subscription section (hidden on own profile) */}
        {!isOwnProfile && subStatus && (
          <View style={styles.subscriptionSection}>
            {subStatus.isSubscribed ? (
              <View style={styles.subscribedCard}>
                <View style={styles.subscribedHeader}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={styles.subscribedText}>Abonné</Text>
                </View>
                {subStatus.endDate && (
                  <Text style={styles.subscribedEndDate}>
                    Expire le{' '}
                    {new Date(subStatus.endDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    ({subStatus.remainingDays}j restants)
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.unsubscribeBtn}
                  onPress={handleUnsubscribe}
                  disabled={subLoading}
                  activeOpacity={0.7}
                >
                  {subLoading ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Text style={styles.unsubscribeBtnText}>
                      Se désabonner
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={openPlansModal}
                disabled={subLoading}
                activeOpacity={0.7}
              >
                {subLoading ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="star" size={16} color={colors.textOnPrimary} />
                    <Text style={styles.subscribeBtnText}>{"S'abonner"}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats tab content (rendered in header so FlatList can be empty) */}
      {activeTab === 'stats' && tipsterStats && (
        <StatsContent
          tipsterStats={tipsterStats}
          ranking={profile?.ranking ?? null}
          styles={styles}
        />
      )}
    </View>
  );

  const emptyLabel =
    activeTab === 'public'
      ? 'Aucun ticket public'
      : activeTab === 'private'
        ? 'Aucun ticket privé'
        : null;

  // Check if private tab requires subscription access
  const showPrivateGate =
    activeTab === 'private' && !isOwnProfile && !subStatus?.isSubscribed;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedListWrapper,
          {
            opacity: tabFadeAnim,
            transform: [{ translateX: tabSlideAnim }],
          },
        ]}
      >
        <FlatList
          data={activeTab === 'stats' || showPrivateGate ? [] : activeTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            showPrivateGate && styles.listWithGate,
          ]}
          ListHeaderComponent={headerComponent}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={5}
          initialNumToRender={4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            const isPublicTicket = item.isPublic;
            return (
              <View style={styles.ticketCardWrapper}>
                <TicketCard
                  ticket={item}
                  tipsterStats={tipsterStats}
                  tipsterRanking={profile?.ranking?.monthly}
                  isFavorited={isFavorited(item.id)}
                  isFollowingCreator={isFollowing}
                  isOwnTicket={isOwnProfile}
                  onToggleFavorite={handleToggleFavorite}
                  onBuy={handleBuy}
                  onShare={() => {}}
                  onTipsterPress={() => {}}
                  onFollowCreator={() => {}}
                  hideTipsterHeader
                  disabled={isPublicTicket}
                  onCardPress={isPublicTicket ? undefined : (t) => navigation.navigate('TicketDetail', { ticketId: t.id })}
                />
              </View>
            );
          }}
          ListFooterComponent={
            showPrivateGate ? (
              <SubscriptionGate
                isSubscribed={false}
                isLoading={subLoading}
                isCreator={isOwnProfile}
                onSubscribe={openPlansModal}
                lockedTitle="Tickets privés réservés aux abonnés"
                lockedMessage={`Abonnez-vous à ${tipsterUsername} pour accéder à tous ses tickets privés et analyses exclusives.`}
                buttonText="Voir les abonnements"
                remainingDays={subStatus?.remainingDays}
                wasSubscribed={subStatus?.wasSubscribed}
              >
                <View />
              </SubscriptionGate>
            ) : loadingMore && activeTab !== 'stats' ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !showPrivateGate && emptyLabel ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              </View>
            ) : null
          }
        />
      </Animated.View>

      {/* Plans Modal */}
      <Modal
        visible={plansModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePlansModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{"Plans d'abonnement"}</Text>
              <TouchableOpacity onPress={closePlansModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {plansLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : plans.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.modalEmptyText}>
                  {"Aucun plan d'abonnement disponible"}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.plansList} showsVerticalScrollIndicator={false}>
                <Text style={styles.disclaimer}>
                  {"L'abonnement donne accès aux pronostics. Aucun résultat n'est garanti. Vous restez seul responsable de vos décisions."}
                </Text>
                {/* Consent checkbox - shown if not already consented */}
                {!hasConsented && (
                  <TouchableOpacity
                    style={styles.consentRow}
                    onPress={() => setConsentChecked(!consentChecked)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                      {consentChecked && (
                        <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                      )}
                    </View>
                    <Text style={styles.consentLabel}>
                      Je comprends que les pronostics ne garantissent aucun résultat
                    </Text>
                  </TouchableOpacity>
                )}
                {plans.map((plan) => (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      {plan.description && (
                        <Text style={styles.planDescription} numberOfLines={2}>
                          {plan.description}
                        </Text>
                      )}
                      <View style={styles.planDetails}>
                        <View style={styles.planDetail}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.planDetailText}>
                            {formatDuration(plan.durationInDays)}
                          </Text>
                        </View>
                        <View style={styles.planDetail}>
                          <Ionicons name="wallet-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.planDetailText}>
                            {plan.priceEur > 0 ? `${plan.priceEur.toFixed(2)} €` : 'Gratuit'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.choosePlanBtn}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.choosePlanBtnText}>Choisir</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
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
        list: {
          paddingBottom: 80,
          backgroundColor: colors.background,
        },
        listWithGate: {
          flexGrow: 1,
        },
        loadingMore: {
          paddingVertical: spacing.md,
          alignItems: 'center',
        },
        animatedListWrapper: {
          flex: 1,
        },

        // Profile header
        profileHeader: {
          alignItems: 'center',
          backgroundColor: colors.surface,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.base,
        },
        avatar: {
          width: size.profile.avatarMd,
          height: size.profile.avatarMd,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing['sm+'],
        },
        avatarText: {
          color: colors.textOnPrimary,
          fontSize: fontSize['3xl'],
          fontWeight: '800',
        },
        username: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing['2xs'],
        },
        headerStatsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        headerStat: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        headerStatText: {
          fontSize: fontSize.md,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        headerStatSeparator: {
          fontSize: fontSize.md,
          color: colors.textTertiary,
        },
        followCountsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['2xs'],
          marginBottom: spacing.md,
        },
        followCountText: {
          ...typography.bodySmall,
          color: colors.textSecondary,
        },
        followCountBold: {
          fontWeight: '700',
          color: colors.text,
        },
        followCountDot: {
          fontSize: fontSize.md,
          color: colors.textTertiary,
        },
        followBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          borderRadius: radius['md+'],
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing['sm+'],
          gap: spacing['2xs'],
        },
        followBtnActive: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        followBtnText: {
          color: colors.textOnPrimary,
          fontSize: fontSize.base,
          fontWeight: '700',
        },
        followBtnTextActive: {
          color: colors.primary,
        },

        // Subscription
        subscriptionSection: {
          width: '100%',
          marginTop: spacing.md,
          paddingHorizontal: spacing.base,
        },
        subscribedCard: {
          backgroundColor: colors.successLight,
          borderRadius: radius['md+'],
          padding: spacing.md,
          alignItems: 'center',
          gap: spacing.xs,
        },
        subscribedHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['2xs'],
        },
        subscribedText: {
          fontSize: fontSize.base,
          fontWeight: '700',
          color: colors.success,
        },
        subscribedEndDate: {
          ...typography.caption,
          color: colors.successDark,
        },
        unsubscribeBtn: {
          marginTop: spacing['2xs'],
          paddingHorizontal: spacing.base,
          paddingVertical: spacing['2xs'],
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.danger,
        },
        unsubscribeBtnText: {
          fontSize: fontSize.md,
          fontWeight: '600',
          color: colors.danger,
        },
        subscribeBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.warning,
          borderRadius: radius['md+'],
          paddingVertical: spacing['sm+'],
          gap: spacing['2xs'],
        },
        subscribeBtnText: {
          color: colors.textOnPrimary,
          fontSize: fontSize.base,
          fontWeight: '700',
        },
        expiredCard: {
          backgroundColor: colors.warningLight,
          borderRadius: radius['md+'],
          padding: spacing.md,
          alignItems: 'center',
          gap: spacing.xs,
          marginBottom: spacing.sm,
        },
        expiredHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['2xs'],
        },
        expiredText: {
          fontSize: fontSize.base,
          fontWeight: '700',
          color: colors.warning,
        },
        expiredEndDate: {
          ...typography.caption,
          color: colors.warningDark,
        },

        // Tab bar
        tabBar: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        tab: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: spacing.md,
          borderBottomWidth: spacing.xxs,
          borderBottomColor: 'transparent',
        },
        tabActive: {
          borderBottomColor: colors.primary,
        },
        tabText: {
          fontSize: fontSize.md,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.primary,
        },

        // Stats content
        statsContent: {
          padding: spacing.md,
        },
        statsCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.base,
          padding: spacing['md+'],
          marginBottom: spacing['sm+'],
        },
        statsCardTitle: {
          fontSize: fontSize.md,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing['sm+'],
        },
        statsRow: {
          flexDirection: 'row',
          width: '100%',
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
        },
        statValue: {
          ...typography.body,
          fontWeight: '800',
          color: colors.text,
        },
        statLabel: {
          ...typography.captionSmall,
          color: colors.textSecondary,
          marginTop: spacing.xxs,
          textAlign: 'center',
        },
        rankingRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          justifyContent: 'center',
        },
        rankBadge: {
          alignItems: 'center',
          backgroundColor: colors.background,
          borderRadius: radius.md,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
        },
        rankLabel: {
          ...typography.captionSmall,
          color: colors.textSecondary,
        },
        rankValue: {
          ...typography.bodySmall,
          fontWeight: '800',
          color: colors.primary,
        },

        // TicketCard wrapper (from marketplace)
        ticketCardWrapper: {
          marginHorizontal: spacing.md,
        },

        // Card (legacy TipsterTicketCard - can be removed)
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.base,
          padding: spacing['md+'],
          marginHorizontal: spacing.md,
          marginBottom: spacing['sm+'],
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        cardTitle: {
          fontSize: fontSize.base,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
          marginRight: spacing.sm,
        },
        cardMeta: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          padding: spacing['sm+'],
          marginBottom: spacing['sm+'],
        },
        metaItem: {
          flex: 1,
          alignItems: 'center',
        },
        metaLabel: {
          ...typography.mini,
          color: colors.textSecondary,
          marginBottom: spacing.xxs,
        },
        metaValue: {
          fontSize: fontSize.md,
          fontWeight: '700',
          color: colors.text,
        },
        metaValueBlue: {
          fontSize: fontSize.base,
          fontWeight: '800',
          color: colors.primary,
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing['2xs'],
        },
        sportRow: {
          flexDirection: 'row',
          gap: spacing['2xs'],
        },
        sportBadge: {
          backgroundColor: colors.background,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        sportBadgeText: {
          ...typography.mini,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        payantBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          gap: spacing.xs,
        },
        payantBadgeText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.warning,
        },
        abonneBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          gap: spacing.xs,
        },
        abonneBadgeText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.warning,
        },
        buyBtn: {
          backgroundColor: colors.success,
          borderRadius: radius.md,
          paddingHorizontal: spacing['sm+'],
          paddingVertical: spacing['2xs'],
        },
        buyBtnText: {
          color: colors.textOnPrimary,
          fontSize: fontSize.md,
          fontWeight: '700',
        },
        freeText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.success,
        },
        dateText: {
          ...typography.mini,
          color: colors.textTertiary,
        },

        // Empty
        empty: {
          alignItems: 'center',
          paddingTop: spacing['3xl'],
        },
        emptyText: {
          fontSize: fontSize.base,
          color: colors.textSecondary,
          marginTop: spacing.sm,
        },

        // Container
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        // Plans Modal
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        modalContent: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius['2xl'],
          borderTopRightRadius: radius['2xl'],
          maxHeight: '80%',
          minHeight: 300,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
        modalTitle: {
          ...typography.h4,
          color: colors.text,
        },
        modalLoading: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: spacing['2xl'],
          gap: spacing.md,
        },
        modalEmpty: {
          alignItems: 'center',
          paddingVertical: spacing['2xl'],
          paddingHorizontal: spacing.xl,
        },
        modalEmptyText: {
          ...typography.body,
          color: colors.textSecondary,
          marginTop: spacing.md,
          textAlign: 'center',
        },
        plansList: {
          padding: spacing.base,
        },
        disclaimer: {
          ...typography.mini,
          color: colors.textTertiary,
          textAlign: 'center',
          marginBottom: spacing.base,
          lineHeight: 15,
        },
        consentRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing['sm+'],
          marginBottom: spacing.base,
          paddingHorizontal: spacing.xs,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: radius.xs,
          borderWidth: spacing.xxs,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        consentLabel: {
          flex: 1,
          ...typography.caption,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        planCard: {
          backgroundColor: colors.background,
          borderRadius: radius.base,
          padding: spacing.base,
          marginBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        planInfo: {
          flex: 1,
        },
        planTitle: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
          marginBottom: spacing.xs,
        },
        planDescription: {
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        planDetails: {
          flexDirection: 'row',
          gap: spacing.base,
        },
        planDetail: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        planDetailText: {
          fontSize: fontSize.md,
          color: colors.textSecondary,
        },
        choosePlanBtn: {
          backgroundColor: colors.primary,
          borderRadius: radius['md+'],
          paddingHorizontal: spacing.base,
          paddingVertical: spacing['sm+'],
        },
        choosePlanBtnText: {
          color: colors.textOnPrimary,
          ...typography.bodySmall,
          fontWeight: '700',
        },
      }),
    [colors]
  );

export default TipsterProfileScreen;

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
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';

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
import { useTheme, type ThemeColors } from '../theme';

type TabKey = 'public' | 'private' | 'stats';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

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

// --- Ticket card ---
const TipsterTicketCard: React.FC<{
  ticket: TicketDto;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  onBuy: (ticket: TicketDto) => void;
  onPress: () => void;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({ ticket, isFavorited, onToggleFavorite, onBuy, onPress, styles, colors }) => {
  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const hasAccess = ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {ticket.title || `${count} ${count === 1 ? 'match' : 'matchs'}`}
        </Text>
        <TouchableOpacity onPress={() => onToggleFavorite(ticket.id)}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorited ? colors.danger : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Cote moy.</Text>
          <Text style={styles.metaValueBlue}>
            {ticket.avgOdds.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Confiance</Text>
          <Text style={styles.metaValue}>{ticket.confidenceIndex}/10</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Sélections</Text>
          <Text style={styles.metaValue}>{count}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.sportRow}>
          {ticket.sports.map((s) => (
            <View key={s} style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {SPORT_LABELS[s] ?? s}
              </Text>
            </View>
          ))}
        </View>
        {isPrivateLocked ? (
          <View style={styles.payantBadge}>
            <Ionicons name="lock-closed" size={12} color={colors.warning} />
            <Text style={styles.payantBadgeText}>
              {ticket.priceCredits} cr.
            </Text>
          </View>
        ) : !ticket.isPublic && ticket.isSubscribedToCreator ? (
          <View style={styles.abonneBadge}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.abonneBadgeText}>Abonné</Text>
          </View>
        ) : ticket.priceCredits > 0 ? (
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => onBuy(ticket)}
            activeOpacity={0.7}
          >
            <Text style={styles.buyBtnText}>{ticket.priceCredits} cr.</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.freeText}>Gratuit</Text>
        )}
      </View>
      <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
    </TouchableOpacity>
  );
};

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
          value={`${tipsterStats.revenueGross} cr.`}
          styles={styles}
        />
        <StatItem
          label="Net"
          value={`${tipsterStats.revenueNet.toFixed(0)} cr.`}
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
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
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

      // Free plan - subscribe directly
      if (plan.priceCredits <= 0) {
        setSubLoading(true);
        closePlansModal();
        try {
          const { data } = await subscriptionApi.subscribeWithPlan(plan.id);
          if (data.success) {
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            onPress={() => setActiveTab(tab.key)}
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
      <FlatList
        data={activeTab === 'stats' || showPrivateGate ? [] : activeTickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          showPrivateGate && styles.listWithGate,
        ]}
        ListHeaderComponent={headerComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <TipsterTicketCard
            ticket={item}
            isFavorited={isFavorited(item.id)}
            onToggleFavorite={handleToggleFavorite}
            onBuy={handleBuy}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
            styles={styles}
            colors={colors}
          />
        )}
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
                            {plan.priceCredits} crédits
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
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        list: {
          paddingBottom: 80,
          backgroundColor: colors.background,
        },
        listWithGate: {
          flexGrow: 1,
        },
        loadingMore: {
          paddingVertical: 16,
          alignItems: 'center',
        },

        // Profile header
        profileHeader: {
          alignItems: 'center',
          backgroundColor: colors.surface,
          paddingVertical: 20,
          paddingHorizontal: 16,
        },
        avatar: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        },
        avatarText: {
          color: colors.textOnPrimary,
          fontSize: 26,
          fontWeight: '800',
        },
        username: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 6,
        },
        followCountsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        },
        followCountText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        followCountBold: {
          fontWeight: '700',
          color: colors.text,
        },
        followCountDot: {
          fontSize: 14,
          color: colors.textTertiary,
        },
        followBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          borderRadius: 10,
          paddingHorizontal: 24,
          paddingVertical: 10,
          gap: 6,
        },
        followBtnActive: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        followBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '700',
        },
        followBtnTextActive: {
          color: colors.primary,
        },

        // Subscription
        subscriptionSection: {
          width: '100%',
          marginTop: 12,
          paddingHorizontal: 16,
        },
        subscribedCard: {
          backgroundColor: colors.successLight,
          borderRadius: 10,
          padding: 12,
          alignItems: 'center',
          gap: 4,
        },
        subscribedHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        subscribedText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.success,
        },
        subscribedEndDate: {
          fontSize: 12,
          color: colors.successDark,
        },
        unsubscribeBtn: {
          marginTop: 6,
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.danger,
        },
        unsubscribeBtnText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.danger,
        },
        subscribeBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.warning,
          borderRadius: 10,
          paddingVertical: 10,
          gap: 6,
        },
        subscribeBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '700',
        },
        expiredCard: {
          backgroundColor: colors.warningLight,
          borderRadius: 10,
          padding: 12,
          alignItems: 'center',
          gap: 4,
          marginBottom: 8,
        },
        expiredHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        expiredText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.warning,
        },
        expiredEndDate: {
          fontSize: 12,
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
          paddingVertical: 12,
          borderBottomWidth: 2,
          borderBottomColor: 'transparent',
        },
        tabActive: {
          borderBottomColor: colors.primary,
        },
        tabText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.primary,
        },

        // Stats content
        statsContent: {
          padding: 12,
        },
        statsCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
        },
        statsCardTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
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
          fontSize: 16,
          fontWeight: '800',
          color: colors.text,
        },
        statLabel: {
          fontSize: 10,
          color: colors.textSecondary,
          marginTop: 2,
          textAlign: 'center',
        },
        rankingRow: {
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        },
        rankBadge: {
          alignItems: 'center',
          backgroundColor: colors.background,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        rankLabel: {
          fontSize: 10,
          color: colors.textSecondary,
        },
        rankValue: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.primary,
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginHorizontal: 12,
          marginBottom: 10,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
          marginRight: 8,
        },
        cardMeta: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        },
        metaItem: {
          flex: 1,
          alignItems: 'center',
        },
        metaLabel: {
          fontSize: 11,
          color: colors.textSecondary,
          marginBottom: 2,
        },
        metaValue: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.text,
        },
        metaValueBlue: {
          fontSize: 15,
          fontWeight: '800',
          color: colors.primary,
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        sportRow: {
          flexDirection: 'row',
          gap: 6,
        },
        sportBadge: {
          backgroundColor: colors.background,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        sportBadgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        payantBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
        },
        payantBadgeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.warning,
        },
        abonneBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
        },
        abonneBadgeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.warning,
        },
        buyBtn: {
          backgroundColor: colors.success,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        buyBtnText: {
          color: colors.textOnPrimary,
          fontSize: 13,
          fontWeight: '700',
        },
        freeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.success,
        },
        dateText: {
          fontSize: 11,
          color: colors.textTertiary,
        },

        // Empty
        empty: {
          alignItems: 'center',
          paddingTop: 40,
        },
        emptyText: {
          fontSize: 15,
          color: colors.textSecondary,
          marginTop: 8,
        },

        // Container
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        // Plans Modal
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '80%',
          minHeight: 300,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
        },
        modalLoading: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
        },
        modalEmpty: {
          alignItems: 'center',
          paddingVertical: 60,
          paddingHorizontal: 32,
        },
        modalEmptyText: {
          fontSize: 16,
          color: colors.textSecondary,
          marginTop: 16,
          textAlign: 'center',
        },
        plansList: {
          padding: 16,
        },
        disclaimer: {
          fontSize: 11,
          color: colors.textTertiary,
          textAlign: 'center',
          marginBottom: 16,
          lineHeight: 15,
        },
        consentRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 16,
          paddingHorizontal: 4,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 4,
          borderWidth: 2,
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
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        planCard: {
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        planInfo: {
          flex: 1,
        },
        planTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 4,
        },
        planDescription: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        planDetails: {
          flexDirection: 'row',
          gap: 16,
        },
        planDetail: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        planDetailText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        choosePlanBtn: {
          backgroundColor: colors.primary,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        choosePlanBtnText: {
          color: colors.textOnPrimary,
          fontSize: 14,
          fontWeight: '700',
        },
      }),
    [colors]
  );

export default TipsterProfileScreen;

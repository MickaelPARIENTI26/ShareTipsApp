import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  marketplaceApi,
  type MarketplaceFilters,
} from '../api/marketplace.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';
import { useFollowStore } from '../store/follow.store';
import FilterModal from '../components/marketplace/FilterPanel';
import { TicketCard } from '../components/marketplace/TicketCard';
import { ErrorBanner } from '../components/common';
import { MarketRefreshControl } from '../components/common/PremiumRefreshControl';
import { parseError, type AppError } from '../utils/errors';
import { rankingApi } from '../api/ranking.api';
import type {
  RootStackParamList,
  TicketDto,
  TicketFilterMetaDto,
  TipsterStatsDto,
} from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type FilterType = 'all' | 'followed' | 'free' | 'paid';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function countActiveFilters(filters: MarketplaceFilters): number {
  let count = 0;
  if (filters.sports?.length) count++;
  if (filters.ticketType) count++;
  if (filters.minOdds !== undefined || filters.maxOdds !== undefined) count++;
  if (
    filters.minSelections !== undefined ||
    filters.maxSelections !== undefined
  )
    count++;
  return count;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Filter chip styled like MatchesScreen
 */
const FilterChip: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
}> = React.memo(({ label, isActive, onPress, badge }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.filterChip,
      {
        backgroundColor: isActive ? DS.colors.green : 'transparent',
        borderColor: isActive ? DS.colors.green : '#1C2B21',
      },
    ]}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.filterChipText,
        { color: isActive ? DS.colors.white : DS.colors.textSecondary },
      ]}
    >
      {label}
    </Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.filterBadge}>
        <Text style={styles.filterBadgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
));

FilterChip.displayName = 'FilterChip';

/**
 * Filter bar matching MatchesScreen design
 */
const FilterBar: React.FC<{
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
}> = React.memo(({ activeFilter, onFilterChange, onOpenFilterModal, activeFilterCount }) => (
  <View style={styles.filterBar}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScrollContent}
    >
      <FilterChip
        label="Tous"
        isActive={activeFilter === 'all'}
        onPress={() => onFilterChange('all')}
      />
      <FilterChip
        label="Suivis"
        isActive={activeFilter === 'followed'}
        onPress={() => onFilterChange('followed')}
      />
      <FilterChip
        label="Gratuits"
        isActive={activeFilter === 'free'}
        onPress={() => onFilterChange('free')}
      />
      <FilterChip
        label="Premium"
        isActive={activeFilter === 'paid'}
        onPress={() => onFilterChange('paid')}
      />

      {/* Advanced filters button */}
      <TouchableOpacity
        onPress={onOpenFilterModal}
        style={[
          styles.filterChip,
          styles.advancedFilterChip,
          activeFilterCount > 0 && styles.advancedFilterChipActive,
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={activeFilterCount > 0 ? DS.colors.white : DS.colors.textSecondary}
        />
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  </View>
));

FilterBar.displayName = 'FilterBar';

/**
 * Loading state matching MatchesScreen
 */
const LoadingState: React.FC = React.memo(() => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingIcon, { opacity: pulseAnim }]}>
        <Ionicons name="storefront" size={48} color={DS.colors.green} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Chargement du marketplace</Text>
      <Text style={styles.loadingSubtitle}>Récupération des tickets...</Text>
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

/**
 * Empty state matching MatchesScreen
 */
const EmptyState: React.FC = React.memo(() => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="storefront-outline" size={48} color={DS.colors.textSecondary} />
    </View>
    <Text style={styles.emptyTitle}>Aucun ticket disponible</Text>
    <Text style={styles.emptySubtitle}>
      Modifiez les filtres pour voir plus de résultats
    </Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MarketplaceScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const favoritedIds = useFavoriteStore((s) => s.favoritedIds);
  const hydrateFavorites = useFavoriteStore((s) => s.hydrate);
  const toggleFavorite = useFavoriteStore((s) => s.toggle);

  // Global follow store
  const hydrateFollows = useFollowStore((s) => s.hydrate);
  const toggleFollow = useFollowStore((s) => s.toggle);
  const followedIds = useFollowStore((s) => s.followedIds);

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMeta, setFilterMeta] = useState<TicketFilterMetaDto | null>(
    null
  );
  const [error, setError] = useState<AppError | null>(null);

  // Cache for tipster stats and rankings
  const [tipsterStatsCache, setTipsterStatsCache] = useState<Map<string, TipsterStatsDto>>(new Map());
  const [rankingCache, setRankingCache] = useState<Map<string, number>>(new Map());

  // Fetch filter metadata, user favorites, followed creators, and rankings on mount
  useEffect(() => {
    marketplaceApi
      .getFilterMeta()
      .then(({ data }) => setFilterMeta(data))
      .catch(() => {});
    hydrateFavorites();

    // Fetch ranking data once
    rankingApi.getRanking('weekly')
      .then(({ data }) => {
        const map = new Map<string, number>();
        data.rankings.forEach(r => map.set(r.userId, r.rank));
        setRankingCache(map);
      })
      .catch(() => {});
    if (currentUserId) {
      hydrateFollows(currentUserId);
    }
  }, [currentUserId, hydrateFavorites, hydrateFollows]);

  // Update filters when activeFilter changes
  useEffect(() => {
    const newFilters: MarketplaceFilters = { ...filters };

    switch (activeFilter) {
      case 'followed':
        newFilters.followedOnly = true;
        newFilters.ticketType = undefined;
        break;
      case 'free':
        newFilters.followedOnly = undefined;
        newFilters.ticketType = 'public';
        break;
      case 'paid':
        newFilters.followedOnly = undefined;
        newFilters.ticketType = 'private';
        break;
      default:
        newFilters.followedOnly = undefined;
        newFilters.ticketType = undefined;
    }

    setFilters(newFilters);
  }, [activeFilter]);

  const fetchTickets = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setError(null);
        const { data } = await marketplaceApi.getPublicTickets({
          ...filters,
          page: pageNum,
          pageSize: 15,
        });
        const newTickets = data.items;
        setTickets((prev) => (append ? [...prev, ...newTickets] : newTickets));
        setHasMore(data.hasNextPage);
        setPage(pageNum);

        // Fetch tipster stats for new creators (if not already cached)
        const creatorIds = [...new Set(newTickets.map(t => t.creatorId))];
        const uncachedIds = creatorIds.filter(id => !tipsterStatsCache.has(id));

        if (uncachedIds.length > 0) {
          // Fetch stats in parallel
          const statsPromises = uncachedIds.map(id =>
            userApi.getTipsterStats(id)
              .then(res => ({ id, stats: res.data }))
              .catch(() => null)
          );

          const results = await Promise.all(statsPromises);
          setTipsterStatsCache(prev => {
            const newCache = new Map(prev);
            results.forEach(r => {
              if (r) {
                newCache.set(r.id, r.stats);
              }
            });
            return newCache;
          });
        }
      } catch (err) {
        const appError = parseError(err);
        setError(appError);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters, tipsterStatsCache]
  );

  useEffect(() => {
    setLoading(true);
    setTickets([]);
    fetchTickets(1);
  }, [fetchTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets(1);
  }, [fetchTickets]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchTickets(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchTickets]);

  const handleToggleFavorite = useCallback(
    (ticketId: string) => {
      toggleFavorite(ticketId);
    },
    [toggleFavorite]
  );

  const handleBuy = useCallback(
    (ticket: TicketDto) => {
      // Navigate to ticket detail for Stripe payment
      navigation.navigate('TicketDetail', { ticketId: ticket.id });
    },
    [navigation]
  );

  const handleShare = useCallback(
    async (ticket: TicketDto) => {
      try {
        const matchCount = ticket.selectionCount ?? ticket.selections?.length ?? 0;
        const message = `🎯 Ticket de ${ticket.creatorUsername}\n📊 ${matchCount} matchs • Cote ${ticket.avgOdds.toFixed(2)}\n${ticket.isPublic ? '🆓 Gratuit' : `💰 ${ticket.priceEur.toFixed(2)}€`}`;

        await Share.share({
          message,
          title: `Ticket #${ticket.id.slice(-4)}`,
        });
      } catch (err) {
        if (__DEV__) console.error('Share error:', err);
      }
    },
    []
  );

  const handleTipsterPress = useCallback(
    (creatorId: string, username: string) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: creatorId,
        tipsterUsername: username,
      });
    },
    [navigation]
  );

  const handleFollowCreator = useCallback(
    (creatorId: string) => {
      toggleFollow(creatorId);
    },
    [toggleFollow]
  );

  const handleApplyFilters = useCallback((newFilters: MarketplaceFilters) => {
    setFilters((prev) => ({
      ...prev,
      sports: newFilters.sports,
      minOdds: newFilters.minOdds,
      maxOdds: newFilters.maxOdds,
      minSelections: newFilters.minSelections,
      maxSelections: newFilters.maxSelections,
      ticketType: newFilters.ticketType,
    }));
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTickets(1);
  }, [fetchTickets]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  // Stable callbacks for FilterBar and FilterModal
  const handleOpenFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onOpenFilterModal={handleOpenFilterModal}
        activeFilterCount={countActiveFilters(filters)}
      />
      <FilterModal
        visible={showFilterModal}
        onClose={handleCloseFilterModal}
        filters={filters}
        onApply={handleApplyFilters}
        meta={filterMeta}
      />
      {error && (
        <ErrorBanner
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}
      <FlatList
        testID="marketplace-list"
        data={tickets}
        keyExtractor={(item) => item.id}
        extraData={[favoritedIds, followedIds, tipsterStatsCache]}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <MarketRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        // Performance optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            tipsterStats={tipsterStatsCache.get(item.creatorId) ?? null}
            tipsterRanking={rankingCache.get(item.creatorId) ?? null}
            isFavorited={favoritedIds.has(item.id)}
            isFollowingCreator={followedIds.has(item.creatorId)}
            isOwnTicket={item.creatorId === currentUserId}
            onToggleFavorite={handleToggleFavorite}
            onBuy={handleBuy}
            onShare={handleShare}
            onTipsterPress={handleTipsterPress}
            onFollowCreator={handleFollowCreator}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={DS.colors.green} />
              <Text style={styles.loadingMoreText}>Chargement...</Text>
            </View>
          ) : null
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

  // Filter bar
  filterBar: {
    backgroundColor: DS.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.tabBarBorder,
    paddingVertical: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  advancedFilterChip: {
    borderColor: '#1C2B21',
    paddingHorizontal: 12,
  },
  advancedFilterChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  filterBadge: {
    backgroundColor: DS.colors.white,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: DS.colors.green,
    fontSize: 10,
    fontWeight: '700',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    padding: 24,
  },
  loadingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    marginTop: 8,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.colors.cardBg,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Loading more
  loadingMore: {
    padding: 24,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 8,
  },
});

export default MarketplaceScreen;

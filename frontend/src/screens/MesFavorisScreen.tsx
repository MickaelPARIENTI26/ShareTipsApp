import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { favoriteApi } from '../api/favorite.api';
import { useFavoriteStore } from '../store/favorite.store';
import { MarketRefreshControl } from '../components/common/PremiumRefreshControl';
import type { RootStackParamList, FavoriteTicketDto } from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PAGE_SIZE = 15;

type FilterType = 'all' | 'free' | 'paid' | 'pending' | 'won' | 'lost';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basket',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
  HOCKEY: 'Hockey',
  RUGBY: 'Rugby',
};

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
  HOCKEY: 'snow',
  RUGBY: 'american-football',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'won':
    case 'gagné':
      return DS.colors.green;
    case 'lost':
    case 'perdu':
      return '#EF4444';
    default:
      return DS.colors.textSecondary;
  }
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'won':
      return 'Gagné';
    case 'lost':
      return 'Perdu';
    case 'pending':
      return 'En cours';
    default:
      return status;
  }
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Filter Chip
 */
const FilterChip: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
}> = React.memo(({ label, isActive, onPress }) => (
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
  </TouchableOpacity>
));

FilterChip.displayName = 'FilterChip';

/**
 * Filter Bar
 */
const FilterBar: React.FC<{
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}> = React.memo(({ activeFilter, onFilterChange }) => (
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
        label="En cours"
        isActive={activeFilter === 'pending'}
        onPress={() => onFilterChange('pending')}
      />
      <FilterChip
        label="Gagnés"
        isActive={activeFilter === 'won'}
        onPress={() => onFilterChange('won')}
      />
      <FilterChip
        label="Perdus"
        isActive={activeFilter === 'lost'}
        onPress={() => onFilterChange('lost')}
      />
    </ScrollView>
  </View>
));

FilterBar.displayName = 'FilterBar';

/**
 * Favorite Card - DS styled
 */
const FavoriteCard: React.FC<{
  item: FavoriteTicketDto;
  onUnfavorite: (ticketId: string) => void;
  onTipsterPress: (creatorId: string, username: string) => void;
  onCardPress: (ticketId: string) => void;
}> = React.memo(({ item, onUnfavorite, onTipsterPress, onCardPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleUnfavorite = () => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onUnfavorite(item.ticketId);
  };

  const statusColor = getStatusColor(item.status);

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onCardPress(item.ticketId)}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            onPress={() => onTipsterPress(item.creatorId, item.creatorUsername)}
            style={styles.creatorRow}
          >
            <View style={styles.creatorAvatar}>
              <Ionicons name="person" size={14} color={DS.colors.green} />
            </View>
            <Text style={styles.creatorName}>@{item.creatorUsername}</Text>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <TouchableOpacity
                onPress={handleUnfavorite}
                style={styles.heartButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="heart" size={22} color="#EF4444" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.ticketTitle}
        </Text>

        {/* Sports badges */}
        <View style={styles.sportsRow}>
          {item.sports.slice(0, 3).map((sport) => (
            <View key={sport} style={styles.sportBadge}>
              <Ionicons
                name={SPORT_ICONS[sport] || 'trophy'}
                size={12}
                color={DS.colors.green}
              />
              <Text style={styles.sportText}>{SPORT_LABELS[sport] ?? sport}</Text>
            </View>
          ))}
          {item.sports.length > 3 && (
            <View style={styles.sportBadge}>
              <Text style={styles.sportText}>+{item.sports.length - 3}</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>COTE</Text>
            <Text style={styles.statValue}>{item.avgOdds.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MATCHS</Text>
            <Text style={styles.statValue}>{item.selectionCount || '-'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>AJOUTÉ</Text>
            <Text style={styles.statValueSmall}>{formatDate(item.favoritedAt)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.priceTag}>
            {item.priceEur === 0 ? (
              <>
                <Ionicons name="gift" size={14} color={DS.colors.green} />
                <Text style={styles.priceTextFree}>GRATUIT</Text>
              </>
            ) : (
              <>
                <Ionicons name="pricetag" size={14} color={DS.colors.greenLight} />
                <Text style={styles.priceText}>{item.priceEur.toFixed(2)} €</Text>
              </>
            )}
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>VOIR</Text>
            <Ionicons name="chevron-forward" size={14} color={DS.colors.white} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

FavoriteCard.displayName = 'FavoriteCard';

/**
 * Loading State
 */
const LoadingState: React.FC = React.memo(() => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingIcon, { opacity: pulseAnim }]}>
        <Ionicons name="heart" size={48} color={DS.colors.green} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Chargement des favoris</Text>
      <Text style={styles.loadingSubtitle}>Récupération de vos tickets...</Text>
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

/**
 * Empty State
 */
const EmptyState: React.FC = React.memo(() => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="heart-outline" size={48} color={DS.colors.textSecondary} />
    </View>
    <Text style={styles.emptyTitle}>Aucun favori</Text>
    <Text style={styles.emptySubtitle}>
      Ajoutez des tickets en favoris depuis le marketplace
    </Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MesFavorisScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toggleFavorite = useFavoriteStore((s) => s.toggle);

  const [favorites, setFavorites] = useState<FavoriteTicketDto[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteTicketDto[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);

  // Apply filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredFavorites(favorites);
    } else {
      const filtered = favorites.filter((f) => {
        const status = f.status.toLowerCase();
        switch (activeFilter) {
          case 'pending':
            return status === 'pending' || status === 'en cours';
          case 'won':
            return status === 'won' || status === 'gagné';
          case 'lost':
            return status === 'lost' || status === 'perdu';
          case 'free':
            return f.priceEur === 0;
          case 'paid':
            return f.priceEur > 0;
          default:
            return true;
        }
      });
      setFilteredFavorites(filtered);
    }
  }, [favorites, activeFilter]);

  const fetchFavorites = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      const { data } = await favoriteApi.getMyFavoritesPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setFavorites(data.items);
      } else {
        setFavorites((prev) => [...prev, ...data.items]);
      }

      setHasMore(data.hasNextPage);
      pageRef.current = pageNum;
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(1);
  }, [fetchFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 1;
    setHasMore(true);
    fetchFavorites(1, true);
  }, [fetchFavorites]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchFavorites(pageRef.current + 1);
  }, [hasMore, loadingMore, loading, fetchFavorites]);

  const handleUnfavorite = useCallback(
    (ticketId: string) => {
      setFavorites((prev) => prev.filter((f) => f.ticketId !== ticketId));
      toggleFavorite(ticketId);
    },
    [toggleFavorite]
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

  const handleCardPress = useCallback(
    (ticketId: string) => {
      navigation.navigate('TicketDetail', { ticketId });
    },
    [navigation]
  );

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FavoriteTicketDto }) => (
      <FavoriteCard
        item={item}
        onUnfavorite={handleUnfavorite}
        onTipsterPress={handleTipsterPress}
        onCardPress={handleCardPress}
      />
    ),
    [handleUnfavorite, handleTipsterPress, handleCardPress]
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      <FlatList
        data={filteredFavorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <MarketRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={DS.colors.green} />
              <Text style={styles.loadingMoreText}>Chargement...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
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

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },

  // Card
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 1,
    borderColor: DS.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.colors.green,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heartButton: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 12,
    lineHeight: 20,
  },

  // Sports
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  sportText: {
    fontSize: 11,
    fontWeight: '600',
    color: DS.colors.green,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.buttonBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: DS.colors.cardBorder,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: DS.colors.greenLight,
  },
  statValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: DS.colors.white,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  priceTextFree: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.green,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.greenLight,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: DS.colors.green,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.white,
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

export default MesFavorisScreen;

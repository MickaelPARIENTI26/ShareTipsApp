import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  marketplaceApi,
  type MarketplaceFilters,
} from '../api/marketplace.api';
import { purchaseApi } from '../api/purchase.api';
import { useAuthStore } from '../store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';
import { useFollowStore } from '../store/follow.store';
import { useWalletStore } from '../store/wallet.store';
import FilterModal from '../components/marketplace/FilterPanel';
import { ErrorBanner } from '../components/common';
import { parseError, getErrorMessage, type AppError } from '../utils/errors';
import type {
  RootStackParamList,
  TicketDto,
  TicketFilterMetaDto,
} from '../types';
import { useTheme, type ThemeColors } from '../theme';

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

function countActiveFilters(filters: MarketplaceFilters): number {
  let count = 0;
  if (filters.sports?.length) count++;
  if (filters.ticketType) count++;
  if (filters.minOdds !== undefined || filters.maxOdds !== undefined) count++;
  if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined)
    count++;
  if (
    filters.minSelections !== undefined ||
    filters.maxSelections !== undefined
  )
    count++;
  return count;
}

// --- Filter bar ---
const FilterBar: React.FC<{
  filters: MarketplaceFilters;
  onFilterChange: (filters: MarketplaceFilters) => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}> = ({ filters, onFilterChange, onOpenFilterModal, activeFilterCount, colors, styles }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterBar}
      style={styles.filterBarScroll}
    >
      {/* Followed only */}
      <TouchableOpacity
        style={[
          styles.chip,
          filters.followedOnly && styles.chipActiveOrange,
        ]}
        onPress={() =>
          onFilterChange({
            ...filters,
            followedOnly: !filters.followedOnly || undefined,
          })
        }
      >
        <Ionicons
          name="people"
          size={13}
          color={filters.followedOnly ? colors.textOnPrimary : colors.textSecondary}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.chipText,
            filters.followedOnly && styles.chipTextActive,
          ]}
        >
          Suivis
        </Text>
      </TouchableOpacity>

      {/* Filter modal trigger */}
      <TouchableOpacity
        style={[styles.chip, activeFilterCount > 0 && styles.chipActive]}
        onPress={onOpenFilterModal}
      >
        <Ionicons
          name="options"
          size={13}
          color={activeFilterCount > 0 ? colors.textOnPrimary : colors.textSecondary}
          style={{ marginRight: 4 }}
        />
        <Text
          style={[
            styles.chipText,
            activeFilterCount > 0 && styles.chipTextActive,
          ]}
        >
          Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- Ticket card (memoized for FlatList performance) ---
const MarketplaceTicketCard = React.memo<{
  ticket: TicketDto;
  isFavorited: boolean;
  isFollowingCreator: boolean;
  isOwnTicket: boolean;
  onToggleFavorite: (ticketId: string) => void;
  onBuy: (ticket: TicketDto) => void;
  onTipsterPress: (creatorId: string, username: string) => void;
  onCardPress: (ticketId: string) => void;
  onFollowCreator: (creatorId: string) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}>(function MarketplaceTicketCard({ ticket, isFavorited, isFollowingCreator, isOwnTicket, onToggleFavorite, onBuy, onTipsterPress, onCardPress, onFollowCreator, colors, styles }) {
  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const matchWord = count === 1 ? 'match' : 'matchs';
  const autoTitle = `${ticket.creatorUsername} – ${count} ${matchWord}`;
  const hasAccess = ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;
  const selWord = count === 1 ? 'sélection' : 'sélections';
  const subtitle = isPrivateLocked
    ? `Payant – ${count} ${selWord}`
    : `${count} ${selWord}`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onCardPress(ticket.id)}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <TouchableOpacity
            onPress={() => onTipsterPress(ticket.creatorId, ticket.creatorUsername)}
          >
            <Text style={styles.creatorName}>@{ticket.creatorUsername}</Text>
          </TouchableOpacity>
          {!isOwnTicket && (
            <TouchableOpacity
              style={[
                styles.followChip,
                isFollowingCreator && styles.followChipActive,
              ]}
              onPress={() => onFollowCreator(ticket.creatorId)}
            >
              <Text
                style={[
                  styles.followChipText,
                  isFollowingCreator && styles.followChipTextActive,
                ]}
              >
                {isFollowingCreator ? 'Suivi' : 'Suivre'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => onToggleFavorite(ticket.id)}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorited ? colors.danger : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Title (auto-generated) */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {autoTitle}
      </Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      {/* Meta */}
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Cote moy.</Text>
          <Text style={styles.metaValueBlue}>{ticket.avgOdds.toFixed(2)}</Text>
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

      {/* Sports badges */}
      <View style={styles.sportRow}>
        {ticket.sports.map((s) => (
          <View key={s} style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>
              {SPORT_LABELS[s] ?? s}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
        {isPrivateLocked ? (
          <View style={styles.payantBadge}>
            <Ionicons name="lock-closed" size={12} color={colors.warning} />
            <Text style={styles.payantBadgeText}>
              Payant · {ticket.priceCredits} cr.
            </Text>
          </View>
        ) : !ticket.isPublic && ticket.isSubscribedToCreator ? (
          <View style={styles.abonneBadge}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.abonneBadgeText}>Abonné</Text>
          </View>
        ) : !ticket.isPublic && ticket.isPurchasedByCurrentUser ? (
          <View style={styles.purchasedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.textOnPrimary} />
            <Text style={styles.purchasedBadgeText}>Acheté</Text>
          </View>
        ) : ticket.priceCredits > 0 ? (
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => onBuy(ticket)}
            activeOpacity={0.7}
          >
            <Ionicons name="cart" size={14} color={colors.textOnPrimary} />
            <Text style={styles.buyBtnText}>
              {ticket.priceCredits} cr.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Gratuit</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// --- Main screen ---
const MarketplaceScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

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

  // Global wallet store
  const setWalletBalance = useWalletStore((s) => s.setBalance);

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMeta, setFilterMeta] = useState<TicketFilterMetaDto | null>(
    null
  );
  const [error, setError] = useState<AppError | null>(null);

  // Fetch filter metadata, user favorites, and followed creators on mount
  useEffect(() => {
    marketplaceApi
      .getFilterMeta()
      .then(({ data }) => setFilterMeta(data))
      .catch(() => {});
    hydrateFavorites();
    if (currentUserId) {
      hydrateFollows(currentUserId);
    }
  }, [currentUserId, hydrateFavorites, hydrateFollows]);

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
      } catch (err) {
        const appError = parseError(err);
        setError(appError);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters]
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
      Alert.alert(
        'Acheter ce ticket',
        `Confirmer l'achat pour ${ticket.priceCredits} crédits ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Acheter',
            onPress: async () => {
              try {
                const { data } = await purchaseApi.purchaseTicket(ticket.id);
                if (data.success) {
                  // Update global wallet balance
                  setWalletBalance(data.newBuyerBalance);
                  Alert.alert(
                    'Achat réussi',
                    `Crédits restants : ${data.newBuyerBalance}`
                  );
                  // Refresh to update purchased status
                  fetchTickets(1);
                } else {
                  Alert.alert('Erreur', data.message ?? 'Achat impossible');
                }
              } catch (err) {
                Alert.alert('Erreur', getErrorMessage(err));
              }
            },
          },
        ]
      );
    },
    [fetchTickets, setWalletBalance]
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
      minConfidence: newFilters.minConfidence,
      maxConfidence: newFilters.maxConfidence,
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

  // Stable callbacks for FilterBar and FilterModal (avoid inline arrow functions)
  const handleOpenFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onOpenFilterModal={handleOpenFilterModal}
        activeFilterCount={countActiveFilters(filters)}
        colors={colors}
        styles={styles}
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
        data={tickets}
        keyExtractor={(item) => item.id}
        extraData={[favoritedIds, followedIds]}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        // Performance optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <MarketplaceTicketCard
            ticket={item}
            isFavorited={favoritedIds.has(item.id)}
            isFollowingCreator={followedIds.has(item.creatorId)}
            isOwnTicket={item.creatorId === currentUserId}
            onToggleFavorite={handleToggleFavorite}
            onBuy={handleBuy}
            onTipsterPress={handleTipsterPress}
            onCardPress={handleCardPress}
            onFollowCreator={handleFollowCreator}
            colors={colors}
            styles={styles}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucun ticket disponible</Text>
            <Text style={styles.emptyHint}>
              Modifiez les filtres pour voir plus de résultats
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ padding: 16 }}
            />
          ) : null
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
        list: {
          padding: 12,
          paddingBottom: 80,
        },

        // Filter bar
        filterBarScroll: {
          flexGrow: 0,
        },
        filterBar: {
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          flexDirection: 'row',
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipActiveOrange: {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
        },
        chipText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chipTextActive: {
          color: colors.textOnPrimary,
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        cardHeaderLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flex: 1,
        },
        creatorName: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
        followChip: {
          backgroundColor: colors.background,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        followChipActive: {
          backgroundColor: colors.primary,
        },
        followChipText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.primary,
        },
        followChipTextActive: {
          color: colors.textOnPrimary,
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
          marginBottom: 10,
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
        sportRow: {
          flexDirection: 'row',
          gap: 6,
          marginBottom: 10,
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
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        dateText: {
          fontSize: 12,
          color: colors.textTertiary,
        },
        buyBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.success,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          gap: 4,
        },
        buyBtnText: {
          color: colors.textOnPrimary,
          fontSize: 13,
          fontWeight: '700',
        },
        freeBadge: {
          backgroundColor: colors.successLight,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        freeBadgeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.success,
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
        purchasedBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
        },
        purchasedBadgeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textOnPrimary,
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

        // Empty
        empty: {
          alignItems: 'center',
          paddingTop: 60,
        },
        emptyText: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.textSecondary,
          marginTop: 12,
        },
        emptyHint: {
          fontSize: 14,
          color: colors.textTertiary,
          marginTop: 4,
        },
      }),
    [colors]
  );

export default MarketplaceScreen;

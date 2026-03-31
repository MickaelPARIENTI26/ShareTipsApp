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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


import { ticketApi } from '../api/ticket.api';
import { DS } from '../theme/designSystem';
import type { RootStackParamList, TicketDto } from '../types';
import { TicketCard } from '../components/marketplace/TicketCard';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DateGroup {
  date: string;
  dateLabel: string;
  tickets: TicketDto[];
}

type FilterType = 'all' | 'pending' | 'win' | 'lose';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === tomorrow.toDateString()) return 'Demain';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function groupByDate(tickets: TicketDto[]): DateGroup[] {
  const sorted = [...tickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groups = new Map<string, TicketDto[]>();
  for (const ticket of sorted) {
    const dateKey = new Date(ticket.createdAt).toDateString();
    const list = groups.get(dateKey) ?? [];
    list.push(ticket);
    groups.set(dateKey, list);
  }

  return Array.from(groups.entries()).map(([dateKey, groupTickets]) => ({
    date: dateKey,
    dateLabel: formatDateHeader(groupTickets[0].createdAt),
    tickets: groupTickets,
  }));
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}


// No-op handlers for TicketCard (own tickets don't need buy/follow)
const noop = () => {};
const noopId = (_id: string) => {};
const noopTicket = (_t: TicketDto) => {};
const noopTipster = (_id: string, _name: string) => {};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const PAGE_SIZE = 15;

const MyTicketsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Data states
  const [allTickets, setAllTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Fetch tickets
  const fetchTickets = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      setError(null);
      const { data } = await ticketApi.getMyTicketsPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setAllTickets(data.items);
      } else {
        setAllTickets(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch {
      setError('Impossible de charger vos tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchTickets(1, true);
  }, [fetchTickets]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchTickets(page + 1);
  }, [hasMore, loadingMore, loading, page, fetchTickets]);

  // Apply filters
  const filteredTickets = useMemo(() => {
    switch (selectedFilter) {
      case 'pending':
        return allTickets.filter(t => t.result === 'Pending');
      case 'win':
        return allTickets.filter(t => t.result === 'Win');
      case 'lose':
        return allTickets.filter(t => t.result === 'Lose');
      default:
        return allTickets;
    }
  }, [allTickets, selectedFilter]);

  const groupedTickets = useMemo(
    () => groupByDate(filteredTickets),
    [filteredTickets]
  );

  const handleTicketPress = useCallback(
    (ticketId: string) => {
      navigation.navigate('TicketDetail', { ticketId });
    },
    [navigation]
  );

  // ── Render Filters ───────────────────────────────────────────
  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {/* "Tous" filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'all' && styles.filterChipActive,
        ]}
        onPress={() => setSelectedFilter('all')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="receipt-outline"
          size={14}
          color={selectedFilter === 'all' ? DS.colors.white : '#8A9A8F'}
        />
        <Text style={[
          styles.filterLabel,
          selectedFilter === 'all' && styles.filterLabelActive,
        ]}>
          Tous
        </Text>
      </TouchableOpacity>

      {/* "En cours" filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'pending' && styles.filterChipActive,
        ]}
        onPress={() => setSelectedFilter('pending')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="time-outline"
          size={14}
          color={selectedFilter === 'pending' ? DS.colors.white : '#8A9A8F'}
        />
        <Text style={[
          styles.filterLabel,
          selectedFilter === 'pending' && styles.filterLabelActive,
        ]}>
          En cours
        </Text>
      </TouchableOpacity>

      {/* "Gagnés" filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'win' && styles.filterChipActive,
        ]}
        onPress={() => setSelectedFilter('win')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={14}
          color={selectedFilter === 'win' ? DS.colors.white : '#8A9A8F'}
        />
        <Text style={[
          styles.filterLabel,
          selectedFilter === 'win' && styles.filterLabelActive,
        ]}>
          Gagnés
        </Text>
      </TouchableOpacity>

      {/* "Perdus" filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'lose' && styles.filterChipActive,
        ]}
        onPress={() => setSelectedFilter('lose')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="close-circle-outline"
          size={14}
          color={selectedFilter === 'lose' ? DS.colors.white : '#8A9A8F'}
        />
        <Text style={[
          styles.filterLabel,
          selectedFilter === 'lose' && styles.filterLabelActive,
        ]}>
          Perdus
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Render Date Header ───────────────────────────────────────
  const renderDateHeader = (dateLabel: string) => (
    <View style={styles.dateSection}>
      <Ionicons name="calendar-outline" size={14} color={DS.colors.greenLight} />
      <Text style={styles.dateText}>{dateLabel}</Text>
      <Ionicons name="chevron-forward" size={14} color={DS.colors.greenLight} />
    </View>
  );

  // ── Loading State ─────────────────────────────────────────────
  if (loading && allTickets.length === 0) {
    return (
      <View style={styles.container}>
        {renderFilters()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.colors.green} />
        </View>
      </View>
    );
  }

  // ── Error State ───────────────────────────────────────────────
  if (error && allTickets.length === 0) {
    return (
      <View style={styles.container}>
        {renderFilters()}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty State ───────────────────────────────────────────────
  if (filteredTickets.length === 0) {
    return (
      <View style={styles.container}>
        {renderFilters()}
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color="#8A9A8F" />
          <Text style={styles.emptyText}>
            {selectedFilter === 'all'
              ? 'Aucun ticket créé'
              : `Aucun ticket ${selectedFilter === 'pending' ? 'en cours' : selectedFilter === 'win' ? 'gagné' : 'perdu'}`}
          </Text>
          {selectedFilter !== 'all' && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={styles.resetBtnText}>Voir tous les tickets</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Main Content ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {renderFilters()}
      <FlatList
        data={groupedTickets}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
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
        renderItem={({ item: group }) => (
          <View>
            {renderDateHeader(group.dateLabel)}
            {group.tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                tipsterStats={null}
                tipsterRanking={null}
                isFavorited={false}
                isFollowingCreator={false}
                isOwnTicket={true}
                hideTipsterHeader={true}
                onToggleFavorite={noopId}
                onBuy={noopTicket}
                onShare={noopTicket}
                onTipsterPress={noopTipster}
                onFollowCreator={noopId}
                onCardPress={(t) => handleTicketPress(t.id)}
              />
            ))}
          </View>
        )}
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
  filtersContainer: {
    maxHeight: 50,
    marginTop: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A9A8F',
  },
  filterLabelActive: {
    color: DS.colors.white,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: DS.colors.greenLight,
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: '#8A9A8F',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: DS.colors.green,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: DS.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  resetBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: DS.colors.green,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  resetBtnText: {
    color: DS.colors.green,
    fontSize: 15,
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#8A9A8F',
  },
});

export default MyTicketsScreen;

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

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
};

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

const STATUS_LABELS: Record<string, string> = {
  Open: 'Ouvert',
  Locked: 'Verrouillé',
  Finished: 'Terminé',
};

const RESULT_LABELS: Record<string, string> = {
  Pending: 'En cours',
  Win: 'Gagné',
  Lose: 'Perdu',
};

// ═══════════════════════════════════════════════════════════════
// TICKET CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface TicketCardInlineProps {
  ticket: TicketDto;
  onPress: () => void;
}

const TicketCardInline: React.FC<TicketCardInlineProps> = ({ ticket, onPress }) => {
  const selectionCount = ticket.selectionCount ?? ticket.selections?.length ?? 0;

  const resultColor = useMemo(() => {
    switch (ticket.result) {
      case 'Win': return '#22C55E';
      case 'Lose': return '#EF4444';
      default: return DS.colors.textSecondary;
    }
  }, [ticket.result]);

  const resultIcon = useMemo((): keyof typeof Ionicons.glyphMap => {
    switch (ticket.result) {
      case 'Win': return 'checkmark-circle';
      case 'Lose': return 'close-circle';
      default: return 'time-outline';
    }
  }, [ticket.result]);

  return (
    <TouchableOpacity
      style={cardStyles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header: Result badge + Time */}
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          <View style={[cardStyles.resultBar, { backgroundColor: resultColor }]} />
          <View style={[cardStyles.resultBadge, { backgroundColor: `${resultColor}20` }]}>
            <Ionicons name={resultIcon} size={12} color={resultColor} />
            <Text style={[cardStyles.resultText, { color: resultColor }]}>
              {RESULT_LABELS[ticket.result] ?? ticket.result}
            </Text>
          </View>
        </View>
        <View style={cardStyles.timeContainer}>
          <Ionicons name="time-outline" size={12} color="#8A9A8F" />
          <Text style={cardStyles.timeText}>{formatTime(ticket.createdAt)}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={cardStyles.title} numberOfLines={2}>
        {ticket.title}
      </Text>

      {/* Sports badges */}
      <View style={cardStyles.sportsRow}>
        {ticket.sports.map((sport) => (
          <View key={sport} style={cardStyles.sportBadge}>
            <Ionicons
              name={SPORT_ICONS[sport] ?? 'trophy'}
              size={12}
              color={DS.colors.green}
            />
            <Text style={cardStyles.sportText}>{SPORT_LABELS[sport] ?? sport}</Text>
          </View>
        ))}
      </View>

      {/* Stats row */}
      <View style={cardStyles.statsRow}>
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statLabel}>Sélections</Text>
          <Text style={cardStyles.statValue}>{selectionCount}</Text>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statLabel}>Cote moy.</Text>
          <Text style={cardStyles.statValueHighlight}>{ticket.avgOdds.toFixed(2)}</Text>
        </View>
        <View style={cardStyles.statDivider} />
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statLabel}>Statut</Text>
          <Text style={cardStyles.statValue}>{STATUS_LABELS[ticket.status] ?? ticket.status}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={cardStyles.footer}>
        <View style={cardStyles.visibilityBadge}>
          <Ionicons
            name={ticket.isPublic ? 'earth-outline' : 'lock-closed-outline'}
            size={12}
            color={ticket.isPublic ? DS.colors.green : '#F59E0B'}
          />
          <Text style={[
            cardStyles.visibilityText,
            { color: ticket.isPublic ? DS.colors.green : '#F59E0B' }
          ]}>
            {ticket.isPublic ? 'Public' : `${ticket.priceEur.toFixed(2)} €`}
          </Text>
        </View>
        <View style={cardStyles.detailsLink}>
          <Text style={cardStyles.detailsText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={12} color={DS.colors.green} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: DS.colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A9A8F',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
    marginBottom: 12,
    lineHeight: 20,
  },
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
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sportText: {
    fontSize: 11,
    fontWeight: '500',
    color: DS.colors.greenLight,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F1611',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1E2A22',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#8A9A8F',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
  },
  statValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.green,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E2A22',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.green,
  },
});

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
              <TicketCardInline
                key={ticket.id}
                ticket={ticket}
                onPress={() => handleTicketPress(ticket.id)}
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

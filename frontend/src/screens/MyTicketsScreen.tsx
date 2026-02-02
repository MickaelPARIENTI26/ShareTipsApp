import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

import { ticketApi } from '../api/ticket.api';
import type { TicketDto } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const PAGE_SIZE = 15;

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TicketCard: React.FC<{
  ticket: TicketDto;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
  onPress: () => void;
}> = ({ ticket, colors, styles, onPress }) => {
  const statusColors: Record<string, string> = {
    Open: colors.success,
    Locked: colors.warning,
    Finished: colors.textSecondary,
  };

  const statusLabels: Record<string, string> = {
    Open: 'Ouvert',
    Locked: 'Verrouillé',
    Finished: 'Terminé',
  };

  const resultColors: Record<string, string> = {
    Pending: colors.textSecondary,
    Win: colors.success,
    Lose: colors.danger,
  };

  const resultLabels: Record<string, string> = {
    Pending: 'En cours',
    Win: 'Validé',
    Lose: 'Non validé',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {ticket.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[ticket.status] ?? colors.textSecondary },
          ]}
        >
          <Text style={styles.statusText}>{statusLabels[ticket.status] ?? ticket.status}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Sélections</Text>
          <Text style={styles.metaValue}>{ticket.selections.length}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Cote moy.</Text>
          <Text style={styles.metaValueHighlight}>
            {ticket.avgOdds.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Confiance</Text>
          <Text style={styles.metaValue}>{ticket.confidenceIndex}/10</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Sports</Text>
          <Text style={styles.metaValue}>
            {ticket.sports
              .map((s) => SPORT_LABELS[s] ?? s)
              .join(', ')}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Ionicons
            name={ticket.isPublic ? 'earth' : 'lock-closed'}
            size={12}
            color={ticket.isPublic ? colors.primary : colors.warning}
          />
          <Text
            style={[
              styles.visibilityText,
              { color: ticket.isPublic ? colors.primary : colors.warning },
            ]}
          >
            {ticket.isPublic ? 'Public' : `Privé · ${ticket.priceCredits} cr.`}
          </Text>
        </View>
        <View
          style={[
            styles.resultBadge,
            {
              backgroundColor:
                (resultColors[ticket.result] ?? colors.textSecondary) + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.resultText,
              { color: resultColors[ticket.result] ?? colors.textSecondary },
            ]}
          >
            {resultLabels[ticket.result] ?? ticket.result}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
    </TouchableOpacity>
  );
};

const MyTicketsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTickets = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      setError(null);
      const { data } = await ticketApi.getMyTicketsPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setTickets(data.items);
      } else {
        setTickets(prev => [...prev, ...data.items]);
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

  if (loading && tickets.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Aucun ticket créé</Text>
        <Text style={styles.emptyHint}>
          Créez votre premier ticket depuis le coupon
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tickets}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <TicketCard
          ticket={item}
          colors={colors}
          styles={styles}
          onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
        />
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
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
          padding: 24,
        },
        list: {
          padding: 12,
          paddingBottom: 24,
          backgroundColor: colors.background,
        },
        errorText: {
          color: colors.danger,
          fontSize: 15,
          marginTop: 12,
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
        loadingMore: {
          paddingVertical: 16,
          alignItems: 'center',
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
          marginBottom: 10,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
          marginRight: 8,
        },
        statusBadge: {
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        statusText: {
          color: colors.textOnPrimary,
          fontSize: 11,
          fontWeight: '700',
        },
        cardMeta: {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 2,
        },
        metaLabel: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        metaValue: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.text,
        },
        metaValueHighlight: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.primary,
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        footerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        visibilityText: {
          fontSize: 12,
          fontWeight: '600',
        },
        resultBadge: {
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        resultText: {
          fontSize: 11,
          fontWeight: '700',
        },
        dateText: {
          fontSize: 11,
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

export default MyTicketsScreen;

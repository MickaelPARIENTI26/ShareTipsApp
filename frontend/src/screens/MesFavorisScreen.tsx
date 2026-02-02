import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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

import { favoriteApi } from '../api/favorite.api';
import { useFavoriteStore } from '../store/favorite.store';
import type { RootStackParamList, FavoriteTicketDto } from '../types';
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FavoriteCard: React.FC<{
  item: FavoriteTicketDto;
  onUnfavorite: (ticketId: string) => void;
  onTipsterPress: (creatorId: string, username: string) => void;
  onCardPress: (ticketId: string) => void;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({ item, onUnfavorite, onTipsterPress, onCardPress, styles, colors }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.7}
    onPress={() => onCardPress(item.ticketId)}
  >
    <View style={styles.cardHeader}>
      <TouchableOpacity
        onPress={() => onTipsterPress(item.creatorId, item.creatorUsername)}
      >
        <Text style={styles.creatorName}>@{item.creatorUsername}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onUnfavorite(item.ticketId)}>
        <Ionicons name="heart" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>

    <Text style={styles.cardTitle} numberOfLines={2}>
      {item.ticketTitle}
    </Text>

    <View style={styles.cardMeta}>
      <View style={styles.metaItem}>
        <Text style={styles.metaLabel}>Cote moy.</Text>
        <Text style={styles.metaValueBlue}>{item.avgOdds.toFixed(2)}</Text>
      </View>
      <View style={styles.metaItem}>
        <Text style={styles.metaLabel}>Confiance</Text>
        <Text style={styles.metaValue}>{item.confidenceIndex}/10</Text>
      </View>
      <View style={styles.metaItem}>
        <Text style={styles.metaLabel}>Statut</Text>
        <Text style={styles.metaValue}>{item.status}</Text>
      </View>
    </View>

    <View style={styles.cardFooter}>
      <View style={styles.sportRow}>
        {item.sports.map((s) => (
          <View key={s} style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>
              {SPORT_LABELS[s] ?? s}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.dateText}>
        {formatDate(item.favoritedAt)}
      </Text>
    </View>
  </TouchableOpacity>
);

const MesFavorisScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Global favorite store for sync across screens
  const toggleFavorite = useFavoriteStore((s) => s.toggle);

  const [favorites, setFavorites] = useState<FavoriteTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);

  const fetchFavorites = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      const { data } = await favoriteApi.getMyFavoritesPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setFavorites(data.items);
      } else {
        setFavorites(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasNextPage);
      setPage(pageNum);
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
    setPage(1);
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
      // Remove from local list immediately
      setFavorites((prev) => prev.filter((f) => f.ticketId !== ticketId));
      // Use global store toggle (handles API call + sync across screens)
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

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <FavoriteCard
          item={item}
          onUnfavorite={handleUnfavorite}
          onTipsterPress={handleTipsterPress}
          onCardPress={handleCardPress}
          styles={styles}
          colors={colors}
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
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun favori</Text>
          <Text style={styles.emptyHint}>
            Ajoutez des tickets en favoris depuis le marché
          </Text>
        </View>
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
        },
        list: {
          padding: 12,
          paddingBottom: 80,
          backgroundColor: colors.background,
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
          marginBottom: 8,
        },
        creatorName: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
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
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
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
        dateText: {
          fontSize: 11,
          color: colors.textTertiary,
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

export default MesFavorisScreen;

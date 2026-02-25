import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { favoriteApi } from '../api/favorite.api';
import { useFavoriteStore } from '../store/favorite.store';
import type { RootStackParamList, FavoriteTicketDto } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette, size } from '../theme';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="heart-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
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
          padding: spacing.sm,
          paddingBottom: size.listPaddingBottom.sm,
          backgroundColor: colors.background,
        },
        loadingMore: {
          paddingVertical: spacing.md,
          alignItems: 'center',
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xs,
        },
        creatorName: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
        cardTitle: {
          ...typography.bodyLarge,
          fontWeight: '700',
          color: colors.text,
          marginBottom: spacing.sm,
        },
        cardMeta: {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginBottom: spacing.sm,
        },
        metaItem: {
          flex: 1,
          alignItems: 'center',
        },
        metaLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: 2,
        },
        metaValue: {
          ...typography.caption,
          fontWeight: '700',
          color: colors.text,
        },
        metaValueBlue: {
          ...typography.bodyLarge,
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
          gap: spacing.xs,
        },
        sportBadge: {
          backgroundColor: colors.background,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.xs,
          paddingVertical: 3,
        },
        sportBadgeText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        dateText: {
          ...typography.caption,
          color: colors.textTertiary,
        },

        // Empty state
        emptyContainer: {
          alignItems: 'center',
          paddingTop: spacing.xxl,
          paddingHorizontal: spacing.lg,
        },
        emptyIconWrapper: {
          width: 80,
          height: 80,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
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
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        emptyHint: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors]
  );

export default MesFavorisScreen;

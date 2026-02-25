import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { purchaseApi } from '../api/purchase.api';
import type { RootStackParamList, PurchaseDto } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette, size } from '../theme';

const PAGE_SIZE = 15;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PurchaseCard: React.FC<{
  item: PurchaseDto;
  onSellerPress: (sellerId: string, username: string) => void;
  onCardPress: (ticketId: string) => void;
  styles: ReturnType<typeof useStyles>;
}> = ({ item, onSellerPress, onCardPress, styles }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.7}
    onPress={() => onCardPress(item.ticketId)}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.ticketTitle}
      </Text>
    </View>

    <View style={styles.cardMeta}>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Vendeur</Text>
        <TouchableOpacity
          onPress={() => onSellerPress(item.sellerId, item.sellerUsername)}
        >
          <Text style={styles.sellerLink}>@{item.sellerUsername}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Prix payé</Text>
        <Text style={styles.metaValue}>{item.priceEur.toFixed(2)} €</Text>
      </View>
    </View>

    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
  </TouchableOpacity>
);

const MesAchatsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPurchases = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      const { data } = await purchaseApi.getMyPurchasesPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setPurchases(data.items);
      } else {
        setPurchases(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases(1);
  }, [fetchPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchPurchases(1, true);
  }, [fetchPurchases]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchPurchases(page + 1);
  }, [hasMore, loadingMore, loading, page, fetchPurchases]);

  const handleSellerPress = useCallback(
    (sellerId: string, username: string) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: sellerId,
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

  if (loading && purchases.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={purchases}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <PurchaseCard item={item} onSellerPress={handleSellerPress} onCardPress={handleCardPress} styles={styles} />
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
            <Ionicons name="cart-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aucun achat</Text>
          <Text style={styles.emptyHint}>
            Achetez des tickets depuis le marché
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
          marginBottom: spacing.sm,
        },
        cardTitle: {
          ...typography.bodyLarge,
          fontWeight: '700',
          color: colors.text,
        },
        cardMeta: {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginBottom: spacing.xs,
        },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 3,
        },
        metaLabel: {
          ...typography.body,
          color: colors.textSecondary,
        },
        metaValue: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        sellerLink: {
          ...typography.body,
          fontWeight: '700',
          color: colors.primary,
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

export default MesAchatsScreen;

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

import { purchaseApi } from '../api/purchase.api';
import type { RootStackParamList, PurchaseDto } from '../types';
import { useTheme, type ThemeColors } from '../theme';

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
        <Text style={styles.metaValue}>{item.priceCredits} crédits</Text>
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun achat</Text>
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
          marginBottom: 10,
        },
        cardTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        },
        cardMeta: {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          padding: 10,
          marginBottom: 8,
        },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 3,
        },
        metaLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        metaValue: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.text,
        },
        sellerLink: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
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

export default MesAchatsScreen;

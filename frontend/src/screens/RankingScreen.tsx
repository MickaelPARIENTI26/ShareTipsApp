import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../theme';
import {
  rankingApi,
  type RankingEntryDto,
  type RankingPeriod,
} from '../api/ranking.api';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: 'daily', label: 'Jour' },
  { key: 'weekly', label: 'Semaine' },
  { key: 'monthly', label: 'Mois' },
];

const RankingScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation<NavigationProp>();

  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [rankings, setRankings] = useState<RankingEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await rankingApi.getRanking(period, 100);
      setRankings(response.data.rankings);
    } catch (err) {
      setError('Impossible de charger le classement');
      console.error('Error fetching rankings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleRefresh = useCallback(() => {
    fetchRankings(true);
  }, [fetchRankings]);

  const handleTipsterPress = useCallback(
    (userId: string, username: string) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: userId,
        tipsterUsername: username,
      });
    },
    [navigation]
  );

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: '#FFD700' }; // Gold
    if (rank === 2) return { backgroundColor: '#C0C0C0' }; // Silver
    if (rank === 3) return { backgroundColor: '#CD7F32' }; // Bronze
    return { backgroundColor: colors.surfaceSecondary };
  };

  const getRankTextStyle = (rank: number) => {
    if (rank <= 3) return { color: '#000' };
    return { color: colors.textSecondary };
  };

  const renderItem = useCallback(
    ({ item }: { item: RankingEntryDto }) => (
      <TouchableOpacity
        style={styles.rankingItem}
        onPress={() => handleTipsterPress(item.userId, item.username)}
        activeOpacity={0.7}
      >
        <View style={[styles.rankBadge, getRankBadgeStyle(item.rank)]}>
          <Text style={[styles.rankText, getRankTextStyle(item.rank)]}>
            {item.rank}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            @{item.username}
          </Text>
          <Text style={styles.ticketCount}>
            {item.totalTickets} tickets • {item.winCount}V/{item.loseCount}NV
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: item.roi >= 0 ? colors.success : colors.danger },
              ]}
            >
              {item.roi >= 0 ? '+' : ''}
              {item.roi.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>ROI</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.winRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Taux</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.avgOdds.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Cote</Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    ),
    [colors, styles, handleTipsterPress]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.disclaimerText}>
          Les performances passées ne garantissent pas les résultats futurs.
        </Text>
      </View>

      <View style={styles.periodSelector}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.periodButton,
              period === p.key && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === p.key && styles.periodButtonTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 0.15 }]}>#</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.4 }]}>Tipster</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.45, textAlign: 'right' }]}>
          Stats
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Aucun classement disponible</Text>
        <Text style={styles.emptySubtext}>
          Les classements apparaîtront une fois que des tickets seront validés
        </Text>
      </View>
    );
  };

  if (loading && rankings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && rankings.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRankings()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rankings}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={rankings.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
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
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: 20,
        },
        errorText: {
          fontSize: 16,
          color: colors.danger,
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 20,
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        },
        retryButtonText: {
          color: '#fff',
          fontSize: 16,
          fontWeight: '600',
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        },
        disclaimerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
          gap: 8,
        },
        disclaimerText: {
          flex: 1,
          fontSize: 11,
          color: colors.textTertiary,
          lineHeight: 15,
        },
        periodSelector: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        },
        periodButton: {
          flex: 1,
          paddingVertical: 10,
          alignItems: 'center',
          borderRadius: 8,
        },
        periodButtonActive: {
          backgroundColor: colors.primary,
        },
        periodButtonText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        periodButtonTextActive: {
          color: '#fff',
        },
        tableHeader: {
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        tableHeaderText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textTertiary,
          textTransform: 'uppercase',
        },
        rankingItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          marginHorizontal: 16,
          marginVertical: 4,
          padding: 12,
          borderRadius: 12,
        },
        rankBadge: {
          width: 32,
          height: 32,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        rankText: {
          fontSize: 14,
          fontWeight: '700',
        },
        userInfo: {
          flex: 1,
          marginRight: 12,
        },
        username: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        ticketCount: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        statsContainer: {
          flexDirection: 'row',
          gap: 16,
          marginRight: 8,
        },
        statItem: {
          alignItems: 'center',
        },
        statValue: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
        statLabel: {
          fontSize: 10,
          color: colors.textTertiary,
          marginTop: 2,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        emptyList: {
          flex: 1,
        },
        emptyText: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginTop: 16,
        },
        emptySubtext: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 8,
        },
      }),
    [colors]
  );

export default RankingScreen;

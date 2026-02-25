import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors, spacing, radius, typography, size, palette } from '../theme';
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
      if (__DEV__) console.error('Error fetching rankings:', err);
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

  const getRankBadgeStyle = useCallback((rank: number) => {
    if (rank === 1) return { backgroundColor: palette.medal.gold };
    if (rank === 2) return { backgroundColor: palette.medal.silver };
    if (rank === 3) return { backgroundColor: palette.medal.bronze };
    return { backgroundColor: colors.surfaceSecondary };
  }, [colors.surfaceSecondary]);

  const getRankTextStyle = useCallback((rank: number) => {
    if (rank <= 3) return { color: palette.black };
    return { color: colors.textSecondary };
  }, [colors.textSecondary]);

  const renderItem = useCallback(
    ({ item }: { item: RankingEntryDto }) => (
      <TouchableOpacity
        testID="ranking-row"
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
    [colors, styles, handleTipsterPress, getRankBadgeStyle, getRankTextStyle]
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
            testID={`period-${p.key}${period === p.key ? '-active' : ''}`}
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
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="trophy-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Aucun classement disponible</Text>
        <Text style={styles.emptyHint}>
          Les classements apparaîtront une fois que des tickets seront validés
        </Text>
      </View>
    );
  };

  if (loading && rankings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error && rankings.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconWrapper}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        </View>
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRankings()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View testID="ranking-screen" style={styles.container}>
      <FlatList
        testID="ranking-list"
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
        // Error state
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: spacing.lg,
        },
        errorIconWrapper: {
          width: size.avatar['2xl'],
          height: size.avatar['2xl'],
          borderRadius: radius.full,
          backgroundColor: colors.dangerBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          ...Platform.select({
            ios: {
              shadowColor: colors.danger,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        errorTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        errorText: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.lg,
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        retryButtonText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        header: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
        },
        disclaimerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          marginBottom: spacing.sm,
          gap: spacing.xs,
        },
        disclaimerText: {
          flex: 1,
          ...typography.caption,
          color: colors.textTertiary,
          lineHeight: 15,
        },
        periodSelector: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.xxs,
          marginBottom: spacing.md,
        },
        periodButton: {
          flex: 1,
          paddingVertical: spacing.sm,
          alignItems: 'center',
          borderRadius: radius.md,
        },
        periodButtonActive: {
          backgroundColor: colors.primary,
        },
        periodButtonText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        periodButtonTextActive: {
          color: colors.textOnPrimary,
        },
        tableHeader: {
          flexDirection: 'row',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        tableHeaderText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textTertiary,
          textTransform: 'uppercase',
        },
        rankingItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          marginHorizontal: spacing.md,
          marginVertical: spacing.xxs,
          padding: spacing.sm,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: palette.opacity[8],
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        rankBadge: {
          width: size.badge.rank,
          height: size.badge.rank,
          borderRadius: radius.full,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.sm,
        },
        rankText: {
          ...typography.body,
          fontWeight: '700',
        },
        userInfo: {
          flex: 1,
          marginRight: spacing.sm,
        },
        username: {
          ...typography.bodyLarge,
          fontWeight: '600',
          color: colors.text,
        },
        ticketCount: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xxs,
        },
        statsContainer: {
          flexDirection: 'row',
          gap: spacing.md,
          marginRight: spacing.xs,
        },
        statItem: {
          alignItems: 'center',
        },
        statValue: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        statLabel: {
          ...typography.badge,
          color: colors.textTertiary,
          marginTop: spacing.xxs,
        },
        // Empty state
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
        },
        emptyList: {
          flex: 1,
        },
        emptyIconWrapper: {
          width: size.avatar['2xl'],
          height: size.avatar['2xl'],
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

export default RankingScreen;

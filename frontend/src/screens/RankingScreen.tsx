import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DS } from '../theme/designSystem';
import { palette } from '../theme/colors';
import { PodiumCard, RankCard } from '../components/ranking';
import {
  rankingApi,
  type RankingEntryDto,
  type RankingPeriod,
} from '../api/ranking.api';
import { useAuthStore } from '../store/auth.store';
import type { RootStackParamList } from '../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERIODS: { key: RankingPeriod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'daily', label: 'Jour', icon: 'today' },
  { key: 'weekly', label: 'Semaine', icon: 'calendar' },
  { key: 'monthly', label: 'Mois', icon: 'calendar-outline' },
];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Period Filter Chips
 */
const PeriodFilter: React.FC<{
  period: RankingPeriod;
  onPeriodChange: (period: RankingPeriod) => void;
}> = ({ period, onPeriodChange }) => (
  <View style={styles.periodContainer}>
    {PERIODS.map((p) => (
      <TouchableOpacity
        key={p.key}
        style={[
          styles.periodChip,
          period === p.key && styles.periodChipActive,
        ]}
        onPress={() => onPeriodChange(p.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={p.icon}
          size={14}
          color={period === p.key ? DS.colors.white : DS.colors.textSecondary}
        />
        <Text
          style={[
            styles.periodChipText,
            period === p.key && styles.periodChipTextActive,
          ]}
        >
          {p.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

/**
 * Podium Section with top 3
 */
const PodiumSection: React.FC<{
  top3: RankingEntryDto[];
  onUserPress: (userId: string, username: string) => void;
}> = ({ top3, onUserPress }) => {
  if (top3.length === 0) return null;

  // Reorder: 2nd, 1st, 3rd for visual layout
  const rank2 = top3.find((r) => r.rank === 2);
  const rank1 = top3.find((r) => r.rank === 1);
  const rank3 = top3.find((r) => r.rank === 3);

  return (
    <View style={styles.podiumContainer}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(45, 140, 78, 0.08)', 'transparent']}
        style={styles.podiumGradient}
      />

      {/* Podium Cards */}
      <View style={styles.podiumCards}>
        {/* 2nd Place */}
        {rank2 ? (
          <PodiumCard
            rank={2}
            username={rank2.username}
            userId={rank2.userId}
            totalTickets={rank2.totalTickets}
            winRate={rank2.winRate}
            roi={rank2.roi}
            avgOdds={rank2.avgOdds}
            onPress={onUserPress}
            animationDelay={100}
          />
        ) : (
          <EmptyPodiumSlot rank={2} />
        )}

        {/* 1st Place (Champion) */}
        {rank1 ? (
          <PodiumCard
            rank={1}
            username={rank1.username}
            userId={rank1.userId}
            totalTickets={rank1.totalTickets}
            winRate={rank1.winRate}
            roi={rank1.roi}
            avgOdds={rank1.avgOdds}
            onPress={onUserPress}
            animationDelay={0}
          />
        ) : (
          <EmptyPodiumSlot rank={1} />
        )}

        {/* 3rd Place */}
        {rank3 ? (
          <PodiumCard
            rank={3}
            username={rank3.username}
            userId={rank3.userId}
            totalTickets={rank3.totalTickets}
            winRate={rank3.winRate}
            roi={rank3.roi}
            avgOdds={rank3.avgOdds}
            onPress={onUserPress}
            animationDelay={200}
          />
        ) : (
          <EmptyPodiumSlot rank={3} />
        )}
      </View>

      {/* Podium Base Visual */}
      <View style={styles.podiumBase}>
        <View style={[styles.podiumStep, styles.podiumStep2]} />
        <View style={[styles.podiumStep, styles.podiumStep1]} />
        <View style={[styles.podiumStep, styles.podiumStep3]} />
      </View>
    </View>
  );
};

/**
 * Empty Podium Slot
 */
const EmptyPodiumSlot: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const colors = {
    1: palette.medal.gold,
    2: palette.medal.silver,
    3: palette.medal.bronze,
  };

  return (
    <View style={[styles.emptySlot, rank === 1 && styles.emptySlotChampion]}>
      <View style={[styles.emptySlotIcon, { borderColor: colors[rank] }]}>
        <Ionicons name="person-add-outline" size={24} color={colors[rank]} />
      </View>
      <Text style={styles.emptySlotText}>Place #{rank}</Text>
      <Text style={styles.emptySlotHint}>En attente</Text>
    </View>
  );
};

/**
 * Separator between podium and rest
 */
const RankingSeparator: React.FC = () => (
  <View style={styles.separatorContainer}>
    <LinearGradient
      colors={[
        'rgba(255, 215, 0, 0.3)',
        'rgba(192, 192, 192, 0.3)',
        'rgba(205, 127, 50, 0.3)',
        'transparent',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.separatorGradient}
    />
    <View style={styles.separatorContent}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>Classement</Text>
      <View style={styles.separatorLine} />
    </View>
  </View>
);

/**
 * Loading State
 */
const LoadingState: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingIcon, { opacity: pulseAnim }]}>
        <Ionicons name="trophy" size={48} color={palette.medal.gold} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Chargement du classement</Text>
      <Text style={styles.loadingSubtitle}>Calcul des positions...</Text>
    </View>
  );
};

/**
 * Empty State
 */
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons name="trophy-outline" size={48} color={DS.colors.textSecondary} />
    </View>
    <Text style={styles.emptyTitle}>Aucun classement</Text>
    <Text style={styles.emptySubtitle}>
      Les classements apparaîtront une fois que des tickets seront validés
    </Text>
  </View>
);

/**
 * Error State
 */
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.errorContainer}>
    <View style={styles.errorIcon}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
    </View>
    <Text style={styles.errorTitle}>Erreur</Text>
    <Text style={styles.errorSubtitle}>Impossible de charger le classement</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Réessayer</Text>
    </TouchableOpacity>
  </View>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const RankingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUserId = useAuthStore((s) => s.user?.id);

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

  const handleUserPress = useCallback(
    (userId: string, username: string) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: userId,
        tipsterUsername: username,
      });
    },
    [navigation]
  );

  // Separate top 3 from rest
  const top3 = rankings.filter((r) => r.rank <= 3);
  const restRankings = rankings.filter((r) => r.rank > 3);

  // Define renderItem BEFORE any conditional returns to avoid hook order issues
  const renderItem = useCallback(
    ({ item, index }: { item: RankingEntryDto; index: number }) => (
      <RankCard
        rank={item.rank}
        username={item.username}
        userId={item.userId}
        totalTickets={item.totalTickets}
        winCount={item.winCount}
        loseCount={item.loseCount}
        winRate={item.winRate}
        roi={item.roi}
        avgOdds={item.avgOdds}
        isCurrentUser={item.userId === currentUserId}
        onPress={handleUserPress}
        animationDelay={300 + index * 50}
      />
    ),
    [currentUserId, handleUserPress]
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────

  if (loading && rankings.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  if (error && rankings.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorState onRetry={() => fetchRankings()} />
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle-outline" size={14} color={DS.colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          Les performances passées ne garantissent pas les résultats futurs.
        </Text>
      </View>

      {/* Period Filter */}
      <PeriodFilter period={period} onPeriodChange={setPeriod} />

      {/* Podium Section */}
      <PodiumSection top3={top3} onUserPress={handleUserPress} />

      {/* Separator */}
      {restRankings.length > 0 && <RankingSeparator />}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={restRankings}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={top3.length === 0 ? <EmptyState /> : null}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={DS.colors.green}
          />
        }
        showsVerticalScrollIndicator={false}
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
  listContent: {
    paddingBottom: 120,
  },

  // Disclaimer
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: DS.colors.textSecondary,
    lineHeight: 15,
  },

  // Period Filter
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1C2B21',
    gap: 6,
  },
  periodChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.textSecondary,
  },
  periodChipTextActive: {
    color: DS.colors.white,
  },

  // Podium
  podiumContainer: {
    position: 'relative',
    marginTop: 16,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 8,
  },
  podiumGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  podiumCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
  },
  podiumBase: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  podiumStep: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  podiumStep1: {
    width: 60,
    height: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  podiumStep2: {
    width: 50,
    height: 16,
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
  },
  podiumStep3: {
    width: 50,
    height: 12,
    backgroundColor: 'rgba(205, 127, 50, 0.3)',
  },

  // Empty Podium Slot
  emptySlot: {
    alignItems: 'center',
    width: 110,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    borderStyle: 'dashed',
    backgroundColor: DS.colors.cardBg,
  },
  emptySlotChampion: {
    width: 130,
    marginTop: -20,
  },
  emptySlotIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptySlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  emptySlotHint: {
    fontSize: 10,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },

  // Separator
  separatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  separatorGradient: {
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  separatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: DS.colors.cardBorder,
  },
  separatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    padding: 24,
  },
  loadingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 20,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    marginTop: 8,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.colors.cardBg,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    padding: 24,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 20,
  },
  errorSubtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: DS.colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DS.colors.white,
  },
});

export default RankingScreen;

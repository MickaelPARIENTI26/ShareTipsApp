import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/auth.store';
import { userApi } from '../api/user.api';
import type { TipsterStatsDto } from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const StatistiquesScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<TipsterStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await userApi.getTipsterStats(user.id);
      setStats(data);
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats();
    }, [fetchStats])
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const StatRow: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    iconColor?: string;
  }> = ({ icon, label, value, iconColor }) => (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        <View style={[styles.statIconContainer, { backgroundColor: `${iconColor ?? DS.colors.green}15` }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? DS.colors.green} />
        </View>
        <Text style={styles.statRowLabel}>{label}</Text>
      </View>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DS.colors.green} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DS.colors.green}
          colors={[DS.colors.green]}
        />
      }
    >
      {/* Disclaimer */}
      <Animated.View
        style={[
          styles.disclaimerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Ionicons name="information-circle-outline" size={16} color={DS.colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          Ces statistiques reflètent vos performances passées et ne garantissent pas les résultats futurs.
        </Text>
      </Animated.View>

      {/* Performance Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="stats-chart" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.sectionTitle}>Performance</Text>
        </View>
        <View style={styles.card}>
          <StatRow
            icon="document-text-outline"
            label="Tickets créés"
            value={stats?.totalTicketsCreated ?? 0}
          />
          <View style={styles.divider} />
          <StatRow
            icon="checkmark-circle-outline"
            label="Pronostics validés"
            value={stats?.winningTickets ?? 0}
            iconColor={DS.colors.greenLight}
          />
          <View style={styles.divider} />
          <StatRow
            icon="close-circle-outline"
            label="Pronostics non validés"
            value={stats?.losingTickets ?? 0}
            iconColor="#EF4444"
          />
          <View style={styles.divider} />
          <StatRow
            icon="trending-up-outline"
            label="Taux de réussite"
            value={`${(stats?.winRate ?? 0).toFixed(1)}%`}
          />
          <View style={styles.divider} />
          <StatRow
            icon="flash-outline"
            label="Cote moy. validés"
            value={stats?.averageWinningOdds?.toFixed(2) ?? '—'}
          />
          <View style={styles.divider} />
          <StatRow
            icon="calculator-outline"
            label="Cote moyenne globale"
            value={stats?.averageOdds?.toFixed(2) ?? '—'}
          />
        </View>
      </Animated.View>

      {/* Ventes Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="cash-outline" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.sectionTitle}>Ventes</Text>
        </View>
        <View style={styles.card}>
          <StatRow
            icon="cart-outline"
            label="Nombre total de ventes"
            value={stats?.ticketsSold ?? 0}
          />
          <View style={styles.divider} />
          <StatRow
            icon="wallet-outline"
            label="Revenu total généré"
            value={`${(stats?.revenueGrossEur ?? 0).toFixed(2)} €`}
          />
          <View style={styles.divider} />
          <StatRow
            icon="pricetag-outline"
            label="Revenu moyen par ticket"
            value={`${stats && stats.ticketsSold > 0 ? (stats.revenueGrossEur / stats.ticketsSold).toFixed(2) : '0.00'} €`}
          />
        </View>
      </Animated.View>

      {/* Extra Stats */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="trophy-outline" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.sectionTitle}>Records</Text>
        </View>
        <View style={styles.card}>
          <StatRow
            icon="flame-outline"
            label="Plus longue série validée"
            value={stats?.longestWinningStreak ?? 0}
            iconColor={DS.colors.greenLight}
          />
          <View style={styles.divider} />
          <StatRow
            icon="snow-outline"
            label="Plus longue série non validée"
            value={stats?.longestLosingStreak ?? 0}
            iconColor="#EF4444"
          />
          <View style={styles.divider} />
          <StatRow
            icon="star-outline"
            label="Plus haute cote validée"
            value={stats?.highestWinningOdd?.toFixed(2) ?? '—'}
          />
        </View>
      </Animated.View>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: DS.colors.textSecondary,
    lineHeight: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: DS.colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
  },
  card: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRowLabel: {
    fontSize: 14,
    color: DS.colors.white,
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.cardBorder,
  },
});

export default StatistiquesScreen;

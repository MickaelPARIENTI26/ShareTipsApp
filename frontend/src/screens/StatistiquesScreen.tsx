import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/auth.store';
import { userApi } from '../api/user.api';
import type { TipsterStatsDto } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const StatistiquesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<TipsterStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
        <Text style={styles.statRowLabel}>{label}</Text>
      </View>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const revenuePerTicket =
    stats && stats.ticketsSold > 0
      ? (stats.revenueGross / stats.ticketsSold).toFixed(0)
      : '0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.disclaimerText}>
          Ces statistiques reflètent vos performances passées et ne garantissent pas les résultats futurs.
        </Text>
      </View>

      {/* Performance Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={22} color={colors.primary} />
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
            iconColor={colors.success}
          />
          <View style={styles.divider} />
          <StatRow
            icon="close-circle-outline"
            label="Pronostics non validés"
            value={stats?.losingTickets ?? 0}
            iconColor={colors.danger}
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
      </View>

      {/* Ventes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={22} color={colors.primary} />
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
            value={`${stats?.revenueGross ?? 0} cr.`}
          />
          <View style={styles.divider} />
          <StatRow
            icon="pricetag-outline"
            label="Revenu moyen par ticket"
            value={`${revenuePerTicket} cr.`}
          />
        </View>
      </View>

      {/* Extra Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>Records</Text>
        </View>
        <View style={styles.card}>
          <StatRow
            icon="flame-outline"
            label="Plus longue série validée"
            value={stats?.longestWinningStreak ?? 0}
            iconColor={colors.success}
          />
          <View style={styles.divider} />
          <StatRow
            icon="snow-outline"
            label="Plus longue série non validée"
            value={stats?.longestLosingStreak ?? 0}
            iconColor={colors.danger}
          />
          <View style={styles.divider} />
          <StatRow
            icon="star-outline"
            label="Plus haute cote validée"
            value={stats?.highestWinningOdd?.toFixed(2) ?? '—'}
          />
        </View>
      </View>
    </ScrollView>
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
        content: {
          padding: 16,
          paddingBottom: 32,
        },
        disclaimerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 16,
          gap: 8,
        },
        disclaimerText: {
          flex: 1,
          fontSize: 11,
          color: colors.textTertiary,
          lineHeight: 15,
        },
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        section: {
          marginBottom: 20,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
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
        statRowLabel: {
          fontSize: 15,
          color: colors.text,
        },
        statRowValue: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.separator,
        },
      }),
    [colors]
  );

export default StatistiquesScreen;

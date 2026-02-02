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
import { useRoute } from '@react-navigation/native';

import { matchApi } from '../../api/match.api';
import MatchCard from '../../components/match/MatchCard';
import type { MatchDetail } from '../../types';
import { useTheme, type ThemeColors } from '../../theme';

interface DateGroup {
  date: string;
  dateLabel: string;
  matches: MatchDetail[];
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return "Aujourd'hui";
  if (isTomorrow) return 'Demain';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function groupByDate(matches: MatchDetail[]): DateGroup[] {
  // Sort all matches by start time (ascending - closest first)
  const sorted = [...matches].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Group by date
  const groups = new Map<string, MatchDetail[]>();
  for (const match of sorted) {
    const dateKey = new Date(match.startTime).toDateString();
    const list = groups.get(dateKey) ?? [];
    list.push(match);
    groups.set(dateKey, list);
  }

  return Array.from(groups.entries()).map(([dateKey, groupMatches]) => ({
    date: dateKey,
    dateLabel: formatDateHeader(groupMatches[0].startTime),
    matches: groupMatches,
  }));
}

const MatchListScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const route = useRoute();
  const { sportCode, leagueName } = route.params as {
    sportCode: string;
    sportName: string;
    leagueName?: string;
  };

  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      let data = await matchApi.getMatchesWithMarkets(sportCode);

      // Filter by league if specified
      if (leagueName) {
        data = data.filter((m) => m.leagueName === leagueName);
      }

      setMatches(data);
    } catch {
      setError('Impossible de charger les matchs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sportCode, leagueName]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const groupedMatches = useMemo(() => groupByDate(matches), [matches]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMatches}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="football-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun match à venir</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groupedMatches}
      keyExtractor={(item) => item.date}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item: group }) => (
        <View>
          <Text style={styles.dateHeader}>{group.dateLabel}</Text>
          {group.matches.map((match) => (
            <View key={match.id} style={styles.matchWrapper}>
              {!leagueName && (
                <Text style={styles.leagueBadge}>{match.leagueName}</Text>
              )}
              <MatchCard match={match} />
            </View>
          ))}
        </View>
      )}
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
        },
        dateHeader: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          textTransform: 'capitalize',
          marginTop: 16,
          marginBottom: 10,
          paddingHorizontal: 4,
        },
        matchWrapper: {
          marginBottom: 8,
        },
        leagueBadge: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
          paddingHorizontal: 4,
        },
        errorText: {
          color: colors.danger,
          fontSize: 15,
          textAlign: 'center',
          marginTop: 12,
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 15,
          textAlign: 'center',
          marginTop: 12,
        },
        retryBtn: {
          marginTop: 16,
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingHorizontal: 24,
          paddingVertical: 10,
        },
        retryBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default MatchListScreen;

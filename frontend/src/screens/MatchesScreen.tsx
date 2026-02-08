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

import { matchApi } from '../api/match.api';
import { sportsApi } from '../api/sports.api';
import MatchCard from '../components/match/MatchCard';
import { SportChips, LeagueChips } from '../components/filters';
import type { MatchDetail } from '../types';
import type { SportDto } from '../types/sport.types';
import { useTheme, type ThemeColors } from '../theme';

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
  const sorted = [...matches].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

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

const MatchesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  // Data states
  const [allMatches, setAllMatches] = useState<MatchDetail[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [matchesData, sportsRes] = await Promise.all([
        matchApi.getMatchesWithMarkets(),
        sportsApi.getAll(),
      ]);
      setAllMatches(matchesData);
      setSports(sportsRes.data.filter((s) => s.isActive));
    } catch {
      setError('Impossible de charger les matchs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Extract unique leagues from filtered matches (by sport)
  const availableLeagues = useMemo(() => {
    if (!selectedSport) return [];
    const sportMatches = allMatches.filter(
      (m) => m.sportCode === selectedSport
    );
    const leagues = [...new Set(sportMatches.map((m) => m.leagueName))];
    return leagues.sort();
  }, [allMatches, selectedSport]);

  // Reset league when sport changes
  useEffect(() => {
    setSelectedLeague(null);
  }, [selectedSport]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    let result = allMatches;

    if (selectedSport) {
      result = result.filter((m) => m.sportCode === selectedSport);
    }

    if (selectedLeague) {
      result = result.filter((m) => m.leagueName === selectedLeague);
    }

    return result;
  }, [allMatches, selectedSport, selectedLeague]);

  const groupedMatches = useMemo(
    () => groupByDate(filteredMatches),
    [filteredMatches]
  );

  // Match count for current filters
  const matchCount = filteredMatches.length;

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
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sport filter chips */}
      <SportChips
        sports={sports}
        selectedSport={selectedSport}
        onSelect={setSelectedSport}
        colors={colors}
      />

      {/* League filter chips (only when a sport is selected) */}
      {selectedSport && availableLeagues.length > 0 && (
        <LeagueChips
          leagues={availableLeagues}
          selectedLeague={selectedLeague}
          onSelect={setSelectedLeague}
          colors={colors}
        />
      )}

      {/* Match count indicator */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {matchCount} match{matchCount !== 1 ? 's' : ''} à venir
        </Text>
      </View>

      {/* Empty state */}
      {filteredMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="football-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            {selectedSport
              ? 'Aucun match pour ce sport'
              : 'Aucun match à venir'}
          </Text>
          {selectedSport && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setSelectedSport(null)}
            >
              <Text style={styles.resetBtnText}>Voir tous les matchs</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          testID="matches-list"
          data={groupedMatches}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item: group, index }) => (
            <View testID="matches-screen">
              {/* Separator between days (except first) */}
              {index > 0 && <View style={styles.daySeparator} />}
              <View style={styles.dateHeaderContainer}>
                <View style={styles.dateHeaderLine} />
                <Text style={styles.dateHeader}>{group.dateLabel}</Text>
                <View style={styles.dateHeaderLine} />
              </View>
              {group.matches.map((match) => (
                <View
                  key={match.id}
                  testID="match-card"
                  style={styles.matchWrapper}
                >
                  {/* Only show league badge if not filtering by league */}
                  {!selectedLeague && (
                    <Text style={styles.leagueBadge}>{match.leagueName}</Text>
                  )}
                  <MatchCard match={match} />
                </View>
              ))}
            </View>
          )}
        />
      )}
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
        countContainer: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: colors.background,
        },
        countText: {
          fontSize: 13,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        daySeparator: {
          height: 8,
          backgroundColor: colors.border,
          marginTop: 20,
          marginHorizontal: -12,
        },
        dateHeaderContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 20,
          marginBottom: 12,
          gap: 12,
        },
        dateHeaderLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        dateHeader: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          backgroundColor: colors.background,
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
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
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
        resetBtn: {
          marginTop: 16,
          backgroundColor: colors.surface,
          borderRadius: 8,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        resetBtnText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default MatchesScreen;

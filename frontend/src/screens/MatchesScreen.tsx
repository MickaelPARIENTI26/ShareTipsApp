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

// Sport icon mapping
const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  BASEBALL: 'baseball',
  GOLF: 'golf',
};

function getSportIcon(sportCode: string): keyof typeof Ionicons.glyphMap {
  return SPORT_ICONS[sportCode.toUpperCase()] ?? 'trophy';
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

// League badge component - inline styles for React Compiler compatibility
const LeagueBadge: React.FC<{
  leagueName: string;
  sportCode: string;
  colors: ThemeColors;
}> = ({ leagueName, sportCode, colors }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${colors.primary}10`,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginBottom: 8,
      marginLeft: 4,
    }}
  >
    <Ionicons
      name={getSportIcon(sportCode)}
      size={12}
      color={colors.primary}
      style={{ opacity: 0.8 }}
    />
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {leagueName}
    </Text>
  </View>
);

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
        <View style={styles.errorIconWrapper}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Ionicons name="refresh" size={16} color={colors.textOnPrimary} />
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
        <View style={styles.countBadge}>
          <Text style={styles.countNumber}>{matchCount}</Text>
        </View>
        <Text style={styles.countText}>
          match{matchCount !== 1 ? 's' : ''} à venir
        </Text>
      </View>

      {/* Empty state */}
      {filteredMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons
              name="calendar-outline"
              size={40}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {selectedSport
              ? 'Aucun match disponible'
              : 'Aucun match à venir'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Revenez plus tard pour découvrir les prochains matchs
          </Text>
          {selectedSport && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setSelectedSport(null)}
            >
              <Ionicons name="apps-outline" size={16} color={colors.primary} />
              <Text style={styles.resetBtnText}>Voir tous les sports</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          testID="matches-list"
          data={groupedMatches}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: group, index }) => (
            <View testID="matches-screen">
              {/* Date header */}
              <View style={[styles.dateHeaderContainer, index === 0 && styles.firstDateHeader]}>
                <View style={styles.dateHeaderContent}>
                  <Ionicons name="calendar" size={14} color={colors.primary} />
                  <Text style={styles.dateHeader}>{group.dateLabel}</Text>
                </View>
                <View style={styles.dateHeaderLine} />
              </View>

              {/* Matches for this date */}
              {group.matches.map((match) => (
                <View
                  key={match.id}
                  testID="match-card"
                  style={styles.matchWrapper}
                >
                  {/* Only show league badge if not filtering by league */}
                  {!selectedLeague && (
                    <LeagueBadge
                      leagueName={match.leagueName}
                      sportCode={match.sportCode}
                      colors={colors}
                    />
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
          padding: 16,
          paddingBottom: 100, // Extra space for floating tab bar
        },
        countContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.background,
        },
        countBadge: {
          backgroundColor: `${colors.primary}15`,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
        },
        countNumber: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
        countText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        dateHeaderContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 24,
          marginBottom: 16,
          gap: 12,
        },
        firstDateHeader: {
          marginTop: 0,
        },
        dateHeaderContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: `${colors.primary}10`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 14,
        },
        dateHeaderLine: {
          flex: 1,
          height: 1,
          backgroundColor: `${colors.border}60`,
        },
        dateHeader: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'capitalize',
          letterSpacing: 0.3,
        },
        matchWrapper: {
          marginBottom: 4,
        },
        errorIconWrapper: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${colors.danger}10`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        errorText: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: 8,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        },
        emptyIconWrapper: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${colors.textTertiary}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 8,
        },
        emptySubtitle: {
          color: colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        },
        retryBtn: {
          marginTop: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingHorizontal: 20,
          paddingVertical: 12,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        retryBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        resetBtn: {
          marginTop: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: `${colors.primary}10`,
          borderRadius: 14,
          paddingHorizontal: 20,
          paddingVertical: 12,
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

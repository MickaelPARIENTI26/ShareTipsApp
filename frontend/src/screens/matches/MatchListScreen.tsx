import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { matchApi } from '../../api/match.api';
import type { MatchDetail, RootStackParamList, MarketSelection, TicketSelection } from '../../types';
import { useTheme } from '../../theme';
import { DS } from '../../theme/designSystem';
import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DateGroup {
  date: string;
  dateLabel: string;
  matches: MatchDetail[];
}

interface SportFilter {
  code: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_FILTERS: SportFilter[] = [
  { code: 'ALL', label: 'Tous', icon: 'apps-outline' },
  { code: 'BASKETBALL', label: 'Basketball', icon: 'basketball-outline' },
  { code: 'ESPORT', label: 'E-Sport', icon: 'game-controller-outline' },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === tomorrow.toDateString()) return 'Demain';

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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getTeamInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
// MATCH CARD COMPONENT (INLINE POUR CONTRÔLE TOTAL)
// ═══════════════════════════════════════════════════════════════

interface MatchCardInlineProps {
  match: MatchDetail;
}

const MatchCardInline: React.FC<MatchCardInlineProps> = ({ match }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);

  const isSelected = useCallback(
    (selectionId: string) => selections.some((s) => s.selectionId === selectionId),
    [selections]
  );

  const hasNoDrawOption = match.sportCode !== 'FOOTBALL';

  const matchResult = useMemo(
    () => match.markets.find((m) => m.type === 'MatchResult' || m.type === 'MoneyLine'),
    [match.markets]
  );

  const oddsSelections = useMemo(() => {
    if (!matchResult) return [];

    const homeTeamSel = matchResult.selections.find(
      (s) =>
        s.label === match.homeTeam.name ||
        s.label === match.homeTeam.shortName ||
        s.label === '1' ||
        s.code === 'HOME' ||
        s.code === 'HOME_WIN' ||
        s.code === 'HOME_ML'
    );
    const drawSel = !hasNoDrawOption
      ? matchResult.selections.find(
          (s) => s.label === 'Draw' || s.label === 'X' || s.code === 'X' || s.code === 'DRAW'
        )
      : null;
    const awayTeamSel = matchResult.selections.find(
      (s) =>
        s.label === match.awayTeam.name ||
        s.label === match.awayTeam.shortName ||
        s.label === '2' ||
        s.code === 'AWAY' ||
        s.code === 'AWAY_WIN' ||
        s.code === 'AWAY_ML'
    );

    return hasNoDrawOption
      ? [
          { sel: homeTeamSel, label: '1' },
          { sel: awayTeamSel, label: '2' },
        ]
      : [
          { sel: homeTeamSel, label: '1' },
          { sel: drawSel, label: 'X' },
          { sel: awayTeamSel, label: '2' },
        ];
  }, [matchResult, match.homeTeam, match.awayTeam, hasNoDrawOption]);

  const handleOddsPress = useCallback(
    (sel: MarketSelection) => {
      if (!matchResult) return;
      const selection: TicketSelection = {
        matchId: match.id,
        matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        leagueName: match.leagueName,
        sportCode: match.sportCode,
        startTime: match.startTime,
        selectionId: sel.id,
        marketType: matchResult.type,
        marketLabel: matchResult.label,
        selectionLabel: sel.label,
        odds: sel.odds,
      };
      toggleSelection(selection);
    },
    [matchResult, match, toggleSelection]
  );

  const navigateToDetails = useCallback(() => {
    navigation.navigate('MatchDetails', {
      matchId: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    });
  }, [navigation, match]);

  return (
    <TouchableOpacity
      style={cardStyles.container}
      onPress={navigateToDetails}
      activeOpacity={0.8}
    >
      {/* Header: League + Time */}
      <View style={cardStyles.header}>
        <View style={cardStyles.leagueBadge}>
          <View style={cardStyles.leagueBar} />
          <Text style={cardStyles.leagueText}>{match.leagueName}</Text>
        </View>
        <View style={cardStyles.timeContainer}>
          <Ionicons name="time-outline" size={12} color={DS.colors.textSecondary} />
          <Text style={cardStyles.timeText}>{formatTime(match.startTime)}</Text>
        </View>
      </View>

      {/* Teams Section */}
      <View style={cardStyles.teamsSection}>
        {/* Home Team */}
        <View style={cardStyles.teamContainer}>
          <View style={cardStyles.teamLogo}>
            <Text style={cardStyles.teamInitials}>{getTeamInitials(match.homeTeam.name)}</Text>
          </View>
          <Text style={cardStyles.teamName} numberOfLines={2}>{match.homeTeam.name}</Text>
        </View>

        {/* VS */}
        <Text style={cardStyles.vsText}>VS</Text>

        {/* Away Team */}
        <View style={cardStyles.teamContainer}>
          <View style={cardStyles.teamLogo}>
            <Text style={cardStyles.teamInitials}>{getTeamInitials(match.awayTeam.name)}</Text>
          </View>
          <Text style={cardStyles.teamName} numberOfLines={2}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* Odds Buttons */}
      {matchResult && (
        <View style={cardStyles.oddsContainer}>
          {oddsSelections.map(({ sel, label }) =>
            sel ? (
              <TouchableOpacity
                key={sel.id}
                style={[
                  cardStyles.oddsButton,
                  isSelected(sel.id) && cardStyles.oddsButtonSelected,
                ]}
                onPress={() => handleOddsPress(sel)}
                activeOpacity={0.7}
              >
                <Text style={[
                  cardStyles.oddsLabel,
                  isSelected(sel.id) && cardStyles.oddsLabelSelected,
                ]}>
                  {label}
                </Text>
                <Text style={[
                  cardStyles.oddsValue,
                  isSelected(sel.id) && cardStyles.oddsValueSelected,
                ]}>
                  {sel.odds.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ) : null
          )}
        </View>
      )}

      {/* Markets Link */}
      <TouchableOpacity style={cardStyles.marketsLink} onPress={navigateToDetails}>
        <Text style={cardStyles.marketsText}>
          +{match.markets.length} marché{match.markets.length > 1 ? 's' : ''}
        </Text>
        <Ionicons name="chevron-forward" size={12} color={DS.colors.green} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.cardBg,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueBar: {
    width: 3,
    height: 14,
    backgroundColor: DS.colors.green,
    borderRadius: 2,
    marginRight: 8,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.white,
    textTransform: 'uppercase',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: DS.colors.textSecondary,
  },
  teamsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DS.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.white,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '400',
    color: DS.colors.textVs,
    marginHorizontal: 8,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  oddsButton: {
    flex: 1,
    backgroundColor: DS.colors.cardBg,
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  oddsButtonSelected: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  oddsLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: DS.colors.textSecondary,
    marginBottom: 2,
  },
  oddsLabelSelected: {
    color: DS.colors.white,
  },
  oddsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.white,
  },
  oddsValueSelected: {
    color: DS.colors.white,
  },
  marketsLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  marketsText: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.green,
  },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MatchListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('ALL');

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const fetchCode = selectedSportFilter === 'ALL' ? sportCode : selectedSportFilter;
      let data = await matchApi.getMatchesWithMarkets(fetchCode);

      if (leagueName) {
        data = data.filter((m) => m.leagueName === leagueName);
      }

      if (selectedSportFilter !== 'ALL' && selectedSportFilter !== sportCode) {
        data = data.filter((m) => m.sportCode.toUpperCase() === selectedSportFilter);
      }

      setMatches(data);
    } catch {
      setError('Impossible de charger les matchs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sportCode, leagueName, selectedSportFilter]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const groupedMatches = useMemo(() => groupByDate(matches), [matches]);

  // ── Render Header ─────────────────────────────────────────────
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={DS.colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Matchs</Text>
      <View style={styles.backButton} />
    </View>
  );

  // ── Render Sport Filters ──────────────────────────────────────
  const renderSportFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {SPORT_FILTERS.map((filter) => {
        const isActive = selectedSportFilter === filter.code;
        return (
          <TouchableOpacity
            key={filter.code}
            style={[
              styles.filterChip,
              isActive && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSportFilter(filter.code)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={isActive ? DS.colors.white : DS.colors.textSecondary}
            />
            <Text style={[
              styles.filterLabel,
              isActive && styles.filterLabelActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── Render Date Section ───────────────────────────────────────
  const renderDateHeader = (dateLabel: string) => (
    <View style={styles.dateSection}>
      <Ionicons name="calendar-outline" size={14} color={DS.colors.green} />
      <Text style={styles.dateText}>{dateLabel}</Text>
      <Ionicons name="chevron-forward" size={14} color={DS.colors.green} />
    </View>
  );

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderSportFilters()}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.colors.green} />
        </View>
      </View>
    );
  }

  // ── Error State ───────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderSportFilters()}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMatches}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty State ───────────────────────────────────────────────
  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderSportFilters()}
        <View style={styles.center}>
          <Ionicons name="football-outline" size={48} color={DS.colors.textSecondary} />
          <Text style={styles.emptyText}>Aucun match à venir</Text>
        </View>
      </View>
    );
  }

  // ── Main Content ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSportFilters()}
      <FlatList
        data={groupedMatches}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DS.colors.green}
            colors={[DS.colors.green]}
          />
        }
        renderItem={({ item: group }) => (
          <View>
            {renderDateHeader(group.dateLabel)}
            {group.matches.map((match) => (
              <MatchCardInline key={match.id} match={match} />
            ))}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DS.colors.white,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.textSecondary,
  },
  filterLabelActive: {
    color: DS.colors.white,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: DS.colors.green,
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingBottom: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: DS.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: DS.colors.green,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: DS.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default MatchListScreen;

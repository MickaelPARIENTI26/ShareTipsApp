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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { matchApi } from '../api/match.api';
import { sportsApi } from '../api/sports.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import { DS } from '../theme/designSystem';
import { getTeamLogo, getTennisFlag } from '../utils/teamAssets';
import OddsButton from '../components/match/OddsButton';
import type { MatchDetail, MatchesStackParamList, MarketSelection, TicketSelection } from '../types';
import type { SportDto } from '../types/sport.types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DateGroup {
  date: string;
  dateLabel: string;
  matches: MatchDetail[];
}

interface LeagueInfo {
  id: string;
  name: string;
  sportCode: string;
  sportIcon: keyof typeof Ionicons.glyphMap;
  matchCount: number;
}

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

function getSportIcon(sportCode: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    FOOTBALL: 'football',
    BASKETBALL: 'basketball',
    TENNIS: 'tennisball',
    ESPORT: 'game-controller',
  };
  return icons[sportCode.toUpperCase()] ?? 'trophy';
}

/** Extract unique leagues from matches */
function extractLeagues(matches: MatchDetail[]): LeagueInfo[] {
  const leagueMap = new Map<string, LeagueInfo>();

  for (const match of matches) {
    const key = match.leagueName.toLowerCase();
    if (!leagueMap.has(key)) {
      leagueMap.set(key, {
        id: key,
        name: match.leagueName,
        sportCode: match.sportCode,
        sportIcon: getSportIcon(match.sportCode),
        matchCount: 1,
      });
    } else {
      const existing = leagueMap.get(key)!;
      existing.matchCount++;
    }
  }

  // Sort by match count (most popular first)
  return Array.from(leagueMap.values()).sort((a, b) => b.matchCount - a.matchCount);
}

// ═══════════════════════════════════════════════════════════════
// MATCH CARD COMPONENT (INLINE)
// ═══════════════════════════════════════════════════════════════

interface MatchCardInlineProps {
  match: MatchDetail;
}

const MatchCardInline: React.FC<MatchCardInlineProps> = ({ match }) => {
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
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
          <Ionicons name={getSportIcon(match.sportCode)} size={14} color={DS.colors.green} />
          <Text style={cardStyles.leagueText}>{match.leagueName}</Text>
        </View>
        <View style={cardStyles.timeContainer}>
          <Ionicons name="time-outline" size={12} color="#8A9A8F" />
          <Text style={cardStyles.timeText}>{formatTime(match.startTime)}</Text>
        </View>
      </View>

      {/* Teams Section */}
      <View style={cardStyles.teamsSection}>
        <View style={cardStyles.teamContainer}>
          <View style={cardStyles.teamLogo}>
            {(() => {
              const logoUrl = match.sportCode === 'TENNIS'
                ? getTennisFlag(match.homeTeam.name)
                : getTeamLogo(match.homeTeam.name, match.sportCode);
              return logoUrl ? (
                <Image source={{ uri: logoUrl }} style={cardStyles.teamLogoImage} />
              ) : (
                <Text style={cardStyles.teamInitials}>{getTeamInitials(match.homeTeam.name)}</Text>
              );
            })()}
          </View>
          <Text style={cardStyles.teamName} numberOfLines={2}>{match.homeTeam.name}</Text>
        </View>

        <View style={cardStyles.vsCircle}>
          <Text style={cardStyles.vsText}>VS</Text>
        </View>

        <View style={cardStyles.teamContainer}>
          <View style={cardStyles.teamLogo}>
            {(() => {
              const logoUrl = match.sportCode === 'TENNIS'
                ? getTennisFlag(match.awayTeam.name)
                : getTeamLogo(match.awayTeam.name, match.sportCode);
              return logoUrl ? (
                <Image source={{ uri: logoUrl }} style={cardStyles.teamLogoImage} />
              ) : (
                <Text style={cardStyles.teamInitials}>{getTeamInitials(match.awayTeam.name)}</Text>
              );
            })()}
          </View>
          <Text style={cardStyles.teamName} numberOfLines={2}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* Odds Buttons - Using unified OddsButton component */}
      {matchResult && (
        <View style={cardStyles.oddsContainer}>
          {oddsSelections.map(({ sel, label }) =>
            sel ? (
              <OddsButton
                key={sel.id}
                label={label}
                odds={sel.odds}
                isSelected={isSelected(sel.id)}
                disabled={false}
                onPress={() => handleOddsPress(sel)}
                variant="default"
                size="md"
              />
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
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: DS.colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    color: '#8A9A8F',
  },
  teamsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F1611',
    borderWidth: 1.5,
    borderColor: '#2D8C4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
  },
  teamLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'contain',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.white,
    textAlign: 'center',
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F1611',
    borderWidth: 2,
    borderColor: DS.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    color: DS.colors.green,
  },
  oddsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
// LEAGUE CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════

interface LeagueChipProps {
  league: LeagueInfo;
  isActive: boolean;
  showSportIcon: boolean;
  onPress: () => void;
}

const LeagueChip: React.FC<LeagueChipProps> = ({ league, isActive, showSportIcon, onPress }) => (
  <TouchableOpacity
    style={[
      leagueChipStyles.chip,
      isActive && leagueChipStyles.chipActive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {showSportIcon && (
      <Ionicons
        name={league.sportIcon}
        size={14}
        color={isActive ? DS.colors.white : DS.colors.green}
      />
    )}
    <Text
      style={[
        leagueChipStyles.text,
        isActive && leagueChipStyles.textActive,
      ]}
      numberOfLines={1}
    >
      {league.name}
    </Text>
    {isActive && (
      <Ionicons name="close-circle" size={16} color={DS.colors.white} />
    )}
  </TouchableOpacity>
);

const leagueChipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
    maxWidth: 160,
  },
  chipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.white,
    flexShrink: 1,
  },
  textActive: {
    color: DS.colors.white,
  },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MAX_DISPLAYED_LEAGUES = 4;

const MatchesScreen: React.FC = () => {
  // Data states
  const [allMatches, setAllMatches] = useState<MatchDetail[]>([]);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showAllLeagues, setShowAllLeagues] = useState(false);

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

  // Extract available leagues from matches (filtered by sport if selected)
  const availableLeagues = useMemo(() => {
    const matchesToAnalyze = selectedSport
      ? allMatches.filter((m) => m.sportCode === selectedSport)
      : allMatches;
    return extractLeagues(matchesToAnalyze);
  }, [allMatches, selectedSport]);

  // Get displayed leagues (limited or all)
  const displayedLeagues = useMemo(() => {
    if (showAllLeagues) return availableLeagues;
    return availableLeagues.slice(0, MAX_DISPLAYED_LEAGUES);
  }, [availableLeagues, showAllLeagues]);

  const remainingLeaguesCount = availableLeagues.length - MAX_DISPLAYED_LEAGUES;

  // Apply filters
  const filteredMatches = useMemo(() => {
    let filtered = allMatches;

    // Filter by sport
    if (selectedSport) {
      filtered = filtered.filter((m) => m.sportCode === selectedSport);
    }

    // Filter by league
    if (selectedLeague) {
      filtered = filtered.filter(
        (m) => m.leagueName.toLowerCase() === selectedLeague
      );
    }

    return filtered;
  }, [allMatches, selectedSport, selectedLeague]);

  const groupedMatches = useMemo(
    () => groupByDate(filteredMatches),
    [filteredMatches]
  );

  // Handlers
  const handleSportSelect = useCallback((sportCode: string | null) => {
    setSelectedSport(sportCode);
    setSelectedLeague(null); // Reset league when changing sport
    setShowAllLeagues(false);
  }, []);

  const handleLeagueSelect = useCallback((leagueId: string) => {
    if (selectedLeague === leagueId) {
      // Toggle off if already selected
      setSelectedLeague(null);
    } else {
      setSelectedLeague(leagueId);
    }
  }, [selectedLeague]);

  const handleShowMoreLeagues = useCallback(() => {
    setShowAllLeagues(true);
  }, []);

  // ── Render Sport Filters ──────────────────────────────────────
  const renderSportFilters = () => (
    <View style={styles.filtersWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
      {/* "Tous" filter */}
      <TouchableOpacity
        style={[
          styles.filterChip,
          !selectedSport && styles.filterChipActive,
        ]}
        onPress={() => handleSportSelect(null)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="apps-outline"
          size={14}
          color={!selectedSport ? DS.colors.white : '#8A9A8F'}
        />
        <Text style={[
          styles.filterLabel,
          !selectedSport && styles.filterLabelActive,
        ]}>
          Tous
        </Text>
      </TouchableOpacity>

      {/* Sport filters */}
      {sports.map((sport) => {
        const isActive = selectedSport === sport.code;
        return (
          <TouchableOpacity
            key={sport.code}
            style={[
              styles.filterChip,
              isActive && styles.filterChipActive,
            ]}
            onPress={() => handleSportSelect(sport.code)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getSportIcon(sport.code)}
              size={14}
              color={isActive ? DS.colors.white : '#8A9A8F'}
            />
            <Text style={[
              styles.filterLabel,
              isActive && styles.filterLabelActive,
            ]}>
              {sport.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      </ScrollView>
    </View>
  );

  // ── Render League Filters ─────────────────────────────────────
  const renderLeagueFilters = () => {
    if (availableLeagues.length === 0) return null;

    return (
      <View style={styles.leaguesSection}>
        <View style={styles.leaguesHeader}>
          <Ionicons name="trophy-outline" size={14} color={DS.colors.greenLight} />
          <Text style={styles.leaguesTitle}>
            Championnats{selectedSport ? ` ${sports.find(s => s.code === selectedSport)?.name || ''}` : ''}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leaguesContent}
        >
          {displayedLeagues.map((league) => (
            <LeagueChip
              key={league.id}
              league={league}
              isActive={selectedLeague === league.id}
              showSportIcon={!selectedSport} // Show sport icon only when "Tous" is selected
              onPress={() => handleLeagueSelect(league.id)}
            />
          ))}
          {remainingLeaguesCount > 0 && !showAllLeagues && (
            <TouchableOpacity
              style={styles.moreChip}
              onPress={handleShowMoreLeagues}
              activeOpacity={0.7}
            >
              <Text style={styles.moreChipText}>+{remainingLeaguesCount}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  // ── Render Date Section ───────────────────────────────────────
  const renderDateHeader = (dateLabel: string) => (
    <View style={styles.dateSection}>
      <Ionicons name="calendar-outline" size={14} color={DS.colors.greenLight} />
      <Text style={styles.dateText}>{dateLabel}</Text>
    </View>
  );

  // ── Render Active Filters Badge ───────────────────────────────
  const renderActiveFilters = () => {
    if (!selectedLeague) return null;

    const league = availableLeagues.find((l) => l.id === selectedLeague);
    if (!league) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersLabel}>Filtré par :</Text>
        <TouchableOpacity
          style={styles.activeFilterBadge}
          onPress={() => setSelectedLeague(null)}
          activeOpacity={0.7}
        >
          <Text style={styles.activeFilterText}>{league.name}</Text>
          <Ionicons name="close" size={14} color={DS.colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
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
        {renderSportFilters()}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty State ───────────────────────────────────────────────
  if (filteredMatches.length === 0) {
    return (
      <View style={styles.container}>
        {renderSportFilters()}
        {renderLeagueFilters()}
        <View style={styles.center}>
          <Ionicons name="football-outline" size={48} color="#8A9A8F" />
          <Text style={styles.emptyText}>Aucun match à venir</Text>
          {(selectedSport || selectedLeague) && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSelectedSport(null);
                setSelectedLeague(null);
              }}
            >
              <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Main Content ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {renderSportFilters()}
      {renderLeagueFilters()}
      {renderActiveFilters()}
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
  filtersWrapper: {
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
  },
  filterChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A9A8F',
  },
  filterLabelActive: {
    color: DS.colors.white,
  },
  // League filters
  leaguesSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  leaguesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  leaguesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.greenLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaguesContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 8,
  },
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 1,
    borderColor: DS.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.green,
  },
  // Active filters
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 12,
    color: '#8A9A8F',
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DS.colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.white,
  },
  // Date section
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: DS.colors.greenLight,
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: '#8A9A8F',
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
  resetBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: DS.colors.green,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  resetBtnText: {
    color: DS.colors.green,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default MatchesScreen;

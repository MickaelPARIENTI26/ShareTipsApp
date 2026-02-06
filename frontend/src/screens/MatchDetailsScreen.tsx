import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import { matchApi } from '../api/match.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import type {
  MatchDetail,
  Market,
  MarketSelection,
  TicketSelection,
} from '../types';
import { useTheme, type ThemeColors } from '../theme';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

/**
 * Format market label with line value when applicable
 */
function formatMarketLabel(market: Market): string {
  const { type, label, line } = market;

  // If no line, return label as-is
  if (line == null) return label;

  // Format based on market type
  const marketType = type.toLowerCase();

  // Handicap markets: show the spread
  if (marketType.includes('handicap') || marketType === 'spreads') {
    const sign = line >= 0 ? '+' : '';
    return `${label} (${sign}${line})`;
  }

  // Over/Under (totals) markets: show the line
  if (marketType.includes('overunder') || marketType.includes('total')) {
    return `${label} (${line})`;
  }

  // Corners, Cards totals
  if (marketType.includes('corner') || marketType.includes('card')) {
    return `${label} (${line})`;
  }

  // Default: show line in parentheses
  return `${label} (${line})`;
}

/**
 * Format selection label with additional context
 * Uses the selection's own point value for accurate display
 */
function formatSelectionLabel(sel: MarketSelection, market: Market): string {
  const { label, code, point } = sel;
  const { type } = market;
  const marketType = type.toLowerCase();

  // For Over/Under, show "Over 2.5" or "Under 2.5"
  if (marketType.includes('overunder') || marketType.includes('total')) {
    if (point != null) {
      if (code === 'OVER') {
        return `Over ${point}`;
      }
      if (code === 'UNDER') {
        return `Under ${point}`;
      }
    }
  }

  // For Handicap/Spreads, show team name with the point
  if (marketType.includes('handicap') || marketType === 'spreads') {
    if (point != null) {
      const sign = point >= 0 ? '+' : '';
      return `${label} (${sign}${point})`;
    }
  }

  // For Corners/Cards totals
  if (marketType.includes('corner') || marketType.includes('card')) {
    if (point != null) {
      if (code === 'OVER') {
        return `Over ${point}`;
      }
      if (code === 'UNDER') {
        return `Under ${point}`;
      }
    }
  }

  return label;
}

// --- Selection button ---
const SelectionButton: React.FC<{
  sel: MarketSelection;
  market: Market;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}> = ({ sel, market, selected, disabled, onPress, colors, styles }) => (
  <TouchableOpacity
    style={[
      styles.selBtn,
      selected && styles.selBtnSelected,
      disabled && styles.selBtnDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text
      style={[styles.selBtnLabel, selected && styles.selBtnLabelSelected]}
      numberOfLines={1}
    >
      {formatSelectionLabel(sel, market)}
    </Text>
    <Text
      style={[styles.selBtnOdds, selected && styles.selBtnOddsSelected]}
    >
      {sel.odds.toFixed(2)}
    </Text>
  </TouchableOpacity>
);

// --- Market block ---
const MarketBlock: React.FC<{
  market: Market;
  match: MatchDetail;
  isSelected: (selectionId: string) => boolean;
  onSelect: (market: Market, sel: MarketSelection) => void;
  started: boolean;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}> = ({ market, match, isSelected, onSelect, started, colors, styles }) => (
  <View style={styles.marketCard}>
    <Text style={styles.marketLabel}>{formatMarketLabel(market)}</Text>
    <View style={styles.selectionsGrid}>
      {market.selections.map((sel) => (
        <SelectionButton
          key={sel.id}
          sel={sel}
          market={market}
          selected={isSelected(sel.id)}
          disabled={started}
          onPress={() => onSelect(market, sel)}
          colors={colors}
          styles={styles}
        />
      ))}
    </View>
  </View>
);

// --- Main screen ---
const MatchDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const route = useRoute();
  const { matchId } = route.params as { matchId: string };

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);
  const isSelected = (selectionId: string) =>
    selections.some((s) => s.selectionId === selectionId);

  const fetchMatch = useCallback(async () => {
    try {
      setError(null);
      const { data } = await matchApi.getById(matchId);
      setMatch(data);
    } catch {
      setError('Impossible de charger le match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatch();
  }, [fetchMatch]);

  const handleSelect = (market: Market, sel: MarketSelection) => {
    if (!match) return;
    const selection: TicketSelection = {
      matchId: match.id,
      matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      leagueName: match.leagueName,
      sportCode: match.sportCode,
      startTime: match.startTime,
      selectionId: sel.id,
      marketType: market.type,
      marketLabel: market.label,
      selectionLabel: sel.label,
      odds: sel.odds,
    };
    toggleSelection(selection);
  };

  const started =
    match != null &&
    (match.status !== 'Scheduled' || new Date(match.startTime) <= new Date());

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>
          {error ?? 'Match introuvable'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMatch}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Match header */}
      <View style={styles.matchHeader}>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>{formatDate(match.startTime)}</Text>
          {started && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>
                {match.status === 'Scheduled' ? 'Bientôt' : match.status}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.leagueName}>{match.leagueName}</Text>
        <View style={styles.teamsRow}>
          <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          <Text style={styles.vs}>vs</Text>
          <Text style={styles.teamName}>{match.awayTeam.name}</Text>
        </View>
        {match.homeScore != null && match.awayScore != null && (
          <Text style={styles.score}>
            {match.homeScore} — {match.awayScore}
          </Text>
        )}
      </View>

      {/* Markets */}
      <Text style={styles.sectionTitle}>
        Marchés ({match.markets.length})
      </Text>
      {match.markets.length === 0 ? (
        <View style={styles.emptyMarkets}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun marché disponible</Text>
        </View>
      ) : (
        match.markets.map((market) => (
          <MarketBlock
            key={market.id}
            market={market}
            match={match}
            isSelected={isSelected}
            onSelect={handleSelect}
            started={started}
            colors={colors}
            styles={styles}
          />
        ))
      )}
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
        scroll: {
          padding: 16,
          paddingBottom: 100,
        },
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: 24,
        },
        errorText: {
          color: colors.danger,
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

        // Match header
        matchHeader: {
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          alignItems: 'center',
        },
        dateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        },
        dateText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        liveBadge: {
          backgroundColor: colors.danger,
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
          marginLeft: 6,
        },
        liveBadgeText: {
          color: colors.textOnPrimary,
          fontSize: 10,
          fontWeight: '700',
        },
        leagueName: {
          fontSize: 12,
          color: colors.primary,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        teamsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        teamName: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.text,
          flex: 1,
          textAlign: 'center',
        },
        vs: {
          fontSize: 14,
          color: colors.textTertiary,
          fontWeight: '600',
        },
        score: {
          fontSize: 28,
          fontWeight: '900',
          color: colors.text,
          marginTop: 8,
        },

        // Section
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },

        // Market
        marketCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
        },
        marketLabel: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 10,
        },
        selectionsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },

        // Selection button
        selBtn: {
          flex: 1,
          minWidth: '28%',
          backgroundColor: colors.background,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 8,
          alignItems: 'center',
        },
        selBtnSelected: {
          backgroundColor: colors.primary,
        },
        selBtnDisabled: {
          opacity: 0.5,
        },
        selBtnLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: 2,
          textAlign: 'center',
        },
        selBtnLabelSelected: {
          color: colors.textOnPrimary,
        },
        selBtnOdds: {
          fontSize: 15,
          fontWeight: '800',
          color: colors.text,
        },
        selBtnOddsSelected: {
          color: colors.textOnPrimary,
        },

        // Empty
        emptyMarkets: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 32,
          alignItems: 'center',
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 14,
          marginTop: 8,
        },
      }),
    [colors]
  );

export default MatchDetailsScreen;

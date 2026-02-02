import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import OddsButton from './OddsButton';
import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import { useTheme, type ThemeColors } from '../../theme';
import type {
  MatchDetail,
  MarketSelection,
  TicketSelection,
  RootStackParamList,
} from '../../types';

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

function isMatchStarted(match: MatchDetail): boolean {
  return (
    match.status !== 'Scheduled' || new Date(match.startTime) <= new Date()
  );
}

interface MatchCardProps {
  match: MatchDetail;
}

const MatchCardComponent: React.FC<MatchCardProps> = ({ match }) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);
  const isSelected = (selectionId: string) =>
    selections.some((s) => s.selectionId === selectionId);

  const matchResult = match.markets.find((m) => m.type === 'MatchResult');
  const started = isMatchStarted(match);

  const handlePress = (sel: MarketSelection) => {
    if (started || !matchResult) return;
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
  };

  // Map MatchResult selections to ordered 1 / X / 2
  const homeTeamSel = matchResult?.selections.find(
    (s) => s.label === match.homeTeam.name || s.code === 'HOME'
  );
  const drawSel = matchResult?.selections.find(
    (s) => s.label === 'Draw' || s.code === 'X' || s.code === 'DRAW'
  );
  const awayTeamSel = matchResult?.selections.find(
    (s) => s.label === match.awayTeam.name || s.code === 'AWAY'
  );

  const oddsSelections = [
    { sel: homeTeamSel, label: '1' },
    { sel: drawSel, label: 'X' },
    { sel: awayTeamSel, label: '2' },
  ];

  const navigateToDetails = () => {
    navigation.navigate('MatchDetails', {
      matchId: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={navigateToDetails}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.date}>{formatDate(match.startTime)}</Text>
        </View>
        <View style={styles.headerRight}>
          {started && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>
                {match.status === 'Scheduled' ? 'Bientôt' : match.status}
              </Text>
            </View>
          )}
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>{match.sportCode}</Text>
          </View>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
        <Text style={styles.vs}>—</Text>
        <Text style={styles.teamName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
      </View>

      {/* Odds row — inner touchables take priority over card press */}
      {matchResult && (
        <View style={styles.oddsRow}>
          {oddsSelections.map(({ sel, label }) =>
            sel ? (
              <OddsButton
                key={sel.id}
                label={label}
                odds={sel.odds}
                isSelected={isSelected(sel.id)}
                disabled={started}
                onPress={() => handlePress(sel)}
              />
            ) : null
          )}
        </View>
      )}

      {/* Markets count indicator */}
      <Text style={styles.marketsCount}>
        +{match.markets.length} marché{match.markets.length > 1 ? 's' : ''}{' '}
        →
      </Text>
    </TouchableOpacity>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const MatchCard = React.memo(MatchCardComponent);

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        dateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        date: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        liveBadge: {
          backgroundColor: colors.danger,
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        liveBadgeText: {
          color: colors.textOnPrimary,
          fontSize: 10,
          fontWeight: '700',
        },
        sportBadge: {
          backgroundColor: colors.primary + '20',
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        sportBadgeText: {
          color: colors.primary,
          fontSize: 10,
          fontWeight: '600',
        },
        teamsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        },
        teamName: {
          flex: 1,
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
        },
        vs: {
          fontSize: 14,
          color: colors.textTertiary,
          marginHorizontal: 8,
        },
        oddsRow: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        marketsCount: {
          fontSize: 12,
          color: colors.primary,
          textAlign: 'right',
        },
      }),
    [colors]
  );

export default MatchCard;

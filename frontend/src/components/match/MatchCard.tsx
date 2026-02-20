import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isMatchStarted(match: MatchDetail): boolean {
  return (
    match.status !== 'Scheduled' || new Date(match.startTime) <= new Date()
  );
}

// Get team initials for avatar placeholder
function getTeamInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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

  // MatchResult for football, MoneyLine for basketball/tennis
  const matchResult = match.markets.find((m) => m.type === 'MatchResult' || m.type === 'MoneyLine');
  const started = isMatchStarted(match);
  const hasNoDrawOption = match.sportCode !== 'FOOTBALL'; // Basketball, Tennis, Esport have no draw

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

  // Map MatchResult/MoneyLine selections to ordered 1 / X / 2
  const homeTeamSel = matchResult?.selections.find(
    (s) => s.label === match.homeTeam.name || s.label === match.homeTeam.shortName ||
           s.label === '1' || s.code === 'HOME' || s.code === 'HOME_WIN' || s.code === 'HOME_ML'
  );
  const drawSel = !hasNoDrawOption ? matchResult?.selections.find(
    (s) => s.label === 'Draw' || s.label === 'X' || s.code === 'X' || s.code === 'DRAW'
  ) : null;
  const awayTeamSel = matchResult?.selections.find(
    (s) => s.label === match.awayTeam.name || s.label === match.awayTeam.shortName ||
           s.label === '2' || s.code === 'AWAY' || s.code === 'AWAY_WIN' || s.code === 'AWAY_ML'
  );

  // For sports without draw, show only 1 and 2
  const oddsSelections = hasNoDrawOption
    ? [
        { sel: homeTeamSel, label: '1' },
        { sel: awayTeamSel, label: '2' },
      ]
    : [
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
      activeOpacity={0.85}
    >
      {/* Time badge - top right corner */}
      <View style={styles.timeBadge}>
        <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
        <Text style={styles.timeText}>{formatTime(match.startTime)}</Text>
      </View>

      {/* Live/Soon badge */}
      {started && (
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {match.status === 'Scheduled' ? 'Bientôt' : 'LIVE'}
          </Text>
        </View>
      )}

      {/* Teams section */}
      <View style={styles.teamsContainer}>
        {/* Home team */}
        <View style={styles.teamSection}>
          <View style={styles.teamAvatar}>
            <Text style={styles.teamInitials}>
              {getTeamInitials(match.homeTeam.name)}
            </Text>
          </View>
          <Text style={styles.teamName} numberOfLines={2}>
            {match.homeTeam.name}
          </Text>
        </View>

        {/* VS divider */}
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Away team */}
        <View style={styles.teamSection}>
          <View style={styles.teamAvatar}>
            <Text style={styles.teamInitials}>
              {getTeamInitials(match.awayTeam.name)}
            </Text>
          </View>
          <Text style={styles.teamName} numberOfLines={2}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Odds row */}
      {matchResult && (
        <View style={styles.oddsContainer}>
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

      {/* Footer - markets count */}
      <TouchableOpacity
        style={styles.footer}
        onPress={navigateToDetails}
        activeOpacity={0.7}
      >
        <Text style={styles.marketsText}>
          +{match.markets.length} marché{match.markets.length > 1 ? 's' : ''}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
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
          backgroundColor: `${colors.surface}F5`, // Slightly off-white
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          position: 'relative',
          // Subtle shadow
          ...Platform.select({
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        timeBadge: {
          position: 'absolute',
          top: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: `${colors.background}CC`,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
        },
        timeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
          letterSpacing: 0.3,
        },
        statusBadge: {
          position: 'absolute',
          top: 12,
          left: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: `${colors.danger}15`,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.danger,
        },
        statusText: {
          fontSize: 10,
          fontWeight: '700',
          color: colors.danger,
          letterSpacing: 0.5,
        },
        teamsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 32,
          marginBottom: 16,
          paddingHorizontal: 8,
        },
        teamSection: {
          flex: 1,
          alignItems: 'center',
          gap: 10,
        },
        teamAvatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${colors.primary}12`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: `${colors.primary}25`,
        },
        teamInitials: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.primary,
          letterSpacing: 0.5,
        },
        teamName: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 18,
        },
        vsContainer: {
          width: 40,
          alignItems: 'center',
        },
        vsText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textTertiary,
          letterSpacing: 1,
        },
        oddsContainer: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 12,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: `${colors.border}50`,
        },
        marketsText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
      }),
    [colors]
  );

export default MatchCard;

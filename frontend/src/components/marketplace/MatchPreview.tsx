import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { TicketSelectionDto } from '../../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
  HOCKEY: 'snow',
  BASEBALL: 'baseball',
  RUGBY: 'american-football',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatMatchDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getResultColor(result: string, colors: ThemeColors): string {
  switch (result) {
    case 'Win':
      return colors.success;
    case 'Lose':
      return colors.danger;
    default:
      return colors.warning;
  }
}

function getResultIcon(result: string): keyof typeof Ionicons.glyphMap {
  switch (result) {
    case 'Win':
      return 'checkmark-circle';
    case 'Lose':
      return 'close-circle';
    default:
      return 'time';
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface MatchPreviewProps {
  selection: TicketSelectionDto;
  matchIndex: number;
  sportCode?: string;
}

export const MatchPreview: React.FC<MatchPreviewProps> = React.memo(({
  selection,
  matchIndex,
  sportCode = 'FOOTBALL',
}) => {
  const { colors } = useTheme();

  const sportIcon = SPORT_ICONS[sportCode.toUpperCase()] || 'trophy';
  const resultColor = getResultColor(selection.result, colors);
  const resultIcon = getResultIcon(selection.result);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.matchIdContainer}>
          <Text style={[styles.matchId, { color: colors.primary }]}>
            #{matchIndex + 1}
          </Text>
          <View style={[styles.sportIconWrapper, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name={sportIcon} size={12} color={colors.primary} />
          </View>
        </View>

        <View style={styles.matchInfo}>
          <Text style={[styles.matchLabel, { color: colors.text }]} numberOfLines={1}>
            {selection.matchLabel || 'Match'}
          </Text>
          {selection.leagueName && (
            <Text style={[styles.leagueName, { color: colors.textSecondary }]} numberOfLines={1}>
              {selection.leagueName}
            </Text>
          )}
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={[styles.dateTime, { color: colors.textTertiary }]}>
            {formatMatchDate(selection.matchStartTime)}
          </Text>
        </View>
      </View>

      {/* Selection Row */}
      <View style={[styles.selectionRow, { borderTopColor: colors.border }]}>
        <View style={styles.selectionInfo}>
          <Text style={[styles.marketType, { color: colors.textSecondary }]}>
            {selection.marketType}
          </Text>
          <View style={styles.selectionLabelRow}>
            <Ionicons
              name={resultIcon}
              size={14}
              color={resultColor}
              style={styles.resultIcon}
            />
            <Text style={[styles.selectionLabel, { color: colors.text }]}>
              {selection.selectionLabel}
            </Text>
          </View>
        </View>

        {/* Odds Badge */}
        <LinearGradient
          colors={[colors.accent, `${colors.accent}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.oddsBadge}
        >
          <Ionicons name="star" size={10} color="#FFFFFF" />
          <Text style={styles.oddsText}>{selection.odds.toFixed(2)}</Text>
        </LinearGradient>
      </View>

      {/* Score display if match has started/ended */}
      {(selection.homeScore !== null || selection.awayScore !== null) && (
        <View style={[styles.scoreRow, { backgroundColor: colors.background }]}>
          <Ionicons name="football-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.scoreText, { color: colors.text }]}>
            Score: {selection.homeScore ?? '-'} - {selection.awayScore ?? '-'}
          </Text>
          <View style={[styles.resultBadge, { backgroundColor: `${resultColor}20` }]}>
            <Text style={[styles.resultText, { color: resultColor }]}>
              {selection.result === 'Pending' ? 'En cours' : selection.result === 'Win' ? 'Gagné' : 'Perdu'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

MatchPreview.displayName = 'MatchPreview';

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  matchIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchId: {
    fontSize: 12,
    fontWeight: '700',
  },
  sportIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  leagueName: {
    fontSize: 11,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontSize: 11,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  selectionInfo: {
    flex: 1,
    gap: 2,
  },
  marketType: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    marginRight: spacing.xs,
  },
  selectionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  oddsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  oddsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  resultText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MatchPreview;

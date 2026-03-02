import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors, spacing, radius, typography, fontWeight, palette } from '../../theme';
import type { UserGamificationDto } from '../../types/gamification.types';
import { XpProgressBar } from './XpProgressBar';

interface GamificationCardProps {
  gamification: UserGamificationDto;
  colors: ThemeColors;
  onBadgesPress?: () => void;
  onXpPress?: () => void;
}

export const GamificationCard: React.FC<GamificationCardProps> = ({
  gamification,
  colors,
  onBadgesPress,
  onXpPress,
}) => {
  const styles = useStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header with Level - clickable for XP guide */}
      <TouchableOpacity style={styles.header} onPress={onXpPress} activeOpacity={0.7}>
        <View style={styles.levelBadge}>
          <Ionicons name="star" size={16} color={palette.medal.gold} />
          <Text style={styles.levelText}>Niv. {gamification.level}</Text>
        </View>
        <Text style={styles.levelName}>{gamification.levelName}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>

      {/* XP Progress Bar - clickable for XP guide */}
      <TouchableOpacity onPress={onXpPress} activeOpacity={0.7}>
        <XpProgressBar
          currentXp={gamification.currentXp}
          xpForNextLevel={gamification.xpForNextLevel}
          level={gamification.level}
          colors={colors}
        />
      </TouchableOpacity>

      {/* Badges - centered under progress bar */}
      <TouchableOpacity style={styles.badgesContainer} onPress={onBadgesPress} activeOpacity={0.7}>
        <Ionicons name="ribbon" size={18} color={palette.category.buyer} />
        <Text style={styles.badgeValue}>{gamification.badgeCount}</Text>
        <Text style={styles.badgeLabelClickable}>badges →</Text>
      </TouchableOpacity>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.cardBg,
          borderRadius: radius.base,
          padding: spacing.base,
          borderWidth: 1,
          borderColor: colors.border,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
        },
        levelBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary + '20',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.base,
          gap: spacing.xs,
        },
        levelText: {
          ...typography.bodySmall,
          fontWeight: fontWeight.bold,
          color: colors.primary,
        },
        levelName: {
          ...typography.bodySmall,
          fontWeight: fontWeight.semibold,
          color: colors.textSecondary,
          marginLeft: spacing.sm,
        },
        badgesContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: spacing.xs,
        },
        badgeValue: {
          ...typography.h5,
          fontWeight: fontWeight.bold,
          color: colors.text,
        },
        badgeLabelClickable: {
          ...typography.caption,
          color: colors.primary,
          fontWeight: fontWeight.semibold,
        },
        chevron: {
          marginLeft: 'auto',
        },
      }),
    [colors]
  );

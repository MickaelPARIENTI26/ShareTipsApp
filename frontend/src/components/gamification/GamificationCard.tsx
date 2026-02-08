import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../../theme';
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
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header with Level - clickable for XP guide */}
      <TouchableOpacity style={styles.header} onPress={onXpPress} activeOpacity={0.7}>
        <View style={styles.levelBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
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

      {/* Streaks */}
      <View style={styles.streaksContainer}>
        <View style={styles.streakItem}>
          <Ionicons name="flame" size={18} color="#FF9500" />
          <Text style={styles.streakValue}>{gamification.currentDailyStreak}</Text>
          <Text style={styles.streakLabel}>jours</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.streakItem}>
          <Ionicons name="trophy" size={18} color="#FFD700" />
          <Text style={styles.streakValue}>{gamification.currentWinStreak}</Text>
          <Text style={styles.streakLabel}>wins</Text>
        </View>

        <View style={styles.divider} />

        {/* Badges - clickable */}
        <TouchableOpacity style={styles.streakItem} onPress={onBadgesPress} activeOpacity={0.7}>
          <Ionicons name="ribbon" size={18} color="#5856D6" />
          <Text style={styles.streakValue}>{gamification.badgeCount}</Text>
          <Text style={styles.streakLabelClickable}>badges →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    levelText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    levelName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 10,
    },
    streaksContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    streakItem: {
      alignItems: 'center',
      flex: 1,
    },
    streakValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    streakLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    streakLabelClickable: {
      fontSize: 11,
      color: colors.primary,
      marginTop: 2,
      fontWeight: '600',
    },
    chevron: {
      marginLeft: 'auto',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
  });

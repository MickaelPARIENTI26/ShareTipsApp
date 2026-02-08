import React from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import type { ThemeColors } from '../../theme';

interface XpProgressBarProps {
  currentXp: number;
  xpForNextLevel: number;
  level: number;
  colors: ThemeColors;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  currentXp,
  xpForNextLevel,
  level,
  colors,
}) => {
  const isMaxLevel = level >= 50;
  const progress = isMaxLevel ? 1 : Math.min(currentXp / xpForNextLevel, 1);
  const widthPercent = `${Math.round(progress * 100)}%` as DimensionValue;

  const styles = getStyles(colors);

  const formatXp = (xp: number) => xp.toLocaleString();

  return (
    <View style={styles.container}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: widthPercent }]} />
      </View>
      <View style={styles.xpInfo}>
        <Text style={styles.xpText}>
          {isMaxLevel ? 'MAX' : formatXp(currentXp) + ' / ' + formatXp(xpForNextLevel) + ' XP'}
        </Text>
        {!isMaxLevel && (
          <Text style={styles.remainingText}>
            {formatXp(xpForNextLevel - currentXp)} XP restants
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginVertical: 4,
    },
    progressBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    xpInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    xpText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    remainingText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });

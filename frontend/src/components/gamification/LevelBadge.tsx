import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '../../theme';

interface LevelBadgeProps {
  level: number;
  levelName: string;
  size?: 'small' | 'medium' | 'large';
  colors: ThemeColors;
}

const LEVEL_COLORS = [
  '#8E8E93', // 1-2: Gray
  '#34C759', // 3-4: Green
  '#007AFF', // 5-6: Blue
  '#5856D6', // 7-8: Purple
  '#FF9500', // 9-10: Orange
  '#FF3B30', // 11-12: Red
  '#AF52DE', // 13-14: Magenta
  '#FFD700', // 15-16: Gold
  '#00B4AA', // 17-18: Teal
  '#FF2D55', // 19-20: Pink
];

function getLevelColor(level: number): string {
  const index = Math.min(Math.floor((level - 1) / 2), LEVEL_COLORS.length - 1);
  return LEVEL_COLORS[index];
}

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  levelName,
  size = 'medium',
  colors,
}) => {
  const levelColor = getLevelColor(level);
  const styles = useStyles(colors, levelColor, size);

  return (
    <View style={styles.container}>
      <View style={styles.levelCircle}>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>
      {size !== 'small' && (
        <Text style={styles.levelName}>{levelName}</Text>
      )}
    </View>
  );
};

const useStyles = (colors: ThemeColors, levelColor: string, size: string) =>
  useMemo(() => {
    const circleSize = size === 'small' ? 28 : size === 'medium' ? 40 : 56;
    const fontSize = size === 'small' ? 12 : size === 'medium' ? 16 : 22;

    return StyleSheet.create({
      container: {
        alignItems: 'center',
        gap: size === 'small' ? 2 : 4,
      },
      levelCircle: {
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
        backgroundColor: levelColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: levelColor + '40',
      },
      levelNumber: {
        fontSize,
        fontWeight: '800',
        color: '#FFFFFF',
      },
      levelName: {
        fontSize: size === 'medium' ? 11 : 13,
        fontWeight: '600',
        color: levelColor,
        textAlign: 'center',
      },
    });
  }, [colors, levelColor, size]);

export default LevelBadge;

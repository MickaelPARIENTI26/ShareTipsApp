import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '../../theme';
import type { BadgeDto, UserBadgeDto } from '../../types/gamification.types';

interface BadgeCardProps {
  badge: BadgeDto | UserBadgeDto;
  earned?: boolean;
  earnedAt?: string;
  onPress?: () => void;
  colors: ThemeColors;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  earned = true,
  earnedAt,
  onPress,
  colors,
}) => {
  const styles = useStyles(colors, earned, badge.color);

  const iconName = badge.icon as keyof typeof Ionicons.glyphMap;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconName || 'medal'}
          size={28}
          color={earned ? badge.color : colors.textTertiary}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {badge.name}
      </Text>
      {earned && 'xpReward' in badge && badge.xpReward > 0 && (
        <Text style={styles.xpReward}>+{badge.xpReward} XP</Text>
      )}
      {!earned && (
        <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
};

const useStyles = (colors: ThemeColors, earned: boolean, badgeColor: string) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          padding: 12,
          backgroundColor: earned ? colors.surface : colors.surfaceSecondary,
          borderRadius: 12,
          borderWidth: earned ? 2 : 1,
          borderColor: earned ? badgeColor + '40' : colors.border,
          opacity: earned ? 1 : 0.6,
          minWidth: 90,
          gap: 6,
        },
        iconContainer: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: earned ? badgeColor + '20' : colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        name: {
          fontSize: 12,
          fontWeight: '600',
          color: earned ? colors.text : colors.textTertiary,
          textAlign: 'center',
        },
        xpReward: {
          fontSize: 10,
          fontWeight: '500',
          color: colors.primary,
        },
      }),
    [colors, earned, badgeColor]
  );

export default BadgeCard;

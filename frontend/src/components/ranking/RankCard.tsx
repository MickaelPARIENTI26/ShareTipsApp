import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface RankCardProps {
  rank: number;
  username: string;
  userId: string;
  totalTickets: number;
  winCount: number;
  loseCount: number;
  winRate: number;
  roi: number;
  avgOdds: number;
  isCurrentUser?: boolean;
  onPress: (userId: string, username: string) => void;
  animationDelay?: number;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const RankCard: React.FC<RankCardProps> = ({
  rank,
  username,
  userId,
  totalTickets,
  winCount,
  loseCount,
  winRate,
  roi,
  avgOdds,
  isCurrentUser = false,
  onPress,
  animationDelay = 0,
}) => {
  // Animations
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(userId, username);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.card,
          isCurrentUser && styles.cardCurrentUser,
        ]}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, isCurrentUser && styles.rankBadgeCurrentUser]}>
          <Text style={[styles.rankText, isCurrentUser && styles.rankTextCurrentUser]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <View style={[styles.avatar, isCurrentUser && styles.avatarCurrentUser]}>
          <Ionicons
            name="person"
            size={18}
            color={isCurrentUser ? DS.colors.green : DS.colors.textSecondary}
          />
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username} numberOfLines={1}>
              @{username}
            </Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Vous</Text>
              </View>
            )}
          </View>
          <Text style={styles.stats}>
            {totalTickets} tickets • {winCount}V/{loseCount}L
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: roi >= 0 ? DS.colors.green : '#EF4444' },
              ]}
            >
              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>ROI</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{winRate.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Win</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgOdds.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Cote</Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={DS.colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardCurrentUser: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderColor: DS.colors.green,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeCurrentUser: {
    backgroundColor: DS.colors.green,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: DS.colors.textSecondary,
  },
  rankTextCurrentUser: {
    color: DS.colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarCurrentUser: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 2,
    borderColor: DS.colors.green,
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: DS.colors.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DS.colors.white,
  },
  stats: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginRight: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: DS.colors.textSecondary,
    marginTop: 1,
  },
});

export default RankCard;

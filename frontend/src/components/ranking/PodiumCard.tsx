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
import { LinearGradient } from 'expo-linear-gradient';
import { DS } from '../../theme/designSystem';
import { palette } from '../../theme/colors';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface PodiumCardProps {
  rank: 1 | 2 | 3;
  username: string;
  userId: string;
  totalTickets: number;
  winRate: number;
  roi: number;
  avgOdds: number;
  onPress: (userId: string, username: string) => void;
  animationDelay?: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MEDAL_COLORS = {
  1: {
    primary: '#FFD700',
    secondary: '#FFA500',
    bg: 'rgba(255, 215, 0, 0.15)',
    glow: 'rgba(255, 215, 0, 0.5)',
    gradient: ['#FFD700', '#FFA500'] as const,
  },
  2: {
    primary: '#C0C0C0',
    secondary: '#A8A8A8',
    bg: 'rgba(192, 192, 192, 0.15)',
    glow: 'rgba(192, 192, 192, 0.4)',
    gradient: ['#C0C0C0', '#A8A8A8'] as const,
  },
  3: {
    primary: '#CD7F32',
    secondary: '#B8722D',
    bg: 'rgba(205, 127, 50, 0.15)',
    glow: 'rgba(205, 127, 50, 0.4)',
    gradient: ['#CD7F32', '#B8722D'] as const,
  },
};

const MEDAL_ICONS: Record<1 | 2 | 3, string> = {
  1: 'trophy',
  2: 'medal',
  3: 'medal-outline',
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const PodiumCard: React.FC<PodiumCardProps> = ({
  rank,
  username,
  userId,
  totalTickets,
  winRate,
  roi,
  avgOdds,
  onPress,
  animationDelay = 0,
}) => {
  const colors = MEDAL_COLORS[rank];
  const isChampion = rank === 1;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(rank === 2 ? -50 : rank === 3 ? 50 : 0)).current;
  const crownPulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Entrance animation
  useEffect(() => {
    const entranceDelay = animationDelay;

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: entranceDelay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isChampion ? 1.0 : 1.0,
        friction: 8,
        tension: 40,
        delay: entranceDelay,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 400,
        delay: entranceDelay,
        useNativeDriver: true,
      }),
    ]).start();

    // Crown pulse animation for #1
    if (isChampion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(crownPulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(crownPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const handlePress = () => {
    onPress(userId, username);
  };

  const cardSize = isChampion ? styles.cardChampion : styles.cardRegular;
  const avatarSize = isChampion ? 72 : 60;

  return (
    <Animated.View
      style={[
        styles.container,
        isChampion && styles.containerChampion,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateX: translateXAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {/* Glow Background for Champion */}
        {isChampion && (
          <Animated.View
            style={[
              styles.glowBackground,
              {
                backgroundColor: colors.glow,
                opacity: glowAnim,
              },
            ]}
          />
        )}

        <LinearGradient
          colors={[colors.bg, 'transparent']}
          style={[styles.card, cardSize]}
        >
          {/* Crown/Medal Icon */}
          <Animated.View
            style={[
              styles.medalContainer,
              isChampion && {
                transform: [{ scale: crownPulseAnim }],
              },
            ]}
          >
            {isChampion ? (
              <View style={[styles.crownWrapper, { backgroundColor: colors.primary }]}>
                <Ionicons name="trophy" size={28} color="#0A0F0C" />
              </View>
            ) : (
              <View style={[styles.medalWrapper, { backgroundColor: colors.bg, borderColor: colors.primary }]}>
                <Text style={[styles.rankNumber, { color: colors.primary }]}>{rank}</Text>
              </View>
            )}
          </Animated.View>

          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderColor: colors.primary,
              },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              style={styles.avatarGradient}
            >
              <Ionicons
                name="person"
                size={isChampion ? 32 : 26}
                color="#0A0F0C"
              />
            </LinearGradient>
          </View>

          {/* Username */}
          <Text
            style={[
              styles.username,
              isChampion && styles.usernameChampion,
            ]}
            numberOfLines={1}
          >
            @{username}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {winRate.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Win</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.bg }]} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: roi >= 0 ? DS.colors.green : '#EF4444' },
                ]}
              >
                {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>ROI</Text>
            </View>
          </View>

          {/* Tickets count */}
          <View style={[styles.ticketsBadge, { backgroundColor: colors.bg }]}>
            <Ionicons name="ticket" size={12} color={colors.primary} />
            <Text style={[styles.ticketsText, { color: colors.primary }]}>
              {totalTickets}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerChampion: {
    marginTop: -10,
    zIndex: 10,
  },
  touchable: {
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
      },
    }),
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    backgroundColor: DS.colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardChampion: {
    width: 130,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  cardRegular: {
    width: 110,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 10,
  },
  medalContainer: {
    marginBottom: 8,
  },
  crownWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  medalWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  avatar: {
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
    maxWidth: '100%',
  },
  usernameChampion: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
  },
  ticketsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketsText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default PodiumCard;

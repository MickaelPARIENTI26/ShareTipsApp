/**
 * PremiumBadge — Premium Badge Component
 *
 * A versatile badge component with multiple visual styles:
 * - live: Red pulsing badge for live events
 * - league: Glass background with primary text
 * - premium: Purple gradient with crown icon
 * - category: Colored background based on sport
 * - odds: Green bold odds display
 *
 * Supports animations, icons, and glassmorphism effects.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  useTheme,
  effectGradients,
  effectGlass,
  platformShadow,
  effectShadows,
  radius,
  spacing,
  typography,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type BadgeType = 'live' | 'league' | 'premium' | 'category' | 'odds' | 'hot' | 'new';

export type SportCategory =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'hockey'
  | 'baseball'
  | 'esports'
  | 'mma'
  | 'boxing'
  | 'rugby'
  | 'volleyball'
  | 'default';

export interface PremiumBadgeProps {
  /** Badge type */
  type: BadgeType;
  /** Label text (optional for some types) */
  label?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Enable animations */
  animated?: boolean;
  /** Sport category (for category type) */
  sport?: SportCategory;
  /** Odds value (for odds type) */
  odds?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Additional text styles */
  textStyle?: StyleProp<TextStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_COLORS: Record<SportCategory, { bg: string; text: string }> = {
  football: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  basketball: { bg: 'rgba(249, 115, 22, 0.15)', text: '#F97316' },
  tennis: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
  hockey: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  baseball: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  esports: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
  mma: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  boxing: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
  rugby: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  volleyball: { bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' },
  default: { bg: 'rgba(255, 255, 255, 0.10)', text: '#FFFFFF' },
};

const SIZE_CONFIG = {
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 10,
    iconSize: 10,
    dotSize: 4,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 11,
    iconSize: 12,
    dotSize: 6,
  },
  lg: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 13,
    iconSize: 14,
    dotSize: 8,
  },
};

// ═══════════════════════════════════════════════════════════════
// PULSING DOT COMPONENT
// ═══════════════════════════════════════════════════════════════

const PulsingDot: React.FC<{ size: number; color: string; animated: boolean }> = ({
  size,
  color,
  animated,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [animated, pulseAnim, opacityAnim]);

  return (
    <View style={styles.dotContainer}>
      {/* Pulsing ring */}
      {animated && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              backgroundColor: color,
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
      )}
      {/* Solid dot */}
      <View
        style={[
          styles.solidDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  type,
  label,
  icon,
  animated = true,
  sport = 'default',
  odds,
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Glow animation for live badge
  useEffect(() => {
    if (type !== 'live' || !animated) return;

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    glow.start();

    return () => glow.stop();
  }, [type, animated, glowAnim]);

  // ── Render based on type ───────────────────────────────────────

  // LIVE Badge
  if (type === 'live') {
    return (
      <Animated.View
        style={[
          styles.badge,
          styles.liveBadge,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            shadowOpacity: glowAnim,
          },
          style,
        ]}
      >
        <PulsingDot
          size={sizeConfig.dotSize}
          color="#FFFFFF"
          animated={animated}
        />
        <Text
          style={[
            styles.text,
            styles.liveText,
            { fontSize: sizeConfig.fontSize, marginLeft: spacing.xs },
            textStyle,
          ]}
        >
          {label || 'LIVE'}
        </Text>
      </Animated.View>
    );
  }

  // LEAGUE Badge (Glass)
  if (type === 'league') {
    return (
      <View
        style={[
          styles.badge,
          styles.glassBadge,
          effectGlass.light,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.text,
            styles.leagueText,
            {
              fontSize: sizeConfig.fontSize,
              color: colors.primary,
              marginLeft: icon ? spacing.xs : 0,
            },
            textStyle,
          ]}
        >
          {label?.toUpperCase()}
        </Text>
      </View>
    );
  }

  // PREMIUM Badge (Gradient)
  if (type === 'premium') {
    return (
      <LinearGradient
        colors={effectGradients.premium.colors as unknown as string[]}
        start={effectGradients.premium.start}
        end={effectGradients.premium.end}
        style={[
          styles.badge,
          styles.gradientBadge,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          platformShadow(effectShadows.glowPremiumSubtle),
          style,
        ]}
      >
        {icon || (
          <Ionicons
            name="crown"
            size={sizeConfig.iconSize}
            color="#FFFFFF"
          />
        )}
        <Text
          style={[
            styles.text,
            styles.premiumText,
            { fontSize: sizeConfig.fontSize, marginLeft: spacing.xs },
            textStyle,
          ]}
        >
          {label || 'PREMIUM'}
        </Text>
      </LinearGradient>
    );
  }

  // CATEGORY Badge (Sport-based)
  if (type === 'category') {
    const sportColors = SPORT_COLORS[sport] || SPORT_COLORS.default;

    return (
      <View
        style={[
          styles.badge,
          styles.categoryBadge,
          {
            backgroundColor: sportColors.bg,
            borderColor: sportColors.text,
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.text,
            {
              fontSize: sizeConfig.fontSize,
              color: sportColors.text,
              marginLeft: icon ? spacing.xs : 0,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }

  // ODDS Badge
  if (type === 'odds') {
    const displayOdds = odds !== undefined ? odds.toFixed(2) : label;

    return (
      <View
        style={[
          styles.badge,
          styles.oddsBadge,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            styles.oddsText,
            { fontSize: sizeConfig.fontSize + 2 },
            textStyle,
          ]}
        >
          {displayOdds}
        </Text>
      </View>
    );
  }

  // HOT Badge
  if (type === 'hot') {
    return (
      <LinearGradient
        colors={effectGradients.hot.colors as unknown as string[]}
        start={effectGradients.hot.start}
        end={effectGradients.hot.end}
        style={[
          styles.badge,
          styles.gradientBadge,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          platformShadow(effectShadows.glowAccentSubtle),
          style,
        ]}
      >
        {icon || (
          <Ionicons
            name="flame"
            size={sizeConfig.iconSize}
            color="#FFFFFF"
          />
        )}
        <Text
          style={[
            styles.text,
            styles.hotText,
            { fontSize: sizeConfig.fontSize, marginLeft: spacing.xs },
            textStyle,
          ]}
        >
          {label || 'HOT'}
        </Text>
      </LinearGradient>
    );
  }

  // NEW Badge
  if (type === 'new') {
    return (
      <LinearGradient
        colors={effectGradients.primary.colors as unknown as string[]}
        start={effectGradients.primary.start}
        end={effectGradients.primary.end}
        style={[
          styles.badge,
          styles.gradientBadge,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
          },
          platformShadow(effectShadows.glowPrimarySubtle),
          style,
        ]}
      >
        {icon || (
          <Ionicons
            name="sparkles"
            size={sizeConfig.iconSize}
            color="#000000"
          />
        )}
        <Text
          style={[
            styles.text,
            styles.newText,
            { fontSize: sizeConfig.fontSize, marginLeft: spacing.xs },
            textStyle,
          ]}
        >
          {label || 'NEW'}
        </Text>
      </LinearGradient>
    );
  }

  // Default fallback
  return (
    <View
      style={[
        styles.badge,
        styles.defaultBadge,
        {
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { fontSize: sizeConfig.fontSize, marginLeft: icon ? spacing.xs : 0 },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.label.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Live Badge ────────────────────────────────────────────────
  liveBadge: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Pulsing Dot ───────────────────────────────────────────────
  dotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  solidDot: {
    zIndex: 1,
  },

  // ── Glass Badge ───────────────────────────────────────────────
  glassBadge: {
    borderRadius: radius.sm,
  },
  leagueText: {
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  // ── Gradient Badge ────────────────────────────────────────────
  gradientBadge: {
    borderRadius: radius.sm,
  },
  premiumText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hotText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  newText: {
    color: '#000000',
    fontWeight: '700',
  },

  // ── Category Badge ────────────────────────────────────────────
  categoryBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
  },

  // ── Odds Badge ────────────────────────────────────────────────
  oddsBadge: {
    backgroundColor: 'rgba(30, 215, 96, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(30, 215, 96, 0.30)',
    borderRadius: radius.sm,
  },
  oddsText: {
    color: '#1ED760',
    fontWeight: '800',
    fontFamily: typography.mono?.fontFamily || 'monospace',
  },

  // ── Default Badge ─────────────────────────────────────────────
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // ── Icon Container ────────────────────────────────────────────
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Live event badge with pulsing animation */
export const LiveBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="live" {...props} />
);

/** League badge with glass effect */
export const LeagueBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="league" {...props} />
);

/** Premium/VIP badge with gradient */
export const VIPBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="premium" {...props} />
);

/** Sport category badge */
export const SportBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="category" {...props} />
);

/** Odds display badge */
export const OddsBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="odds" {...props} />
);

/** Hot/trending badge */
export const HotBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="hot" {...props} />
);

/** New item badge */
export const NewBadge: React.FC<Omit<PremiumBadgeProps, 'type'>> = (props) => (
  <PremiumBadge type="new" {...props} />
);

export default PremiumBadge;

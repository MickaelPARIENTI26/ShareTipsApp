/**
 * BadgeCard — Carte de badge gamification premium
 *
 * Affiche un badge avec son état (obtenu/verrouillé),
 * son icône, son nom et sa récompense XP.
 * Design premium avec plusieurs variantes et animations fluides.
 *
 * @example
 * // Badge obtenu
 * <BadgeCard badge={badge} earned onPress={handlePress} />
 *
 * @example
 * // Badge verrouillé, variante glass
 * <BadgeCard badge={badge} earned={false} variant="glass" />
 *
 * @example
 * // Variante compacte pour grille
 * <BadgeCard badge={badge} variant="compact" size="sm" />
 */

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  effectGradients,
  effectShadows,
  springConfigs,
} from '../../theme';
import type { BadgeDto, UserBadgeDto } from '../../types/gamification.types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type BadgeCardVariant = 'default' | 'glass' | 'compact' | 'detailed' | 'minimal';

/** Tailles disponibles */
export type BadgeCardSize = 'sm' | 'md' | 'lg';

/** Props du composant BadgeCard */
export interface BadgeCardProps {
  /** Données du badge */
  badge: BadgeDto | UserBadgeDto;
  /** Badge obtenu ou non */
  earned?: boolean;
  /** Date d'obtention */
  earnedAt?: string;
  /** Callback au press */
  onPress?: () => void;
  /** Couleurs du thème (rétro-compatibilité) */
  colors?: ThemeColors;
  /** Variante visuelle */
  variant?: BadgeCardVariant;
  /** Taille du composant */
  size?: BadgeCardSize;
  /** Active les animations */
  animated?: boolean;
  /** Affiche l'effet de brillance */
  showShine?: boolean;
  /** Affiche la date d'obtention */
  showDate?: boolean;
  /** Affiche la description */
  showDescription?: boolean;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Configuration des tailles */
const SIZE_CONFIG = {
  sm: {
    container: { padding: spacing.sm, minWidth: 80 },
    iconContainer: { width: 40, height: 40 },
    iconSize: 20,
    earnedBadgeSize: 14,
    checkSize: 6,
    nameSize: 10,
    xpSize: 8,
  },
  md: {
    container: { padding: spacing.md, minWidth: 100 },
    iconContainer: { width: 52, height: 52 },
    iconSize: 28,
    earnedBadgeSize: 16,
    checkSize: 8,
    nameSize: 12,
    xpSize: 10,
  },
  lg: {
    container: { padding: spacing.lg, minWidth: 120 },
    iconContainer: { width: 64, height: 64 },
    iconSize: 32,
    earnedBadgeSize: 20,
    checkSize: 10,
    nameSize: 14,
    xpSize: 12,
  },
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Indicateur de badge obtenu avec animation
 */
const EarnedIndicator: React.FC<{
  badgeColor: string;
  size: BadgeCardSize;
  animated: boolean;
  colors: ThemeColors;
}> = React.memo(({ badgeColor, size, animated, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const config = SIZE_CONFIG[size];

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.bouncy,
        delay: 200,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [animated, scaleAnim]);

  const indicatorStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: config.earnedBadgeSize,
          height: config.earnedBadgeSize,
          borderRadius: config.earnedBadgeSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: badgeColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
            },
            android: {
              elevation: 3,
            },
          }),
        },
      }),
    [config, colors, badgeColor]
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={[badgeColor, `${badgeColor}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={indicatorStyles.container}
      >
        <Ionicons name="checkmark" size={config.checkSize} color="#FFFFFF" />
      </LinearGradient>
    </Animated.View>
  );
});

/**
 * Badge de verrouillage
 */
const LockedIndicator: React.FC<{
  size: BadgeCardSize;
  colors: ThemeColors;
  variant: BadgeCardVariant;
}> = React.memo(({ size, colors, variant }) => {
  const config = SIZE_CONFIG[size];
  const isGlass = variant === 'glass';

  const lockStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: isGlass
            ? 'rgba(255, 255, 255, 0.1)'
            : colors.background,
          padding: spacing.xxs,
          borderRadius: radius.full,
          borderWidth: isGlass ? 1 : 0,
          borderColor: effectGlass.light.borderColor,
        },
      }),
    [colors, isGlass]
  );

  return (
    <View style={lockStyles.container}>
      <Ionicons
        name="lock-closed"
        size={config.xpSize}
        color={colors.textTertiary}
      />
    </View>
  );
});

/**
 * Badge XP reward
 */
const XpBadge: React.FC<{
  xp: number;
  size: BadgeCardSize;
  colors: ThemeColors;
  variant: BadgeCardVariant;
  animated: boolean;
}> = React.memo(({ xp, size, colors, variant, animated }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = SIZE_CONFIG[size];
  const isGlass = variant === 'glass';

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, pulseAnim]);

  const xpStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
          borderWidth: isGlass ? 1 : 0,
          borderColor: effectGlass.accent.borderColor,
        },
        gradient: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        text: {
          ...typography.badge,
          fontSize: config.xpSize,
          color: colors.accent,
          fontWeight: '700',
        },
      }),
    [config, colors, isGlass]
  );

  if (isGlass) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={xpStyles.gradient}
        >
          <Ionicons name="star" size={config.xpSize} color={colors.accent} />
          <Text style={xpStyles.text}>+{xp} XP</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        xpStyles.container,
        { backgroundColor: colors.accentBg, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Ionicons name="star" size={config.xpSize} color={colors.accent} />
      <Text style={xpStyles.text}>+{xp} XP</Text>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  earned = true,
  earnedAt,
  onPress,
  colors: colorsProp,
  variant = 'default',
  size = 'md',
  animated = true,
  showShine = true,
  showDate = false,
  showDescription = false,
  style,
}) => {
  // ── Theme et couleurs ────────────────────────────────────────
  const { colors: themeColors } = useTheme();
  const colors = colorsProp ?? themeColors;
  const styles = useStyles(colors, variant, size, earned, badge.color);
  const config = SIZE_CONFIG[size];

  // ── Animations ───────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(earned ? 1 : 0.6)).current;

  // Animation de brillance pour badges obtenus
  useEffect(() => {
    if (animated && earned && showShine) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
        ])
      ).start();
    }
  }, [animated, earned, showShine, shineAnim]);

  // ── Handlers ─────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        ...springConfigs.bouncy,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleAnim, animated, onPress]);

  const handlePressOut = useCallback(() => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.bouncy,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleAnim, animated, onPress]);

  // ── Computed values ──────────────────────────────────────────
  const iconName = badge.icon as keyof typeof Ionicons.glyphMap;
  const hasXpReward = earned && 'xpReward' in badge && badge.xpReward > 0;
  const hasDescription =
    showDescription && 'description' in badge && badge.description;

  // Format date d'obtention
  const formattedDate = useMemo(() => {
    if (!showDate || !earnedAt) return null;
    try {
      return new Date(earnedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [showDate, earnedAt]);

  // ── Render icon container ────────────────────────────────────
  const renderIconContainer = () => {
    const isGlass = variant === 'glass';

    const iconContainerContent = (
      <>
        <Ionicons
          name={iconName || 'medal'}
          size={config.iconSize}
          color={earned ? badge.color : colors.textTertiary}
        />
        {earned && (
          <EarnedIndicator
            badgeColor={badge.color}
            size={size}
            animated={animated}
            colors={colors}
          />
        )}
        {/* Effet de brillance */}
        {earned && showShine && (
          <Animated.View
            style={[
              styles.shineOverlay,
              {
                opacity: shineAnim,
                transform: [
                  {
                    translateX: shineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 50],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </>
    );

    if (isGlass && earned) {
      return (
        <View style={styles.iconContainerOuter}>
          <LinearGradient
            colors={[`${badge.color}30`, `${badge.color}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            {iconContainerContent}
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>{iconContainerContent}</View>
    );
  };

  // ── Render content ───────────────────────────────────────────
  const renderContent = () => (
    <>
      {renderIconContainer()}

      <Text style={styles.name} numberOfLines={variant === 'detailed' ? 3 : 2}>
        {badge.name}
      </Text>

      {hasDescription && (
        <Text style={styles.description} numberOfLines={2}>
          {badge.description}
        </Text>
      )}

      {formattedDate && <Text style={styles.date}>{formattedDate}</Text>}

      {hasXpReward && (
        <XpBadge
          xp={(badge as BadgeDto).xpReward}
          size={size}
          colors={colors}
          variant={variant}
          animated={animated}
        />
      )}

      {!earned && (
        <LockedIndicator size={size} colors={colors} variant={variant} />
      )}
    </>
  );

  // ── Render container basé sur variante ───────────────────────
  const renderContainer = () => {
    if (variant === 'glass' && Platform.OS === 'ios') {
      return (
        <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
          <View style={styles.glassOverlay}>{renderContent()}</View>
        </BlurView>
      );
    }

    if (variant === 'glass') {
      return (
        <LinearGradient
          colors={effectGradients.cardGlass.colors}
          start={effectGradients.cardGlass.start}
          end={effectGradients.cardGlass.end}
          style={styles.container}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return <View style={styles.container}>{renderContent()}</View>;
  };

  // ── Main render ──────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={onPress ? 0.9 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Badge ${badge.name}${earned ? ', obtenu' : ', verrouillé'}`}
      accessibilityState={{ selected: earned }}
    >
      <Animated.View
        style={[
          styles.wrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
          style,
        ]}
      >
        {renderContainer()}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: BadgeCardVariant,
  size: BadgeCardSize,
  earned: boolean,
  badgeColor: string
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];
    const isGlass = variant === 'glass';
    const isCompact = variant === 'compact';
    const isMinimal = variant === 'minimal';
    const isDetailed = variant === 'detailed';

    return StyleSheet.create({
      wrapper: {
        borderRadius: isCompact ? radius.md : radius.lg,
        overflow: 'hidden',
      },
      container: {
        alignItems: 'center',
        padding: isCompact ? spacing.sm : config.container.padding,
        backgroundColor: isGlass
          ? 'transparent'
          : earned
          ? colors.surface
          : colors.surfaceElevated,
        borderRadius: isCompact ? radius.md : radius.lg,
        borderWidth: isMinimal ? 0 : earned ? 2 : 1,
        borderColor: earned
          ? isGlass
            ? effectGlass.primary.borderColor
            : `${badgeColor}40`
          : colors.border,
        minWidth: isDetailed ? 140 : config.container.minWidth,
        gap: spacing.xs,
        ...Platform.select({
          ios: earned
            ? {
                shadowColor: badgeColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isGlass ? 0.3 : 0.2,
                shadowRadius: isGlass ? 12 : 8,
              }
            : {},
          android: earned
            ? {
                elevation: 4,
              }
            : {},
        }),
      },
      blurContainer: {
        borderRadius: isCompact ? radius.md : radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: effectGlass.card.borderColor,
      },
      glassOverlay: {
        alignItems: 'center',
        padding: isCompact ? spacing.sm : config.container.padding,
        gap: spacing.xs,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      },
      iconContainerOuter: {
        borderRadius: radius.full,
        overflow: 'hidden',
        ...Platform.select({
          ios: earned
            ? {
                shadowColor: badgeColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              }
            : {},
          android: earned
            ? {
                elevation: 3,
              }
            : {},
        }),
      },
      iconContainer: {
        width: config.iconContainer.width,
        height: config.iconContainer.height,
        borderRadius: radius.full,
        backgroundColor: earned
          ? isGlass
            ? 'transparent'
            : `${badgeColor}20`
          : colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: isMinimal ? 0 : earned ? 2 : 1,
        borderColor: earned
          ? isGlass
            ? effectGlass.primary.borderColor
            : `${badgeColor}30`
          : colors.border,
        overflow: 'hidden',
      },
      shineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        transform: [{ skewX: '-20deg' }],
        width: 20,
      },
      name: {
        ...typography.caption,
        fontSize: config.nameSize,
        fontWeight: '600',
        color: earned ? colors.text : colors.textTertiary,
        textAlign: 'center',
        lineHeight: config.nameSize * 1.3,
      },
      description: {
        ...typography.caption,
        fontSize: config.nameSize - 2,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: (config.nameSize - 2) * 1.4,
      },
      date: {
        ...typography.caption,
        fontSize: config.xpSize,
        color: colors.textTertiary,
        textAlign: 'center',
      },
    });
  }, [colors, variant, size, earned, badgeColor]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * BadgeCard par défaut
 */
export const DefaultBadgeCard: React.FC<BadgeCardProps> = (props) => (
  <BadgeCard {...props} variant="default" />
);

/**
 * BadgeCard avec effet glassmorphism
 */
export const GlassBadgeCard: React.FC<BadgeCardProps> = (props) => (
  <BadgeCard {...props} variant="glass" showShine />
);

/**
 * BadgeCard compact pour grilles
 */
export const CompactBadgeCard: React.FC<BadgeCardProps> = (props) => (
  <BadgeCard {...props} variant="compact" size="sm" showShine={false} />
);

/**
 * BadgeCard détaillé avec description
 */
export const DetailedBadgeCard: React.FC<BadgeCardProps> = (props) => (
  <BadgeCard {...props} variant="detailed" size="lg" showDescription showDate />
);

/**
 * BadgeCard minimal épuré
 */
export const MinimalBadgeCard: React.FC<BadgeCardProps> = (props) => (
  <BadgeCard {...props} variant="minimal" showShine={false} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(BadgeCard);

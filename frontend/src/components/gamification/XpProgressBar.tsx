/**
 * XpProgressBar — Barre de progression XP premium
 *
 * Affiche la progression d'expérience vers le prochain niveau
 * avec animations fluides et design premium.
 *
 * @example
 * // Utilisation standard
 * <XpProgressBar currentXp={750} xpForNextLevel={1000} level={5} />
 *
 * @example
 * // Variante glass avec animation de brillance
 * <XpProgressBar
 *   currentXp={750}
 *   xpForNextLevel={1000}
 *   level={5}
 *   variant="glass"
 *   showShine
 * />
 *
 * @example
 * // Variante compacte pour header
 * <XpProgressBar
 *   currentXp={750}
 *   xpForNextLevel={1000}
 *   level={5}
 *   variant="compact"
 *   size="sm"
 * />
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
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
  palette,
  effectGlass,
  effectGradients,
  springConfigs,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type XpProgressBarVariant = 'default' | 'glass' | 'minimal' | 'detailed' | 'compact';

/** Tailles disponibles */
export type XpProgressBarSize = 'sm' | 'md' | 'lg';

/** Props du composant XpProgressBar */
export interface XpProgressBarProps {
  /** XP actuel */
  currentXp: number;
  /** XP requis pour le prochain niveau */
  xpForNextLevel: number;
  /** Niveau actuel */
  level: number;
  /** Couleurs du thème (rétro-compatibilité) */
  colors?: ThemeColors;
  /** Variante visuelle */
  variant?: XpProgressBarVariant;
  /** Taille du composant */
  size?: XpProgressBarSize;
  /** Active les animations */
  animated?: boolean;
  /** Affiche l'effet de brillance animé */
  showShine?: boolean;
  /** Affiche le label XP */
  showLabel?: boolean;
  /** Affiche le pourcentage */
  showPercent?: boolean;
  /** Affiche les XP restants */
  showRemaining?: boolean;
  /** Niveau maximum */
  maxLevel?: number;
  /** Callback au press */
  onPress?: () => void;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Configuration des tailles */
const SIZE_CONFIG = {
  sm: {
    barHeight: 8,
    iconSize: 10,
    labelSize: 10,
    percentSize: 10,
    xpSize: 11,
    remainingPadding: { h: spacing.xs, v: 2 },
  },
  md: {
    barHeight: 12,
    iconSize: 12,
    labelSize: 11,
    percentSize: 11,
    xpSize: 12,
    remainingPadding: { h: spacing.sm, v: spacing.xxs },
  },
  lg: {
    barHeight: 16,
    iconSize: 14,
    labelSize: 12,
    percentSize: 12,
    xpSize: 14,
    remainingPadding: { h: spacing.md, v: spacing.xs },
  },
};

/** Gradients de progression par palier */
const PROGRESS_GRADIENTS = {
  low: [palette.green[400], palette.green[600]] as const,
  medium: [palette.blue[400], palette.blue[600]] as const,
  high: ['#8B5CF6', '#7C3AED'] as const,
  max: ['#F59E0B', '#D97706'] as const,
};

/**
 * Obtient le gradient basé sur le niveau
 */
function getProgressGradient(level: number): readonly [string, string] {
  if (level >= 40) return PROGRESS_GRADIENTS.max;
  if (level >= 20) return PROGRESS_GRADIENTS.high;
  if (level >= 10) return PROGRESS_GRADIENTS.medium;
  return PROGRESS_GRADIENTS.low;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Effet de brillance animé
 */
const ShineEffect: React.FC<{
  animated: boolean;
  progress: number;
}> = React.memo(({ animated, progress }) => {
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && progress > 0.1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      ).start();
    }
  }, [animated, progress, shineAnim]);

  const translateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 300],
  });

  if (progress <= 0.1) return null;

  return (
    <Animated.View
      style={[
        shineStyles.container,
        { transform: [{ translateX }] },
      ]}
    />
  );
});

const shineStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
});

/**
 * Badge "XP restants"
 */
const RemainingBadge: React.FC<{
  remaining: number;
  size: XpProgressBarSize;
  colors: ThemeColors;
  variant: XpProgressBarVariant;
}> = React.memo(({ remaining, size, colors, variant }) => {
  const config = SIZE_CONFIG[size];
  const isGlass = variant === 'glass';

  const formatXp = useCallback((xp: number) => xp.toLocaleString('fr-FR'), []);

  const badgeStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: config.remainingPadding.h,
          paddingVertical: config.remainingPadding.v,
          borderRadius: radius.full,
          backgroundColor: isGlass
            ? 'rgba(251, 191, 36, 0.15)'
            : colors.accentBg,
          borderWidth: isGlass ? 1 : 0,
          borderColor: effectGlass.accent.borderColor,
        },
        text: {
          ...typography.caption,
          fontSize: config.labelSize,
          fontWeight: '600',
          color: colors.accent,
        },
      }),
    [config, colors, isGlass]
  );

  return (
    <View style={badgeStyles.container}>
      <Ionicons name="arrow-up-circle" size={config.iconSize} color={colors.accent} />
      <Text style={badgeStyles.text}>{formatXp(remaining)} restants</Text>
    </View>
  );
});

/**
 * Badge "Niveau MAX"
 */
const MaxLevelBadge: React.FC<{
  size: XpProgressBarSize;
  colors: ThemeColors;
  variant: XpProgressBarVariant;
  animated: boolean;
}> = React.memo(({ size, colors, variant, animated }) => {
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

  const badgeStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: config.remainingPadding.h,
          paddingVertical: config.remainingPadding.v,
          borderRadius: radius.full,
        },
        gradient: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: config.remainingPadding.h,
          paddingVertical: config.remainingPadding.v,
          borderRadius: radius.full,
        },
        text: {
          ...typography.badge,
          fontSize: config.labelSize,
          color: '#FFFFFF',
          letterSpacing: 1,
          fontWeight: '800',
        },
      }),
    [config]
  );

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <LinearGradient
        colors={effectGradients.accent.colors}
        start={effectGradients.accent.start}
        end={effectGradients.accent.end}
        style={badgeStyles.gradient}
      >
        <Ionicons name="trophy" size={config.iconSize} color="#FFFFFF" />
        <Text style={badgeStyles.text}>NIVEAU MAX</Text>
      </LinearGradient>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  currentXp,
  xpForNextLevel,
  level,
  colors: colorsProp,
  variant = 'default',
  size = 'md',
  animated = true,
  showShine = true,
  showLabel = true,
  showPercent = true,
  showRemaining = true,
  maxLevel = 50,
  onPress,
  style,
}) => {
  // ── Theme et couleurs ────────────────────────────────────────
  const { colors: themeColors } = useTheme();
  const colors = colorsProp ?? themeColors;
  const styles = useStyles(colors, variant, size);
  const config = SIZE_CONFIG[size];

  // ── Valeurs calculées ────────────────────────────────────────
  const isMaxLevel = level >= maxLevel;
  const progress = isMaxLevel ? 1 : Math.min(currentXp / xpForNextLevel, 1);
  const progressGradient = getProgressGradient(level);
  const remaining = Math.max(xpForNextLevel - currentXp, 0);

  // ── Animations ───────────────────────────────────────────────
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animation de la barre de progression
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Glow effect quand progression change
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated, animatedWidth, glowAnim]);

  // ── Handlers ─────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
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

  // ── Format helpers ───────────────────────────────────────────
  const formatXp = useCallback((xp: number) => xp.toLocaleString('fr-FR'), []);

  // ── Interpolations ───────────────────────────────────────────
  const animatedWidthStyle = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Render label row ─────────────────────────────────────────
  const renderLabelRow = () => {
    if (variant === 'compact' || variant === 'minimal') return null;
    if (!showLabel && !showPercent) return null;

    return (
      <View style={styles.labelRow}>
        {showLabel && (
          <View style={styles.xpLabel}>
            <LinearGradient
              colors={progressGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.xpLabelGradient}
            >
              <Ionicons name="flash" size={config.iconSize} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.xpLabelText}>XP</Text>
          </View>
        )}
        {showPercent && (
          <View style={styles.percentBadge}>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ── Render progress bar ──────────────────────────────────────
  const renderProgressBar = () => {
    const isGlass = variant === 'glass';

    const barContent = (
      <>
        <Animated.View
          style={[styles.progressFillWrapper, { width: animatedWidthStyle }]}
        >
          <LinearGradient
            colors={progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </Animated.View>

        {/* Shine effect */}
        {showShine && (
          <ShineEffect animated={animated} progress={progress} />
        )}

        {/* Static shine overlay */}
        {progress > 0.05 && (
          <View style={styles.shineOverlay} />
        )}

        {/* Glow pulse on progress change */}
        <Animated.View
          style={[
            styles.glowPulse,
            {
              opacity: glowAnim,
              backgroundColor: progressGradient[0],
            },
          ]}
        />
      </>
    );

    if (isGlass && Platform.OS === 'ios') {
      return (
        <BlurView intensity={20} tint="dark" style={styles.progressBackgroundGlass}>
          {barContent}
        </BlurView>
      );
    }

    return <View style={styles.progressBackground}>{barContent}</View>;
  };

  // ── Render XP info ───────────────────────────────────────────
  const renderXpInfo = () => {
    if (variant === 'compact') return null;

    return (
      <View style={styles.xpInfo}>
        {isMaxLevel ? (
          <MaxLevelBadge
            size={size}
            colors={colors}
            variant={variant}
            animated={animated}
          />
        ) : (
          <>
            <Text style={styles.xpText}>
              <Text style={styles.currentXp}>{formatXp(currentXp)}</Text>
              <Text style={styles.xpDivider}> / </Text>
              <Text style={styles.targetXp}>{formatXp(xpForNextLevel)}</Text>
            </Text>
            {showRemaining && (
              <RemainingBadge
                remaining={remaining}
                size={size}
                colors={colors}
                variant={variant}
              />
            )}
          </>
        )}
      </View>
    );
  };

  // ── Render detailed variant extras ───────────────────────────
  const renderDetailedExtras = () => {
    if (variant !== 'detailed') return null;

    const xpPerPercent = Math.ceil(xpForNextLevel / 100);

    return (
      <View style={styles.detailedRow}>
        <View style={styles.detailedItem}>
          <Text style={styles.detailedLabel}>Niveau</Text>
          <Text style={styles.detailedValue}>{level}</Text>
        </View>
        <View style={styles.detailedDivider} />
        <View style={styles.detailedItem}>
          <Text style={styles.detailedLabel}>XP / %</Text>
          <Text style={styles.detailedValue}>{xpPerPercent}</Text>
        </View>
        <View style={styles.detailedDivider} />
        <View style={styles.detailedItem}>
          <Text style={styles.detailedLabel}>Progression</Text>
          <Text style={styles.detailedValue}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    );
  };

  // ── Main content ─────────────────────────────────────────────
  const content = (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progression XP: ${Math.round(progress * 100)}%, ${formatXp(currentXp)} sur ${formatXp(xpForNextLevel)}`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(progress * 100),
      }}
    >
      {renderLabelRow()}
      {renderProgressBar()}
      {renderXpInfo()}
      {renderDetailedExtras()}
    </Animated.View>
  );

  // ── Wrap with TouchableOpacity if pressable ──────────────────
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityHint="Appuyer pour plus de détails sur votre progression"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: XpProgressBarVariant,
  size: XpProgressBarSize
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];
    const isGlass = variant === 'glass';
    const isMinimal = variant === 'minimal';
    const isCompact = variant === 'compact';
    const isDetailed = variant === 'detailed';

    return StyleSheet.create({
      container: {
        marginVertical: isCompact ? 0 : spacing.xs,
        padding: isDetailed ? spacing.md : 0,
        backgroundColor: isDetailed
          ? isGlass
            ? 'rgba(0, 0, 0, 0.2)'
            : colors.surface
          : 'transparent',
        borderRadius: isDetailed ? radius.lg : 0,
        borderWidth: isDetailed ? 1 : 0,
        borderColor: isGlass
          ? effectGlass.card.borderColor
          : colors.border,
      },
      labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
      },
      xpLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      },
      xpLabelGradient: {
        width: config.iconSize + 8,
        height: config.iconSize + 8,
        borderRadius: (config.iconSize + 8) / 2,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
          ios: {
            shadowColor: palette.green[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
          android: {
            elevation: 3,
          },
        }),
      },
      xpLabelText: {
        ...typography.label,
        fontSize: config.labelSize,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.5,
      },
      percentBadge: {
        backgroundColor: isGlass
          ? 'rgba(255, 255, 255, 0.1)'
          : colors.surfaceElevated,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        borderWidth: isGlass ? 1 : 0,
        borderColor: effectGlass.light.borderColor,
      },
      progressPercent: {
        ...typography.badge,
        fontSize: config.percentSize,
        color: colors.textSecondary,
        fontWeight: '700',
      },
      progressBackground: {
        height: config.barHeight,
        backgroundColor: isGlass
          ? 'rgba(255, 255, 255, 0.1)'
          : colors.surfaceElevated,
        borderRadius: radius.full,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: isMinimal ? 0 : 1,
        borderColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
        ...Platform.select({
          ios: isGlass
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }
            : {},
        }),
      },
      progressBackgroundGlass: {
        height: config.barHeight,
        borderRadius: radius.full,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: effectGlass.light.borderColor,
      },
      progressFillWrapper: {
        height: '100%',
        borderRadius: radius.full,
        overflow: 'hidden',
      },
      progressFill: {
        flex: 1,
        borderRadius: radius.full,
      },
      shineOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderTopLeftRadius: radius.full,
        borderTopRightRadius: radius.full,
      },
      glowPulse: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: radius.full,
        ...Platform.select({
          ios: {
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          },
        }),
      },
      xpInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        flexWrap: 'wrap',
        gap: spacing.xs,
      },
      xpText: {
        ...typography.bodySmall,
        fontSize: config.xpSize,
        fontWeight: '600',
        color: colors.text,
      },
      currentXp: {
        fontWeight: '800',
        color: colors.primary,
      },
      xpDivider: {
        color: colors.textTertiary,
        fontWeight: '400',
      },
      targetXp: {
        fontWeight: '600',
        color: colors.textSecondary,
      },
      detailedRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
      },
      detailedItem: {
        alignItems: 'center',
        flex: 1,
      },
      detailedDivider: {
        width: 1,
        height: 30,
        backgroundColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
      },
      detailedLabel: {
        ...typography.caption,
        fontSize: config.labelSize - 1,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xxs,
      },
      detailedValue: {
        ...typography.h4,
        fontSize: config.xpSize + 2,
        color: colors.text,
        fontWeight: '800',
      },
    });
  }, [colors, variant, size]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * XpProgressBar par défaut
 */
export const DefaultXpProgressBar: React.FC<XpProgressBarProps> = (props) => (
  <XpProgressBar {...props} variant="default" />
);

/**
 * XpProgressBar avec effet glassmorphism
 */
export const GlassXpProgressBar: React.FC<XpProgressBarProps> = (props) => (
  <XpProgressBar {...props} variant="glass" showShine />
);

/**
 * XpProgressBar minimal épuré
 */
export const MinimalXpProgressBar: React.FC<XpProgressBarProps> = (props) => (
  <XpProgressBar
    {...props}
    variant="minimal"
    showLabel={false}
    showPercent={false}
    showRemaining={false}
    showShine={false}
  />
);

/**
 * XpProgressBar compact pour headers
 */
export const CompactXpProgressBar: React.FC<XpProgressBarProps> = (props) => (
  <XpProgressBar
    {...props}
    variant="compact"
    size="sm"
    showLabel={false}
    showPercent={false}
    showRemaining={false}
  />
);

/**
 * XpProgressBar détaillé avec stats
 */
export const DetailedXpProgressBar: React.FC<XpProgressBarProps> = (props) => (
  <XpProgressBar {...props} variant="detailed" size="lg" />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(XpProgressBar);

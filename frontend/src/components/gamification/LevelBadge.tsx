/**
 * LevelBadge — Badge de niveau gamification premium
 *
 * Affiche le niveau de l'utilisateur avec un design circulaire coloré,
 * une étoile pour les niveaux élevés et le nom du niveau.
 * Design premium avec plusieurs variantes et animations fluides.
 *
 * @example
 * // Badge standard
 * <LevelBadge level={5} levelName="Expert" />
 *
 * @example
 * // Variante glass avec animation
 * <LevelBadge level={12} levelName="Maître" variant="glass" animated />
 *
 * @example
 * // Badge compact sans nom
 * <LevelBadge level={3} levelName="Débutant" size="small" />
 */

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
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
  effectGlass,
  effectGradients,
  springConfigs,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type LevelBadgeVariant = 'default' | 'glass' | 'minimal' | 'detailed' | 'outline';

/** Tailles disponibles (rétro-compatibles) */
export type LevelBadgeSize = 'small' | 'medium' | 'large';

/** Props du composant LevelBadge */
export interface LevelBadgeProps {
  /** Niveau de l'utilisateur */
  level: number;
  /** Nom du niveau */
  levelName: string;
  /** Taille du badge */
  size?: LevelBadgeSize;
  /** Couleurs du thème (rétro-compatibilité) */
  colors?: ThemeColors;
  /** Variante visuelle */
  variant?: LevelBadgeVariant;
  /** Active les animations */
  animated?: boolean;
  /** Affiche le glow pulsant */
  showGlow?: boolean;
  /** Affiche l'étoile pour tous les niveaux */
  alwaysShowStar?: boolean;
  /** Seuil de niveau pour l'étoile */
  starThreshold?: number;
  /** Affiche la progression vers le prochain niveau */
  showProgress?: boolean;
  /** Progression actuelle (0-1) */
  progress?: number;
  /** Callback au press */
  onPress?: () => void;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Couleurs par palier de niveau */
const LEVEL_COLORS: readonly string[] = [
  '#6B7280', // 1-2: Gray (Débutant)
  '#10B981', // 3-4: Emerald (Novice)
  '#3B82F6', // 5-6: Blue (Amateur)
  '#8B5CF6', // 7-8: Violet (Confirmé)
  '#F59E0B', // 9-10: Amber (Expert)
  '#EF4444', // 11-12: Red (Maître)
  '#EC4899', // 13-14: Pink (Grand Maître)
  '#F59E0B', // 15-16: Gold (Légende)
  '#14B8A6', // 17-18: Teal (Mythique)
  '#F43F5E', // 19-20: Rose (Divin)
];

/** Gradients premium pour chaque palier */
const LEVEL_GRADIENTS: Record<number, readonly [string, string]> = {
  0: ['#6B7280', '#4B5563'],
  1: ['#10B981', '#059669'],
  2: ['#3B82F6', '#2563EB'],
  3: ['#8B5CF6', '#7C3AED'],
  4: ['#F59E0B', '#D97706'],
  5: ['#EF4444', '#DC2626'],
  6: ['#EC4899', '#DB2777'],
  7: ['#F59E0B', '#B45309'],
  8: ['#14B8A6', '#0D9488'],
  9: ['#F43F5E', '#E11D48'],
};

/** Configuration des tailles */
const SIZE_CONFIG = {
  small: {
    circleSize: 32,
    innerSize: 26,
    fontSize: 13,
    starSize: 14,
    starIconSize: 8,
    nameSize: 9,
    ringWidth: 3,
  },
  medium: {
    circleSize: 48,
    innerSize: 40,
    fontSize: 18,
    starSize: 18,
    starIconSize: 10,
    nameSize: 11,
    ringWidth: 4,
  },
  large: {
    circleSize: 64,
    innerSize: 54,
    fontSize: 26,
    starSize: 22,
    starIconSize: 12,
    nameSize: 13,
    ringWidth: 5,
  },
};

/**
 * Obtient la couleur associée au niveau
 */
function getLevelColor(level: number): string {
  const index = Math.min(Math.floor((level - 1) / 2), LEVEL_COLORS.length - 1);
  return LEVEL_COLORS[index];
}

/**
 * Obtient le gradient associé au niveau
 */
function getLevelGradient(level: number): readonly [string, string] {
  const index = Math.min(Math.floor((level - 1) / 2), Object.keys(LEVEL_GRADIENTS).length - 1);
  return LEVEL_GRADIENTS[index] ?? LEVEL_GRADIENTS[0];
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Étoile animée pour les niveaux élevés
 */
const StarBadge: React.FC<{
  size: LevelBadgeSize;
  colors: ThemeColors;
  animated: boolean;
  variant: LevelBadgeVariant;
}> = React.memo(({ size, colors, animated, variant }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const config = SIZE_CONFIG[size];
  const isGlass = variant === 'glass';

  useEffect(() => {
    if (animated) {
      // Animation d'entrée
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.bouncy,
        delay: 300,
        useNativeDriver: true,
      }).start();

      // Animation de rotation subtile
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [animated, scaleAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const starStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          top: -2,
          right: -2,
          width: config.starSize,
          height: config.starSize,
          borderRadius: config.starSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        gradient: {
          width: '100%',
          height: '100%',
          borderRadius: config.starSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [config, colors]
  );

  return (
    <Animated.View
      style={[
        starStyles.container,
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      <LinearGradient
        colors={effectGradients.accent.colors}
        start={effectGradients.accent.start}
        end={effectGradients.accent.end}
        style={starStyles.gradient}
      >
        <Ionicons name="star" size={config.starIconSize} color="#FFFFFF" />
      </LinearGradient>
    </Animated.View>
  );
});

StarBadge.displayName = 'StarBadge';

/**
 * Anneau de progression
 */
const ProgressRing: React.FC<{
  progress: number;
  size: LevelBadgeSize;
  levelColor: string;
}> = React.memo(({ progress, size, levelColor }) => {
  const config = SIZE_CONFIG[size];
  const circumference = 2 * Math.PI * (config.circleSize / 2 - config.ringWidth / 2);
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  // Using a simple View-based progress indicator
  const progressStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          width: config.circleSize,
          height: config.circleSize,
          borderRadius: config.circleSize / 2,
          borderWidth: config.ringWidth,
          borderColor: `${levelColor}30`,
        },
        progress: {
          position: 'absolute',
          width: config.circleSize,
          height: config.circleSize,
          borderRadius: config.circleSize / 2,
          borderWidth: config.ringWidth,
          borderColor: levelColor,
          borderTopColor: 'transparent',
          borderRightColor: progress > 0.25 ? levelColor : 'transparent',
          borderBottomColor: progress > 0.5 ? levelColor : 'transparent',
          borderLeftColor: progress > 0.75 ? levelColor : 'transparent',
          transform: [{ rotate: '-90deg' }],
        },
      }),
    [config, levelColor, progress]
  );

  return (
    <>
      <View style={progressStyles.container} />
      <View style={progressStyles.progress} />
    </>
  );
});

ProgressRing.displayName = 'ProgressRing';

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  levelName,
  size = 'medium',
  colors: colorsProp,
  variant = 'default',
  animated = true,
  showGlow = true,
  alwaysShowStar = false,
  starThreshold = 10,
  showProgress = false,
  progress = 0,
  onPress,
  style,
}) => {
  // ── Theme et couleurs ────────────────────────────────────────
  const { colors: themeColors } = useTheme();
  const colors = colorsProp ?? themeColors;
  const levelColor = getLevelColor(level);
  const levelGradient = getLevelGradient(level);
  const styles = useStyles(colors, levelColor, size, variant);
  const config = SIZE_CONFIG[size];

  // ── Animations ───────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation de glow pulsant
  useEffect(() => {
    if (animated && showGlow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, showGlow, glowAnim]);

  // Animation de pulse pour les hauts niveaux
  useEffect(() => {
    if (animated && level >= starThreshold) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, level, starThreshold, pulseAnim]);

  // ── Handlers ─────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.92,
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
  const showStar = alwaysShowStar || level >= starThreshold;
  const showName = size !== 'small' && variant !== 'minimal';
  const isGlass = variant === 'glass';
  const isOutline = variant === 'outline';

  // ── Render circle content ────────────────────────────────────
  const renderCircleContent = () => (
    <>
      {/* Anneau de progression */}
      {showProgress && (
        <ProgressRing progress={progress} size={size} levelColor={levelColor} />
      )}

      {/* Cercle intérieur avec gradient */}
      <LinearGradient
        colors={isOutline ? ['transparent', 'transparent'] : levelGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innerCircle}
      >
        <Text style={styles.levelNumber}>{level}</Text>
      </LinearGradient>

      {/* Badge étoile */}
      {showStar && (
        <StarBadge
          size={size}
          colors={colors}
          animated={animated}
          variant={variant}
        />
      )}
    </>
  );

  // ── Render main circle ───────────────────────────────────────
  const renderCircle = () => {
    if (isGlass && Platform.OS === 'ios') {
      return (
        <Animated.View
          style={[
            styles.levelCircleWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={styles.blurCircle}>
            <View style={styles.glassOverlay}>{renderCircleContent()}</View>
          </BlurView>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.levelCircle,
          { transform: [{ scale: pulseAnim }], opacity: glowAnim.interpolate({
            inputRange: [0.3, 0.6],
            outputRange: [1, 1],
          }) },
        ]}
      >
        {renderCircleContent()}
      </Animated.View>
    );
  };

  // ── Render name badge ────────────────────────────────────────
  const renderNameBadge = () => {
    if (!showName) return null;

    if (isGlass) {
      return (
        <LinearGradient
          colors={[`${levelColor}25`, `${levelColor}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nameContainerGlass}
        >
          <Text style={styles.levelName}>{levelName}</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.nameContainer}>
        <Text style={styles.levelName}>{levelName}</Text>
      </View>
    );
  };

  // ── Render detailed variant ──────────────────────────────────
  const renderDetailedContent = () => {
    if (variant !== 'detailed') return null;

    return (
      <View style={styles.detailedInfo}>
        <Text style={styles.detailedLabel}>Niveau</Text>
        <Text style={styles.detailedValue}>{level}</Text>
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
      accessibilityRole="text"
      accessibilityLabel={`Niveau ${level}, ${levelName}`}
    >
      {/* Glow effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowEffect,
            { opacity: glowAnim },
          ]}
        />
      )}

      {renderCircle()}
      {renderNameBadge()}
      {renderDetailedContent()}
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
        accessibilityLabel={`Niveau ${level}, ${levelName}. Appuyer pour plus de détails.`}
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
  levelColor: string,
  size: LevelBadgeSize,
  variant: LevelBadgeVariant
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];
    const isGlass = variant === 'glass';
    const isOutline = variant === 'outline';
    const isMinimal = variant === 'minimal';
    const isDetailed = variant === 'detailed';

    return StyleSheet.create({
      container: {
        alignItems: 'center',
        gap: size === 'small' ? spacing.xxs : spacing.xs,
      },
      glowEffect: {
        position: 'absolute',
        width: config.circleSize + 20,
        height: config.circleSize + 20,
        borderRadius: (config.circleSize + 20) / 2,
        backgroundColor: levelColor,
        top: -10,
        ...Platform.select({
          ios: {
            shadowColor: levelColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
          },
        }),
      },
      levelCircleWrapper: {
        width: config.circleSize,
        height: config.circleSize,
        borderRadius: config.circleSize / 2,
        overflow: 'hidden',
      },
      levelCircle: {
        width: config.circleSize,
        height: config.circleSize,
        borderRadius: config.circleSize / 2,
        backgroundColor: isGlass
          ? 'rgba(0, 0, 0, 0.3)'
          : isOutline
          ? 'transparent'
          : `${levelColor}30`,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: isOutline ? 2 : 0,
        borderColor: levelColor,
        ...(Platform.OS === 'ios' && !isMinimal
          ? {
              shadowColor: levelColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isGlass ? 0.4 : 0.3,
              shadowRadius: isGlass ? 12 : 8,
            }
          : {}),
        ...(Platform.OS === 'android' && !isMinimal ? { elevation: 6 } : {}),
      },
      blurCircle: {
        width: '100%',
        height: '100%',
        borderRadius: config.circleSize / 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: effectGlass.primary.borderColor,
      },
      glassOverlay: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      },
      innerCircle: {
        width: config.innerSize,
        height: config.innerSize,
        borderRadius: config.innerSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isOutline ? 0 : 2,
        borderColor: isGlass
          ? effectGlass.primary.borderColor
          : `${levelColor}80`,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          },
        }),
      },
      levelNumber: {
        fontSize: config.fontSize,
        fontWeight: '800',
        color: isOutline ? levelColor : '#FFFFFF',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      nameContainer: {
        backgroundColor: `${levelColor}15`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: `${levelColor}20`,
      },
      nameContainerGlass: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: effectGlass.primary.borderColor,
      },
      levelName: {
        ...typography.caption,
        fontSize: config.nameSize,
        fontWeight: '700',
        color: levelColor,
        textAlign: 'center',
        letterSpacing: 0.3,
      },
      detailedInfo: {
        alignItems: 'center',
        marginTop: spacing.xs,
      },
      detailedLabel: {
        ...typography.caption,
        fontSize: config.nameSize - 2,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
      detailedValue: {
        ...typography.h3,
        color: levelColor,
        fontWeight: '800',
      },
    });
  }, [colors, levelColor, size, variant]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * LevelBadge par défaut
 */
export const DefaultLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} variant="default" />
);

/**
 * LevelBadge avec effet glassmorphism
 */
export const GlassLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} variant="glass" showGlow />
);

/**
 * LevelBadge minimal épuré
 */
export const MinimalLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} variant="minimal" showGlow={false} />
);

/**
 * LevelBadge avec contour uniquement
 */
export const OutlineLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} variant="outline" showGlow={false} />
);

/**
 * LevelBadge détaillé avec infos supplémentaires
 */
export const DetailedLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} variant="detailed" size="large" />
);

/**
 * LevelBadge compact pour les headers
 */
export const CompactLevelBadge: React.FC<LevelBadgeProps> = (props) => (
  <LevelBadge {...props} size="small" showGlow={false} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(LevelBadge);

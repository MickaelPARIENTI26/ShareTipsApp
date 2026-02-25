/**
 * OddsButton — Bouton de Cote Premium
 *
 * Bouton interactif pour afficher et sélectionner des cotes de paris.
 * Design premium avec animations fluides et indicateurs de tendance.
 *
 * Fonctionnalités :
 * - Variantes : default, compact, large, pill, glass
 * - Indicateur de tendance (hausse/baisse)
 * - Animation de pression (scale + glow)
 * - État sélectionné avec gradient
 * - Badge "Hot" pour cotes populaires
 * - Effet glassmorphism optionnel
 */

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du bouton */
export type OddsButtonVariant = 'default' | 'compact' | 'large' | 'pill' | 'glass';

/** Taille du bouton */
export type OddsButtonSize = 'sm' | 'md' | 'lg';

/** Tendance de la cote */
export type OddsTrend = 'up' | 'down' | 'stable';

export interface OddsButtonProps {
  /** Label du pari (ex: "1", "X", "2", "Over 2.5") */
  label: string;
  /** Valeur de la cote */
  odds: number;
  /** Bouton sélectionné */
  isSelected: boolean;
  /** Bouton désactivé */
  disabled: boolean;
  /** Callback au press */
  onPress: () => void;
  /** Variante visuelle (défaut: 'default') */
  variant?: OddsButtonVariant;
  /** Taille du bouton (défaut: 'md') */
  size?: OddsButtonSize;
  /** Tendance de la cote (défaut: 'stable') */
  trend?: OddsTrend;
  /** Afficher l'indicateur de tendance (défaut: false) */
  showTrend?: boolean;
  /** Marquer comme "Hot" / populaire (défaut: false) */
  isHot?: boolean;
  /** Animation activée (défaut: true) */
  animated?: boolean;
  /** Bordure glassmorphism (défaut: false, auto si variant='glass') */
  glassBorder?: boolean;
  /** Cote précédente (pour animation de changement) */
  previousOdds?: number;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SIZE_CONFIG: Record<
  OddsButtonSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    labelSize: number;
    oddsSize: number;
    iconSize: number;
    borderRadius: number;
    minWidth: number;
  }
> = {
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    labelSize: 10,
    oddsSize: 14,
    iconSize: 10,
    borderRadius: radius.sm,
    minWidth: 60,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    labelSize: 11,
    oddsSize: 16,
    iconSize: 12,
    borderRadius: radius.md,
    minWidth: 72,
  },
  lg: {
    paddingVertical: spacing['md+'],
    paddingHorizontal: spacing.md,
    labelSize: 12,
    oddsSize: 20,
    iconSize: 14,
    borderRadius: radius.lg,
    minWidth: 88,
  },
};

const VARIANT_CONFIG: Record<
  OddsButtonVariant,
  {
    showLabel: boolean;
    pillShape: boolean;
    hasGradient: boolean;
  }
> = {
  default: { showLabel: true, pillShape: false, hasGradient: false },
  compact: { showLabel: false, pillShape: false, hasGradient: false },
  large: { showLabel: true, pillShape: false, hasGradient: false },
  pill: { showLabel: true, pillShape: true, hasGradient: false },
  glass: { showLabel: true, pillShape: false, hasGradient: true },
};

const TREND_COLORS: Record<OddsTrend, string> = {
  up: '#22C55E',
  down: '#EF4444',
  stable: 'transparent',
};

const TREND_ICONS: Record<OddsTrend, keyof typeof Ionicons.glyphMap> = {
  up: 'caret-up',
  down: 'caret-down',
  stable: 'remove',
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const OddsButton: React.FC<OddsButtonProps> = ({
  label,
  odds,
  isSelected,
  disabled,
  onPress,
  variant = 'default',
  size = 'md',
  trend = 'stable',
  showTrend = false,
  isHot = false,
  animated = true,
  glassBorder: customGlassBorder,
  previousOdds,
  style,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  // ── Configuration ──────────────────────────────────────────────
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];
  const glassBorder = customGlassBorder ?? variant === 'glass';
  const effectiveBorderRadius = variantConfig.pillShape ? radius.full : sizeConfig.borderRadius;

  // ── Animations ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const oddsFlashAnim = useRef(new Animated.Value(0)).current;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(
    colors,
    variant,
    size,
    sizeConfig,
    effectiveBorderRadius,
    isSelected,
    disabled,
    glassBorder
  );

  // ── Haptic feedback when selection changes ──────────────────────
  const prevSelectedRef = useRef(isSelected);
  useEffect(() => {
    if (isSelected && !prevSelectedRef.current) {
      // Medium haptic when newly selected
      haptics.medium();
    }
    prevSelectedRef.current = isSelected;
  }, [isSelected]);

  // ── Flash animation quand odds change ──────────────────────────
  useEffect(() => {
    if (previousOdds !== undefined && previousOdds !== odds && animated) {
      Animated.sequence([
        Animated.timing(oddsFlashAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(oddsFlashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [odds, previousOdds, animated, oddsFlashAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (disabled) return;

    // Haptic feedback on press
    haptics.selection();

    if (!animated) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        ...springConfigs.button,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, animated, scaleAnim, opacityAnim, glowAnim]);

  const handlePressOut = useCallback(() => {
    if (!animated) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.snappy,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, scaleAnim, opacityAnim, glowAnim]);

  // ── Interpolations ─────────────────────────────────────────────
  const innerGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2],
  });

  const oddsFlashScale = oddsFlashAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  // ── Accessibility label ────────────────────────────────────────
  const a11yLabel = useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;
    const trendText = showTrend && trend !== 'stable'
      ? trend === 'up' ? ', en hausse' : ', en baisse'
      : '';
    const selectedText = isSelected ? ', sélectionné' : '';
    return `${label}, cote ${odds.toFixed(2)}${trendText}${selectedText}`;
  }, [accessibilityLabel, label, odds, showTrend, trend, isSelected]);

  // ── Render content ─────────────────────────────────────────────
  const renderContent = () => (
    <>
      {/* Inner glow overlay */}
      <Animated.View
        style={[
          styles.glowOverlay,
          {
            opacity: innerGlowOpacity,
            backgroundColor: isSelected ? colors.textOnPrimary : colors.primary,
          },
        ]}
        pointerEvents="none"
      />

      {/* Hot badge */}
      {isHot && !disabled && (
        <View style={styles.hotBadge}>
          <Ionicons name="flame" size={10} color="#FFFFFF" />
        </View>
      )}

      {/* Label */}
      {variantConfig.showLabel && (
        <Text
          style={[
            styles.label,
            isSelected && styles.selectedLabel,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      {/* Odds with trend */}
      <View style={styles.oddsContainer}>
        {/* Trend indicator */}
        {showTrend && trend !== 'stable' && !disabled && (
          <View style={[styles.trendIndicator, { backgroundColor: `${TREND_COLORS[trend]}20` }]}>
            <Ionicons
              name={TREND_ICONS[trend]}
              size={sizeConfig.iconSize}
              color={TREND_COLORS[trend]}
            />
          </View>
        )}

        {/* Odds value */}
        <Animated.Text
          style={[
            styles.odds,
            isSelected && styles.selectedOdds,
            disabled && styles.disabledText,
            { transform: [{ scale: oddsFlashScale }] },
          ]}
        >
          {odds.toFixed(2)}
        </Animated.Text>
      </View>

      {/* Glass border overlay */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled }}
      >
        {isSelected && variant !== 'glass' ? (
          <LinearGradient
            colors={effectGradients.primary.colors as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {renderContent()}
          </LinearGradient>
        ) : variant === 'glass' ? (
          <LinearGradient
            colors={
              isSelected
                ? (effectGradients.primary.colors as unknown as string[])
                : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          <View style={styles.button}>
            {renderContent()}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: OddsButtonVariant,
  size: OddsButtonSize,
  sizeConfig: (typeof SIZE_CONFIG)[OddsButtonSize],
  borderRadius: number,
  isSelected: boolean,
  disabled: boolean,
  glassBorder: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        buttonWrapper: {
          flex: 1,
          minWidth: sizeConfig.minWidth,
        },
        pressable: {
          flex: 1,
        },
        button: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius,
          overflow: 'hidden',
          // Background (non-selected, non-glass)
          backgroundColor:
            variant === 'glass' || isSelected
              ? 'transparent'
              : disabled
                ? colors.surfaceElevated
                : colors.primaryBg,
          // Border
          borderWidth: isSelected ? 0 : 1,
          borderColor: disabled
            ? 'transparent'
            : `${colors.primary}25`,
          // Shadow for selected
          ...Platform.select({
            ios: isSelected
              ? {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                }
              : {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                },
            android: {
              elevation: isSelected ? 6 : 0,
            },
          }),
          // Opacity for disabled
          opacity: disabled ? 0.4 : 1,
        },
        glowOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius,
        },
        hotBadge: {
          position: 'absolute',
          top: -4,
          right: -4,
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#EF4444',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.background,
          zIndex: 10,
        },
        label: {
          fontSize: sizeConfig.labelSize,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.xxs,
        },
        selectedLabel: {
          color: 'rgba(255, 255, 255, 0.85)',
        },
        oddsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
        },
        trendIndicator: {
          width: sizeConfig.iconSize + 4,
          height: sizeConfig.iconSize + 4,
          borderRadius: (sizeConfig.iconSize + 4) / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        odds: {
          fontSize: sizeConfig.oddsSize,
          fontWeight: '700',
          color: colors.primary,
          letterSpacing: -0.5,
        },
        selectedOdds: {
          color: '#FFFFFF',
        },
        disabledText: {
          color: colors.textTertiary,
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
        },
      }),
    [colors, variant, size, sizeConfig, borderRadius, isSelected, disabled, glassBorder]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Bouton de cote par défaut */
export const DefaultOddsButton: React.FC<Omit<OddsButtonProps, 'variant'>> = (props) => (
  <OddsButton variant="default" {...props} />
);

/** Bouton de cote compact (sans label) */
export const CompactOddsButton: React.FC<Omit<OddsButtonProps, 'variant'>> = (props) => (
  <OddsButton variant="compact" {...props} />
);

/** Bouton de cote large */
export const LargeOddsButton: React.FC<Omit<OddsButtonProps, 'variant'>> = (props) => (
  <OddsButton variant="large" {...props} />
);

/** Bouton de cote en forme de pilule */
export const PillOddsButton: React.FC<Omit<OddsButtonProps, 'variant'>> = (props) => (
  <OddsButton variant="pill" {...props} />
);

/** Bouton de cote glassmorphism */
export const GlassOddsButton: React.FC<Omit<OddsButtonProps, 'variant'>> = (props) => (
  <OddsButton variant="glass" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(OddsButton);

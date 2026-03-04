/**
 * SportyButton — Bouton Premium Sportif
 *
 * Bouton moderne avec gradients, animations et effets visuels premium.
 * Conçu pour les formulaires d'authentification et actions principales.
 *
 * Fonctionnalités :
 * - Variantes : primary, secondary, accent, outline, ghost, danger, glass
 * - Tailles : small, medium, large
 * - Gradient dynamique avec glow
 * - Animation de pression (scale + opacity)
 * - État loading avec spinner
 * - Support icône gauche/droite
 * - Effet glassmorphism
 */

import React, { useRef, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/ThemeContext';
import { darkColors, type ThemeColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { effectGlass, effectGradients, springConfigs } from '../../theme/effects';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du bouton */
export type SportyButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'glass';

/** Tailles disponibles */
export type SportyButtonSize = 'small' | 'medium' | 'large';

/** Position de l'icône */
export type IconPosition = 'left' | 'right';

export interface SportyButtonProps {
  /** Texte du bouton */
  title: string;
  /** Callback au press */
  onPress: () => void;
  /** Variante visuelle (défaut: 'primary') */
  variant?: SportyButtonVariant;
  /** Taille du bouton (défaut: 'large') */
  size?: SportyButtonSize;
  /** État de chargement */
  loading?: boolean;
  /** Désactivé */
  disabled?: boolean;
  /** Icône Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Position de l'icône (défaut: 'left') */
  iconPosition?: IconPosition;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
  /** Hint d'accessibilité */
  accessibilityHint?: string;
  /** ID de test */
  testID?: string;
  /** Pleine largeur (défaut: false) */
  fullWidth?: boolean;
  /** Animation activée (défaut: true) */
  animated?: boolean;
  /** Effet glow activé (défaut: true pour primary/secondary/accent) */
  showGlow?: boolean;
  /** Bordure glassmorphism (défaut: false, auto si variant='glass') */
  glassBorder?: boolean;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SIZE_CONFIG: Record<
  SportyButtonSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    iconSize: number;
    minHeight: number;
    borderRadius: number;
  }
> = {
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    iconSize: 16,
    minHeight: 40,
    borderRadius: radius.md,
  },
  medium: {
    paddingVertical: spacing['sm+'],
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    iconSize: 18,
    minHeight: 48,
    borderRadius: radius.lg,
  },
  large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    fontSize: 16,
    iconSize: 20,
    minHeight: 56,
    borderRadius: radius.xl,
  },
};

type GradientConfig = {
  colors: readonly [string, string, ...string[]];
  textColor: string;
  hasGradient: boolean;
  hasBorder: boolean;
  borderColor?: string;
  glowColor?: string;
};

const getVariantConfig = (colors: ThemeColors): Record<SportyButtonVariant, GradientConfig> => ({
  primary: {
    colors: effectGradients.primary.colors as [string, string],
    textColor: '#FFFFFF',
    hasGradient: true,
    hasBorder: false,
    glowColor: colors.primary,
  },
  secondary: {
    // Secondary uses accent colors (orange gradient)
    colors: effectGradients.accent.colors as [string, string],
    textColor: '#FFFFFF',
    hasGradient: true,
    hasBorder: false,
    glowColor: colors.accent,
  },
  accent: {
    colors: effectGradients.accent.colors as [string, string],
    textColor: '#000000',
    hasGradient: true,
    hasBorder: false,
    glowColor: colors.accent,
  },
  outline: {
    colors: ['transparent', 'transparent'] as [string, string],
    textColor: colors.primary,
    hasGradient: false,
    hasBorder: true,
    borderColor: colors.primary,
  },
  ghost: {
    colors: [colors.primaryBg, colors.primaryBg] as [string, string],
    textColor: colors.primary,
    hasGradient: false,
    hasBorder: false,
  },
  danger: {
    colors: ['#F87171', '#EF4444', '#DC2626'] as readonly [string, string, ...string[]],
    textColor: '#FFFFFF',
    hasGradient: true,
    hasBorder: false,
    glowColor: colors.danger,
  },
  glass: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] as [string, string],
    textColor: colors.text,
    hasGradient: true,
    hasBorder: true,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const SportyButton: React.FC<SportyButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  testID,
  fullWidth = false,
  animated = true,
  showGlow: customShowGlow,
  glassBorder: customGlassBorder,
  style,
}) => {
  const theme = useTheme();
  // Fallback to darkColors if theme context fails to load
  const colors = theme?.colors ?? darkColors;

  // ── Configuration ──────────────────────────────────────────────
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = getVariantConfig(colors)[variant];
  const glassBorder = customGlassBorder ?? variant === 'glass';
  const showGlow = customShowGlow ?? ['primary', 'secondary', 'accent', 'danger'].includes(variant);

  // ── Animations ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // ── State ──────────────────────────────────────────────────────
  const isDisabled = disabled || loading;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(
    colors,
    variant,
    size,
    sizeConfig,
    variantConfig,
    fullWidth,
    isDisabled,
    glassBorder,
    showGlow
  );

  // ── Handlers ───────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (!animated || isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        ...springConfigs.button,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, isDisabled, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (!animated || isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.snappy,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, isDisabled, scaleAnim, opacityAnim]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    onPress();
  }, [isDisabled, onPress]);

  // ── Render content ─────────────────────────────────────────────
  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variantConfig.textColor}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={variantConfig.textColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={styles.text} numberOfLines={1}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={variantConfig.textColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityHint={accessibilityHint}
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
        {variantConfig.hasGradient ? (
          <LinearGradient
            colors={[...variantConfig.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {renderContent()}
            {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
          </LinearGradient>
        ) : (
          <View style={styles.button}>
            {renderContent()}
            {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: SportyButtonVariant,
  size: SportyButtonSize,
  sizeConfig: (typeof SIZE_CONFIG)[SportyButtonSize],
  variantConfig: GradientConfig,
  fullWidth: boolean,
  isDisabled: boolean,
  glassBorder: boolean,
  showGlow: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: isDisabled ? 0.5 : 1,
          // Glow effect
          ...(showGlow && variantConfig.glowColor
            ? {
                shadowColor: variantConfig.glowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
              }
            : {}),
        },
        button: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: sizeConfig.minHeight,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          overflow: 'hidden',
          // Background for non-gradient variants
          backgroundColor: variantConfig.hasGradient ? 'transparent' : variantConfig.colors[0],
          // Border for outline variant
          ...(variantConfig.hasBorder && variantConfig.borderColor
            ? {
                borderWidth: variant === 'outline' ? 2 : 1,
                borderColor: variantConfig.borderColor,
              }
            : {}),
        },
        contentContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        text: {
          fontSize: sizeConfig.fontSize,
          fontWeight: '700',
          fontFamily: typography.button.fontFamily,
          color: variantConfig.textColor,
          letterSpacing: 0.5,
          textTransform: 'none',
        },
        iconLeft: {
          marginRight: spacing.xxs,
        },
        iconRight: {
          marginLeft: spacing.xxs,
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: sizeConfig.borderRadius,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
        },
      }),
    [colors, variant, size, sizeConfig, variantConfig, fullWidth, isDisabled, glassBorder, showGlow]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Bouton primaire (vert gradient) */
export const PrimarySportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="primary" {...props} />
);

/** Bouton secondaire (orange gradient) */
export const SecondarySportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="secondary" {...props} />
);

/** Bouton accent (jaune gradient) */
export const AccentSportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="accent" {...props} />
);

/** Bouton outline (bordure) */
export const OutlineSportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="outline" {...props} />
);

/** Bouton ghost (transparent avec bg léger) */
export const GhostSportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="ghost" {...props} />
);

/** Bouton danger (rouge gradient) */
export const DangerSportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="danger" {...props} />
);

/** Bouton glass (glassmorphism) */
export const GlassSportyButton: React.FC<Omit<SportyButtonProps, 'variant'>> = (props) => (
  <SportyButton variant="glass" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(SportyButton);

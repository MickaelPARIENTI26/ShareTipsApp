/**
 * InlineError — Composant Message Inline Premium
 *
 * Affiche des messages d'erreur, warning, info ou succès inline.
 * Design premium avec animations d'apparition et variantes visuelles.
 *
 * Fonctionnalités :
 * - Variantes : error, warning, info, success
 * - Tailles : sm, md, lg
 * - Animation d'apparition (fade + slide)
 * - Option dismissible avec bouton de fermeture
 * - Icônes personnalisables
 * - Bordure glassmorphism optionnelle
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du message */
export type InlineMessageVariant = 'error' | 'warning' | 'info' | 'success';

/** Tailles disponibles */
export type InlineMessageSize = 'sm' | 'md' | 'lg';

export interface InlineErrorProps {
  /** Message à afficher (null/undefined = composant non rendu) */
  message: string | null | undefined;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
  /** Afficher l'icône (défaut: true) */
  showIcon?: boolean;
  /** Variante visuelle (défaut: 'error') */
  variant?: InlineMessageVariant;
  /** Taille du composant (défaut: 'md') */
  size?: InlineMessageSize;
  /** Icône personnalisée (remplace l'icône par défaut) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Afficher l'animation d'apparition (défaut: true) */
  animated?: boolean;
  /** Rendre le message dismissible (défaut: false) */
  dismissible?: boolean;
  /** Callback quand le message est fermé */
  onDismiss?: () => void;
  /** Bordure glass effect (défaut: false) */
  glassBorder?: boolean;
  /** Texte bold (défaut: false) */
  bold?: boolean;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const VARIANT_CONFIG: Record<
  InlineMessageVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: keyof ThemeColors;
    bgColorKey: keyof ThemeColors;
  }
> = {
  error: {
    icon: 'alert-circle',
    colorKey: 'danger',
    bgColorKey: 'dangerBg',
  },
  warning: {
    icon: 'warning',
    colorKey: 'warning',
    bgColorKey: 'warningBg',
  },
  info: {
    icon: 'information-circle',
    colorKey: 'info',
    bgColorKey: 'infoBg',
  },
  success: {
    icon: 'checkmark-circle',
    colorKey: 'success',
    bgColorKey: 'successBg',
  },
};

const SIZE_CONFIG: Record<
  InlineMessageSize,
  {
    paddingVertical: number;
    paddingHorizontal: number;
    iconSize: number;
    fontSize: number;
    borderRadius: number;
  }
> = {
  sm: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    iconSize: 12,
    fontSize: 11,
    borderRadius: radius.xs,
  },
  md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    iconSize: 14,
    fontSize: 12,
    borderRadius: radius.sm,
  },
  lg: {
    paddingVertical: spacing['sm+'],
    paddingHorizontal: spacing.md,
    iconSize: 18,
    fontSize: 14,
    borderRadius: radius.md,
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const InlineError: React.FC<InlineErrorProps> = ({
  message,
  style,
  showIcon = true,
  variant = 'error',
  size = 'md',
  icon: customIcon,
  animated = true,
  dismissible = false,
  onDismiss,
  glassBorder = false,
  bold = false,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // ── Configuration ──────────────────────────────────────────────
  const variantConfig = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const iconName = customIcon ?? variantConfig.icon;
  const textColor = colors[variantConfig.colorKey] as string;
  const bgColor = colors[variantConfig.bgColorKey] as string;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(
    colors,
    textColor,
    bgColor,
    sizeConfig,
    glassBorder,
    bold
  );

  // ── Animation d'apparition ─────────────────────────────────────
  useEffect(() => {
    if (message && animated) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(-10);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 200,
          friction: 15,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [message, animated, fadeAnim, slideAnim]);

  // ── Handler dismiss ────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    if (!dismissible) return;

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, [dismissible, fadeAnim, slideAnim, onDismiss]);

  // ── Ne rien rendre si pas de message ───────────────────────────
  if (!message) return null;

  // ── Render ─────────────────────────────────────────────────────
  const animatedStyle = animated
    ? {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    : {};

  return (
    <Animated.View
      style={[styles.container, animatedStyle, style]}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || message}
      accessibilityLiveRegion="polite"
    >
      {/* Icône */}
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={sizeConfig.iconSize}
            color={textColor}
          />
        </View>
      )}

      {/* Message */}
      <Text style={styles.text} numberOfLines={3}>
        {message}
      </Text>

      {/* Bouton dismiss */}
      {dismissible && (
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Fermer le message"
          accessibilityRole="button"
        >
          <Ionicons
            name="close"
            size={sizeConfig.iconSize}
            color={textColor}
          />
        </TouchableOpacity>
      )}

      {/* Glass border overlay */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  textColor: string,
  bgColor: string,
  sizeConfig: (typeof SIZE_CONFIG)[InlineMessageSize],
  glassBorder: boolean,
  bold: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bgColor,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          marginTop: spacing.xs,
          overflow: 'hidden',
          // Subtle left border accent
          borderLeftWidth: 3,
          borderLeftColor: textColor,
        },
        iconContainer: {
          marginRight: spacing.xs,
          opacity: 0.9,
        },
        text: {
          flex: 1,
          fontSize: sizeConfig.fontSize,
          fontFamily: typography.caption.fontFamily,
          fontWeight: bold ? '600' : '400',
          color: textColor,
          lineHeight: sizeConfig.fontSize * 1.4,
        },
        dismissButton: {
          marginLeft: spacing.sm,
          padding: spacing.xxs,
          borderRadius: radius.full,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: sizeConfig.borderRadius,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
          borderLeftWidth: 0, // Don't overlap accent border
        },
      }),
    [colors, textColor, bgColor, sizeConfig, glassBorder, bold]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Message d'erreur (alias de InlineError avec variant='error') */
export const ErrorMessage: React.FC<Omit<InlineErrorProps, 'variant'>> = (props) => (
  <InlineError variant="error" {...props} />
);

/** Message d'avertissement */
export const WarningMessage: React.FC<Omit<InlineErrorProps, 'variant'>> = (props) => (
  <InlineError variant="warning" {...props} />
);

/** Message d'information */
export const InfoMessage: React.FC<Omit<InlineErrorProps, 'variant'>> = (props) => (
  <InlineError variant="info" {...props} />
);

/** Message de succès */
export const SuccessMessage: React.FC<Omit<InlineErrorProps, 'variant'>> = (props) => (
  <InlineError variant="success" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(InlineError);

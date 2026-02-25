/**
 * ErrorBanner — Bannière de Message Premium
 *
 * Bannière full-width pour afficher des erreurs, warnings, infos ou succès.
 * Design premium avec animations d'apparition et effets glassmorphism.
 *
 * Fonctionnalités :
 * - Support AppError avec icônes contextuelles
 * - Variantes : error, warning, info, success
 * - Animation d'apparition (slide + fade)
 * - Bouton retry optionnel avec animation
 * - Effet glassmorphism optionnel
 * - Bouton dismiss avec animation
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
import { ErrorType, type AppError } from '../../utils/errors';
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles de la bannière */
export type BannerVariant = 'error' | 'warning' | 'info' | 'success';

/** Position de la bannière */
export type BannerPosition = 'top' | 'bottom' | 'inline';

export interface ErrorBannerProps {
  /** Erreur à afficher (string ou AppError) */
  error: string | AppError | null;
  /** Callback pour fermer la bannière */
  onDismiss?: () => void;
  /** Callback pour réessayer (affiché si error.retryable) */
  onRetry?: () => void;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
  /** Variante visuelle (défaut: auto-détecté ou 'error') */
  variant?: BannerVariant;
  /** Position de la bannière (défaut: 'inline') */
  position?: BannerPosition;
  /** Afficher l'animation d'apparition (défaut: true) */
  animated?: boolean;
  /** Effet glassmorphism (défaut: false) */
  glassmorphism?: boolean;
  /** Icône personnalisée (remplace l'icône auto-détectée) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Titre optionnel au-dessus du message */
  title?: string;
  /** Texte du bouton retry (défaut: 'Réessayer') */
  retryLabel?: string;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const ERROR_TYPE_ICONS: Record<ErrorType, keyof typeof Ionicons.glyphMap> = {
  [ErrorType.NETWORK]: 'cloud-offline',
  [ErrorType.AUTH]: 'lock-closed',
  [ErrorType.FORBIDDEN]: 'ban',
  [ErrorType.NOT_FOUND]: 'search',
  [ErrorType.SERVER]: 'server',
  [ErrorType.VALIDATION]: 'alert-circle',
  [ErrorType.UNKNOWN]: 'alert-circle',
};

const VARIANT_CONFIG: Record<
  BannerVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: keyof ThemeColors;
    bgColorKey: keyof ThemeColors;
    gradientColors: readonly string[];
  }
> = {
  error: {
    icon: 'alert-circle',
    colorKey: 'danger',
    bgColorKey: 'dangerBg',
    gradientColors: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'],
  },
  warning: {
    icon: 'warning',
    colorKey: 'warning',
    bgColorKey: 'warningBg',
    gradientColors: ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'],
  },
  info: {
    icon: 'information-circle',
    colorKey: 'info',
    bgColorKey: 'infoBg',
    gradientColors: ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)'],
  },
  success: {
    icon: 'checkmark-circle',
    colorKey: 'success',
    bgColorKey: 'successBg',
    gradientColors: ['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)'],
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  style,
  variant: customVariant,
  position = 'inline',
  animated = true,
  glassmorphism = false,
  icon: customIcon,
  title,
  retryLabel = 'Réessayer',
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  // ── Animations ─────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const retryScaleAnim = useRef(new Animated.Value(1)).current;

  // ── Parse error ────────────────────────────────────────────────
  const message = typeof error === 'string' ? error : error?.message || '';
  const errorType = typeof error === 'string' ? ErrorType.UNKNOWN : (error?.type ?? ErrorType.UNKNOWN);
  const canRetry = typeof error === 'string' ? false : (error?.retryable ?? false);

  // ── Determine variant and icon ─────────────────────────────────
  const variant = customVariant ?? 'error';
  const variantConfig = VARIANT_CONFIG[variant];
  const iconName = customIcon ?? ERROR_TYPE_ICONS[errorType] ?? variantConfig.icon;
  const accentColor = colors[variantConfig.colorKey] as string;
  const bgColor = colors[variantConfig.bgColorKey] as string;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(colors, accentColor, bgColor, position, glassmorphism);

  // ── Animation d'apparition ─────────────────────────────────────
  useEffect(() => {
    if (error && animated) {
      // Haptic feedback based on variant
      if (variant === 'error') {
        haptics.error();
      } else if (variant === 'warning') {
        haptics.warning();
      } else if (variant === 'success') {
        haptics.success();
      } else {
        haptics.light();
      }

      // Reset
      slideAnim.setValue(position === 'bottom' ? 100 : -100);
      fadeAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          ...springConfigs.snappy,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, animated, slideAnim, fadeAnim, position, variant]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    if (!animated) {
      onDismiss?.();
      return;
    }

    // Animate out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 100 : -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, [animated, slideAnim, fadeAnim, position, onDismiss]);

  const handleRetryPressIn = useCallback(() => {
    Animated.spring(retryScaleAnim, {
      toValue: 0.95,
      ...springConfigs.button,
    }).start();
  }, [retryScaleAnim]);

  const handleRetryPressOut = useCallback(() => {
    Animated.spring(retryScaleAnim, {
      toValue: 1,
      ...springConfigs.snappy,
    }).start();
  }, [retryScaleAnim]);

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  // ── Ne rien rendre si pas d'erreur ─────────────────────────────
  if (!error) return null;

  // ── Animation style ────────────────────────────────────────────
  const animatedStyle = animated
    ? {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    : {};

  // ── Render content ─────────────────────────────────────────────
  const renderContent = () => (
    <>
      {/* Header row: Icon + Message + Dismiss */}
      <View style={styles.header}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={accentColor} />
        </View>

        {/* Message container */}
        <View style={styles.messageContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>

        {/* Dismiss button */}
        {onDismiss && (
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Retry button */}
      {canRetry && onRetry && (
        <Animated.View style={{ transform: [{ scale: retryScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleRetry}
            onPressIn={handleRetryPressIn}
            onPressOut={handleRetryPressOut}
            style={styles.retryButton}
            activeOpacity={1}
            accessibilityLabel={retryLabel}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={16} color="#000000" />
            <Text style={styles.retryText}>{retryLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Glass border overlay */}
      {glassmorphism && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        position === 'top' && styles.positionTop,
        position === 'bottom' && styles.positionBottom,
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || message}
      accessibilityLiveRegion="assertive"
    >
      {glassmorphism ? (
        <LinearGradient
          colors={variantConfig.gradientColors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        renderContent()
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  accentColor: string,
  bgColor: string,
  position: BannerPosition,
  glassmorphism: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: glassmorphism ? 'transparent' : bgColor,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginHorizontal: position === 'inline' ? spacing.base : 0,
          marginVertical: spacing.sm,
          gap: spacing.md,
          overflow: 'hidden',
          // Subtle shadow
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
        gradientContainer: {
          borderRadius: radius.lg - 2,
          padding: spacing.md,
          gap: spacing.md,
        },
        positionTop: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderRadius: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          marginTop: 0,
          marginHorizontal: 0,
        },
        positionBottom: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          marginBottom: 0,
          marginHorizontal: 0,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
        },
        iconContainer: {
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: `${accentColor}15`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${accentColor}30`,
        },
        messageContainer: {
          flex: 1,
          gap: spacing.xxs,
        },
        title: {
          fontSize: 14,
          fontWeight: '700',
          fontFamily: typography.body.fontFamily,
          color: colors.text,
          letterSpacing: 0.2,
        },
        message: {
          fontSize: 13,
          fontFamily: typography.bodySmall.fontFamily,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        dismissButton: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        retryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: colors.primary,
          paddingVertical: spacing['sm+'],
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          alignSelf: 'flex-start',
          // Glow effect
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        },
        retryText: {
          fontSize: 14,
          fontWeight: '600',
          fontFamily: typography.button.fontFamily,
          color: '#000000',
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: radius.lg,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
          borderLeftWidth: 0,
        },
      }),
    [colors, accentColor, bgColor, position, glassmorphism]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Bannière d'erreur (défaut) */
export const ErrorAlert: React.FC<Omit<ErrorBannerProps, 'variant'>> = (props) => (
  <ErrorBanner variant="error" {...props} />
);

/** Bannière d'avertissement */
export const WarningAlert: React.FC<Omit<ErrorBannerProps, 'variant'>> = (props) => (
  <ErrorBanner variant="warning" {...props} />
);

/** Bannière d'information */
export const InfoAlert: React.FC<Omit<ErrorBannerProps, 'variant'>> = (props) => (
  <ErrorBanner variant="info" {...props} />
);

/** Bannière de succès */
export const SuccessAlert: React.FC<Omit<ErrorBannerProps, 'variant'>> = (props) => (
  <ErrorBanner variant="success" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(ErrorBanner);

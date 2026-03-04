/**
 * SportyInput — Champ de Saisie Premium
 *
 * Input moderne avec animations fluides et effets visuels premium.
 * Conçu pour les formulaires d'authentification et au-delà.
 *
 * Fonctionnalités :
 * - Variantes : default, filled, outline, glass
 * - Tailles : sm, md, lg
 * - Animation de focus (glow, border, icon)
 * - Animation shake sur erreur
 * - Support password avec toggle
 * - Icône gauche optionnelle
 * - Label flottant optionnel
 * - Effet glassmorphism
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type TextInput as TextInputType,
  type ViewStyle,
  type StyleProp,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme/ThemeContext';
import { darkColors, type ThemeColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { effectGlass, springConfigs } from '../../theme/effects';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles de l'input */
export type SportyInputVariant = 'default' | 'filled' | 'outline' | 'glass';

/** Tailles disponibles */
export type SportyInputSize = 'sm' | 'md' | 'lg';

export interface SportyInputProps extends Omit<TextInputProps, 'style' | 'onFocus' | 'onBlur'> {
  /** Champ requis */
  required?: boolean;
  /** Callback onFocus */
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  /** Callback onBlur */
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  /** Label au-dessus de l'input */
  label?: string;
  /** Message d'erreur */
  error?: string;
  /** Icône à gauche */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Mode mot de passe (toggle eye) */
  isPassword?: boolean;
  /** Référence vers le TextInput */
  inputRef?: React.RefObject<TextInputType | null>;
  /** Variante visuelle (défaut: 'default') */
  variant?: SportyInputVariant;
  /** Taille de l'input (défaut: 'md') */
  size?: SportyInputSize;
  /** Animation de focus (défaut: true) */
  animated?: boolean;
  /** Animation shake sur erreur (défaut: true) */
  shakeOnError?: boolean;
  /** Effet glow au focus (défaut: true) */
  showGlow?: boolean;
  /** Bordure glassmorphism (défaut: false, auto si variant='glass') */
  glassBorder?: boolean;
  /** Hint/description sous l'input */
  hint?: string;
  /** Icône de succès si valide */
  showSuccessIcon?: boolean;
  /** État de succès */
  isValid?: boolean;
  /** Style personnalisé du container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style personnalisé de l'input wrapper */
  inputWrapperStyle?: StyleProp<ViewStyle>;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SIZE_CONFIG: Record<
  SportyInputSize,
  {
    minHeight: number;
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    iconSize: number;
    borderRadius: number;
    labelSize: number;
  }
> = {
  sm: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    iconSize: 18,
    borderRadius: radius.md,
    labelSize: 12,
  },
  md: {
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    fontSize: 15,
    iconSize: 20,
    borderRadius: radius.lg,
    labelSize: 13,
  },
  lg: {
    minHeight: 60,
    paddingVertical: spacing['md+'],
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    iconSize: 22,
    borderRadius: radius.xl,
    labelSize: 14,
  },
};

const VARIANT_CONFIG: Record<
  SportyInputVariant,
  {
    hasBorder: boolean;
    hasGradient: boolean;
    borderWidth: number;
  }
> = {
  default: { hasBorder: true, hasGradient: false, borderWidth: 1.5 },
  filled: { hasBorder: false, hasGradient: false, borderWidth: 0 },
  outline: { hasBorder: true, hasGradient: false, borderWidth: 2 },
  glass: { hasBorder: true, hasGradient: true, borderWidth: 1 },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const SportyInput: React.FC<SportyInputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  inputRef,
  value,
  onFocus,
  onBlur,
  editable = true,
  variant = 'default',
  size = 'md',
  animated = true,
  shakeOnError = true,
  showGlow = true,
  glassBorder: customGlassBorder,
  hint,
  showSuccessIcon = false,
  isValid = false,
  containerStyle,
  inputWrapperStyle,
  accessibilityLabel,
  placeholder,
  required,
  ...props
}) => {
  const theme = useTheme();
  // Fallback to darkColors if theme context fails to load
  const colors = theme?.colors ?? darkColors;

  // ── State ──────────────────────────────────────────────────────
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Animations ─────────────────────────────────────────────────
  const focusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconColorAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevErrorRef = useRef(error);

  // ── Configuration ──────────────────────────────────────────────
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];
  const glassBorder = customGlassBorder ?? variant === 'glass';

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(
    colors,
    variant,
    size,
    sizeConfig,
    variantConfig,
    isFocused,
    !!error,
    !editable,
    glassBorder
  );

  // ── Focus animation ────────────────────────────────────────────
  useEffect(() => {
    if (!animated) return;

    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: isFocused ? 1 : 0,
        ...springConfigs.snappy,
      }),
      Animated.timing(iconColorAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: isFocused && showGlow ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, animated, focusAnim, iconColorAnim, glowAnim, showGlow]);

  // ── Shake animation on error ───────────────────────────────────
  useEffect(() => {
    if (shakeOnError && error && error !== prevErrorRef.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevErrorRef.current = error;
  }, [error, shakeOnError, shakeAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // ── Interpolations ─────────────────────────────────────────────
  const iconColor = iconColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary, colors.primary],
  });

  const borderColor = useMemo(() => {
    if (error) return colors.danger;
    if (isValid && showSuccessIcon) return colors.success;
    if (isFocused) return colors.primary;
    return colors.inputBorder;
  }, [error, isValid, showSuccessIcon, isFocused, colors]);

  const glowStyle = useMemo(() => {
    if (!showGlow || !isFocused) return {};
    return {
      shadowColor: error ? colors.danger : colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    };
  }, [showGlow, isFocused, error, colors]);

  // ── Render input content ───────────────────────────────────────
  const renderInputContent = () => (
    <>
      {/* Left Icon */}
      {icon && (
        <Animated.View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={sizeConfig.iconSize}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textTertiary}
          />
        </Animated.View>
      )}

      {/* TextInput */}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          icon && styles.inputWithIcon,
          (isPassword || (showSuccessIcon && isValid)) && styles.inputWithRightIcon,
        ]}
        placeholderTextColor={colors.placeholder}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        secureTextEntry={isPassword && !showPassword}
        selectionColor={colors.primary}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel || label || placeholder}
        {...props}
      />

      {/* Success Icon */}
      {showSuccessIcon && isValid && !isPassword && (
        <View style={styles.rightIconContainer}>
          <Ionicons name="checkmark-circle" size={sizeConfig.iconSize} color={colors.success} />
        </View>
      )}

      {/* Password Toggle */}
      {isPassword && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={togglePassword}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={sizeConfig.iconSize}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      )}

      {/* Glass border overlay */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }] },
        containerStyle,
      ]}
    >
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          glowStyle,
          inputWrapperStyle,
        ]}
      >
        {variant === 'glass' ? (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {renderInputContent()}
          </LinearGradient>
        ) : (
          renderInputContent()
        )}
      </Animated.View>

      {/* Error message */}
      {error && (
        <Animated.View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {/* Hint message */}
      {hint && !error && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: SportyInputVariant,
  size: SportyInputSize,
  sizeConfig: (typeof SIZE_CONFIG)[SportyInputSize],
  variantConfig: (typeof VARIANT_CONFIG)[SportyInputVariant],
  isFocused: boolean,
  hasError: boolean,
  isDisabled: boolean,
  glassBorder: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: spacing.base,
        },
        label: {
          fontSize: sizeConfig.labelSize,
          fontWeight: '600',
          fontFamily: typography.bodySmall.fontFamily,
          color: colors.text,
          marginBottom: spacing.sm,
          letterSpacing: 0.3,
        },
        required: {
          color: colors.danger,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: sizeConfig.minHeight,
          borderRadius: sizeConfig.borderRadius,
          borderWidth: variantConfig.borderWidth,
          overflow: 'hidden',
          // Background based on variant
          backgroundColor:
            variant === 'glass'
              ? 'transparent'
              : variant === 'filled'
                ? colors.surfaceElevated
                : hasError
                  ? colors.dangerBg
                  : isFocused
                    ? colors.surfaceElevated
                    : colors.inputBg,
          // Opacity for disabled
          opacity: isDisabled ? 0.5 : 1,
        },
        gradientContainer: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: sizeConfig.minHeight,
          borderRadius: sizeConfig.borderRadius - 1,
        },
        iconContainer: {
          marginLeft: sizeConfig.paddingHorizontal,
          opacity: 0.9,
        },
        input: {
          flex: 1,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          fontSize: sizeConfig.fontSize,
          fontFamily: typography.body.fontFamily,
          color: colors.text,
        },
        inputWithIcon: {
          paddingLeft: spacing.sm,
        },
        inputWithRightIcon: {
          paddingRight: spacing['3xl'],
        },
        rightIconContainer: {
          position: 'absolute',
          right: sizeConfig.paddingHorizontal,
          height: '100%',
          justifyContent: 'center',
        },
        eyeButton: {
          position: 'absolute',
          right: sizeConfig.paddingHorizontal,
          height: '100%',
          justifyContent: 'center',
          paddingHorizontal: spacing.xs,
        },
        errorContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.xs,
          paddingLeft: spacing.xs,
          gap: spacing.xs,
        },
        errorText: {
          fontSize: 12,
          fontFamily: typography.caption.fontFamily,
          color: colors.danger,
          flex: 1,
        },
        hintContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.xs,
          paddingLeft: spacing.xs,
          gap: spacing.xs,
        },
        hintText: {
          fontSize: 12,
          fontFamily: typography.caption.fontFamily,
          color: colors.textTertiary,
          flex: 1,
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: sizeConfig.borderRadius,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
          pointerEvents: 'none',
        },
      }),
    [colors, variant, size, sizeConfig, variantConfig, isFocused, hasError, isDisabled, glassBorder]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Input par défaut */
export const DefaultInput: React.FC<Omit<SportyInputProps, 'variant'>> = (props) => (
  <SportyInput variant="default" {...props} />
);

/** Input rempli (sans bordure) */
export const FilledInput: React.FC<Omit<SportyInputProps, 'variant'>> = (props) => (
  <SportyInput variant="filled" {...props} />
);

/** Input avec bordure épaisse */
export const OutlineInput: React.FC<Omit<SportyInputProps, 'variant'>> = (props) => (
  <SportyInput variant="outline" {...props} />
);

/** Input glassmorphism */
export const GlassInput: React.FC<Omit<SportyInputProps, 'variant'>> = (props) => (
  <SportyInput variant="glass" {...props} />
);

/** Input email */
export const EmailInput: React.FC<Omit<SportyInputProps, 'icon' | 'keyboardType' | 'autoCapitalize' | 'autoComplete'>> = (props) => (
  <SportyInput
    icon="mail-outline"
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
    {...props}
  />
);

/** Input mot de passe */
export const PasswordInput: React.FC<Omit<SportyInputProps, 'icon' | 'isPassword'>> = (props) => (
  <SportyInput
    icon="lock-closed-outline"
    isPassword
    {...props}
  />
);

/** Input recherche */
export const SearchInput: React.FC<Omit<SportyInputProps, 'icon' | 'returnKeyType'>> = (props) => (
  <SportyInput
    icon="search-outline"
    returnKeyType="search"
    {...props}
  />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(SportyInput);

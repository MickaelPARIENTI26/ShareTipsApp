/**
 * VisibilitySelector — Sélecteur de visibilité du ticket
 *
 * Permet de choisir entre ticket public ou privé (payant),
 * avec saisie du prix pour les tickets privés.
 *
 * @example
 * // Utilisation basique
 * <VisibilitySelector
 *   visibility={visibility}
 *   priceEur={price}
 *   onVisibilityChange={setVisibility}
 *   onPriceChange={setPrice}
 * />
 *
 * @example
 * // Variante glass
 * <GlassVisibilitySelector
 *   visibility={visibility}
 *   priceEur={price}
 *   onVisibilityChange={setVisibility}
 *   onPriceChange={setPrice}
 * />
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
  Animated,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { TicketVisibility } from '../../store/ticketBuilder.store';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  effectGlass,
  effectGradients,
  effectShadows,
  springConfigs,
} from '../../theme';
import { validateTicketPrice, RULES } from '../../utils/validation';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const PRICE_INPUT_ACCESSORY_ID = 'priceInputAccessory';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type VisibilitySelectorVariant = 'default' | 'card' | 'glass' | 'minimal';

/** Tailles disponibles */
export type VisibilitySelectorSize = 'sm' | 'md' | 'lg';

/** Props du composant VisibilitySelector */
export interface VisibilitySelectorProps {
  /** Visibilité actuelle */
  visibility: TicketVisibility;
  /** Prix en euros (null si gratuit) */
  priceEur: number | null;
  /** Callback de changement de visibilité */
  onVisibilityChange: (value: TicketVisibility) => void;
  /** Callback de changement de prix */
  onPriceChange: (value: number | null) => void;
  /** Variante visuelle */
  variant?: VisibilitySelectorVariant;
  /** Taille du composant */
  size?: VisibilitySelectorSize;
  /** Active les animations */
  animated?: boolean;
  /** Affiche la bordure glass */
  glassBorder?: boolean;
  /** Désactive l'interaction */
  disabled?: boolean;
  /** Masque le label */
  hideLabel?: boolean;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/** Configuration des tailles */
const SIZE_CONFIG = {
  sm: {
    containerPadding: spacing.sm,
    labelSize: 12,
    togglePadding: spacing.sm,
    toggleIconSize: 16,
    toggleTextSize: 12,
    inputPadding: spacing.sm,
    inputTextSize: 14,
    gap: spacing.xs,
  },
  md: {
    containerPadding: spacing.md,
    labelSize: 14,
    togglePadding: spacing.md,
    toggleIconSize: 18,
    toggleTextSize: 14,
    inputPadding: spacing.md,
    inputTextSize: 16,
    gap: spacing.sm,
  },
  lg: {
    containerPadding: spacing.lg,
    labelSize: 16,
    togglePadding: spacing.lg,
    toggleIconSize: 22,
    toggleTextSize: 16,
    inputPadding: spacing.lg,
    inputTextSize: 18,
    gap: spacing.md,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Bouton toggle animé */
interface ToggleButtonProps {
  type: 'public' | 'private';
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant: VisibilitySelectorVariant;
  size: VisibilitySelectorSize;
  colors: ThemeColors;
}

const ToggleButton: React.FC<ToggleButtonProps> = React.memo(
  ({ type, isActive, onPress, disabled, variant, size, colors }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const config = SIZE_CONFIG[size];

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        ...springConfigs.button,
      }).start();
    }, [scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }, [scaleAnim]);

    const icon = type === 'public' ? 'earth' : 'lock-closed';
    const label = type === 'public' ? 'Public' : 'Privé';
    const gradient =
      type === 'public' ? effectGradients.primary : effectGradients.accent;

    const buttonStyle = useMemo(
      () => ({
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: config.gap,
        paddingVertical: config.togglePadding,
        borderRadius: radius.lg,
        backgroundColor: isActive
          ? 'transparent'
          : variant === 'glass'
            ? effectGlass.card.backgroundColor
            : colors.surface,
        borderWidth: variant === 'minimal' ? 0 : 1,
        borderColor: isActive
          ? 'transparent'
          : variant === 'glass'
            ? effectGlass.card.borderColor
            : colors.border,
        overflow: 'hidden' as const,
        opacity: disabled ? 0.5 : 1,
      }),
      [config, isActive, variant, colors, disabled]
    );

    const textStyle = useMemo(
      () => ({
        fontSize: config.toggleTextSize,
        fontWeight: '700' as const,
        color: isActive ? colors.textOnPrimary : colors.textSecondary,
        letterSpacing: 0.3,
      }),
      [config, isActive, colors]
    );

    const content = (
      <>
        <Ionicons
          name={icon}
          size={config.toggleIconSize}
          color={isActive ? colors.textOnPrimary : colors.textSecondary}
        />
        <Text style={textStyle}>{label}</Text>
      </>
    );

    return (
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          testID={`visibility-${type}-button`}
          style={buttonStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={disabled}
          accessibilityLabel={`Visibilité ${label}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isActive, disabled }}
        >
          {isActive ? (
            <LinearGradient
              colors={gradient.colors}
              start={gradient.start}
              end={gradient.end}
              style={[
                StyleSheet.absoluteFill,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: config.gap,
                  borderRadius: radius.lg,
                },
              ]}
            >
              {content}
            </LinearGradient>
          ) : (
            content
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const VisibilitySelector: React.FC<VisibilitySelectorProps> = ({
  visibility,
  priceEur,
  onVisibilityChange,
  onPriceChange,
  variant = 'default',
  size = 'md',
  animated = true,
  glassBorder = false,
  disabled = false,
  hideLabel = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size, disabled, glassBorder);
  const config = SIZE_CONFIG[size];

  // ── State local ────────────────────────────────────────────────
  const [priceText, setPriceText] = useState(
    priceEur != null ? String(priceEur) : ''
  );
  const [touched, setTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ── Animations ─────────────────────────────────────────────────
  const priceRowAnim = useRef(new Animated.Value(0)).current;
  const priceRowHeightAnim = useRef(
    new Animated.Value(visibility === 'PRIVATE' ? 1 : 0)
  ).current;
  const inputGlowAnim = useRef(new Animated.Value(0)).current;

  const isPrivate = visibility === 'PRIVATE';
  const priceValidation = validateTicketPrice(priceText, isPrivate);

  // Animation du champ prix
  useEffect(() => {
    if (animated) {
      Animated.spring(priceRowHeightAnim, {
        toValue: isPrivate ? 1 : 0,
        ...springConfigs.default,
      }).start();

      Animated.timing(priceRowAnim, {
        toValue: isPrivate ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      priceRowHeightAnim.setValue(isPrivate ? 1 : 0);
      priceRowAnim.setValue(isPrivate ? 1 : 0);
    }
  }, [isPrivate, animated, priceRowHeightAnim, priceRowAnim]);

  // Animation du glow sur focus
  useEffect(() => {
    Animated.timing(inputGlowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputGlowAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handlePriceChange = useCallback(
    (text: string) => {
      setPriceText(text);
      setTouched(true);
      const num = parseInt(text, 10);
      onPriceChange(Number.isNaN(num) || num < 1 ? null : num);
    },
    [onPriceChange]
  );

  const handleVisibilityChange = useCallback(
    (value: TicketVisibility) => {
      if (disabled) return;
      onVisibilityChange(value);
      if (value === 'PUBLIC') {
        setPriceText('');
        setTouched(false);
      }
    },
    [disabled, onVisibilityChange]
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleDismiss = useCallback(() => Keyboard.dismiss(), []);

  // ── Styles animés ──────────────────────────────────────────────
  const priceRowAnimStyle = useMemo(
    () => ({
      opacity: priceRowAnim,
      transform: [
        {
          translateY: priceRowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-10, 0],
          }),
        },
      ],
    }),
    [priceRowAnim]
  );

  const inputBorderColor = useMemo(
    () =>
      inputGlowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          touched && !priceValidation.isValid
            ? colors.danger
            : colors.inputBorder,
          colors.accent,
        ],
      }),
    [inputGlowAnim, touched, priceValidation.isValid, colors]
  );

  // ── Rendu du champ prix ────────────────────────────────────────
  const renderPriceInput = () => {
    if (!isPrivate) return null;

    return (
      <Animated.View style={[styles.priceRow, priceRowAnimStyle]}>
        <Text style={styles.priceLabel}>
          Prix du ticket ({RULES.TICKET.minPrice}-{RULES.TICKET.maxPrice} EUR)
        </Text>

        <Animated.View
          style={[
            styles.priceInputWrapper,
            { borderColor: inputBorderColor },
            isFocused && styles.priceInputFocused,
          ]}
        >
          {variant === 'glass' ? (
            <LinearGradient
              colors={effectGradients.cardGlass.colors}
              start={effectGradients.cardGlass.start}
              end={effectGradients.cardGlass.end}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
            />
          ) : null}

          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>EUR</Text>
          </View>

          <TextInput
            testID="price-input"
            style={styles.priceInput}
            keyboardType="number-pad"
            placeholder={`${RULES.TICKET.minPrice} - ${RULES.TICKET.maxPrice}`}
            placeholderTextColor={colors.textTertiary}
            value={priceText}
            onChangeText={handlePriceChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleDismiss}
            editable={!disabled}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? PRICE_INPUT_ACCESSORY_ID : undefined
            }
            accessibilityLabel="Prix du ticket en euros"
          />

          {isFocused && (
            <TouchableOpacity
              style={styles.okButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
              accessibilityLabel="Valider le prix"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={effectGradients.accent.colors}
                start={effectGradients.accent.start}
                end={effectGradients.accent.end}
                style={styles.okButtonGradient}
              >
                <Ionicons
                  name="checkmark"
                  size={config.toggleIconSize}
                  color={colors.textOnPrimary}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {touched && !priceValidation.isValid && (
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle"
              size={14}
              color={colors.danger}
            />
            <Text style={styles.priceError}>{priceValidation.error}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // ── Rendu principal ────────────────────────────────────────────
  const containerContent = (
    <>
      {!hideLabel && <Text style={styles.label}>Visibilité du ticket</Text>}

      <View style={styles.toggleRow}>
        <ToggleButton
          type="public"
          isActive={visibility === 'PUBLIC'}
          onPress={() => handleVisibilityChange('PUBLIC')}
          disabled={disabled}
          variant={variant}
          size={size}
          colors={colors}
        />
        <ToggleButton
          type="private"
          isActive={visibility === 'PRIVATE'}
          onPress={() => handleVisibilityChange('PRIVATE')}
          disabled={disabled}
          variant={variant}
          size={size}
          colors={colors}
        />
      </View>

      {renderPriceInput()}
    </>
  );

  if (variant === 'card' || variant === 'glass') {
    return (
      <View style={[styles.wrapper, style]}>
        {variant === 'glass' ? (
          <LinearGradient
            colors={effectGradients.cardGlass.colors}
            start={effectGradients.cardGlass.start}
            end={effectGradients.cardGlass.end}
            style={styles.container}
          >
            {containerContent}
          </LinearGradient>
        ) : (
          <View style={styles.container}>{containerContent}</View>
        )}
      </View>
    );
  }

  return <View style={[styles.container, style]}>{containerContent}</View>;
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: VisibilitySelectorVariant,
  size: VisibilitySelectorSize,
  disabled: boolean,
  glassBorder: boolean
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];

    const variantStyles = {
      default: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        padding: 0,
      },
      card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        padding: config.containerPadding,
        ...effectShadows.card,
      },
      glass: {
        ...effectGlass.card,
        borderColor: glassBorder
          ? effectGlass.primary.borderColor
          : effectGlass.card.borderColor,
        padding: config.containerPadding,
      },
      minimal: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        padding: 0,
      },
    };

    const currentVariant = variantStyles[variant];

    return StyleSheet.create({
      wrapper: {
        marginBottom: spacing.md,
      },
      container: {
        borderRadius: radius.xl,
        backgroundColor: currentVariant.backgroundColor,
        borderWidth: currentVariant.borderWidth,
        borderColor: currentVariant.borderColor,
        padding: currentVariant.padding,
        opacity: disabled ? 0.6 : 1,
        overflow: 'hidden',
      },
      label: {
        fontSize: config.labelSize,
        fontWeight: '700',
        color: colors.text,
        marginBottom: config.gap,
        letterSpacing: -0.3,
      },
      toggleRow: {
        flexDirection: 'row',
        gap: config.gap,
      },
      priceRow: {
        marginTop: spacing.lg,
      },
      priceLabel: {
        fontSize: config.labelSize - 2,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '500',
      },
      priceInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor:
          variant === 'glass'
            ? 'transparent'
            : colors.inputBg,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderWidth: 2,
        borderColor: colors.inputBorder,
        overflow: 'hidden',
      },
      priceInputFocused: {
        ...effectShadows.inputFocus,
      },
      currencyBadge: {
        backgroundColor: colors.primary + '20',
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginRight: spacing.sm,
      },
      currencyText: {
        fontSize: config.inputTextSize - 2,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 0.5,
      },
      priceInput: {
        flex: 1,
        fontSize: config.inputTextSize,
        fontWeight: '700',
        color: colors.text,
        paddingVertical: config.inputPadding - 4,
        fontVariant: ['tabular-nums'],
      },
      okButton: {
        marginLeft: spacing.sm,
      },
      okButtonGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
      },
      errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
      },
      priceError: {
        fontSize: 12,
        color: colors.danger,
        fontWeight: '500',
      },
    });
  }, [colors, variant, size, disabled, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * VisibilitySelector par défaut
 */
export const DefaultVisibilitySelector: React.FC<VisibilitySelectorProps> = (
  props
) => <VisibilitySelector {...props} variant="default" />;

/**
 * VisibilitySelector en carte
 */
export const CardVisibilitySelector: React.FC<VisibilitySelectorProps> = (
  props
) => <VisibilitySelector {...props} variant="card" />;

/**
 * VisibilitySelector avec effet glassmorphism
 */
export const GlassVisibilitySelector: React.FC<VisibilitySelectorProps> = (
  props
) => <VisibilitySelector {...props} variant="glass" glassBorder />;

/**
 * VisibilitySelector minimal
 */
export const MinimalVisibilitySelector: React.FC<VisibilitySelectorProps> = (
  props
) => <VisibilitySelector {...props} variant="minimal" />;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(VisibilitySelector);

/**
 * ConfidenceSelector — Sélecteur d'indice de confiance
 *
 * Permet de définir un niveau de confiance (0-10) pour un ticket
 * avec un slider interactif et un badge de valeur coloré.
 *
 * @example
 * // Utilisation basique
 * <ConfidenceSelector value={confidence} onChange={setConfidence} />
 *
 * @example
 * // Variante glass
 * <GlassConfidenceSelector value={confidence} onChange={setConfidence} />
 *
 * @example
 * // Avec niveaux descriptifs
 * <ConfidenceSelector value={confidence} onChange={setConfidence} showLevels />
 */

import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
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

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type ConfidenceSelectorVariant = 'default' | 'card' | 'glass' | 'minimal';

/** Tailles disponibles */
export type ConfidenceSelectorSize = 'sm' | 'md' | 'lg';

/** Niveaux de confiance */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/** Props du composant ConfidenceSelector */
export interface ConfidenceSelectorProps {
  /** Valeur actuelle (0-10 ou null) */
  value: number | null;
  /** Callback de changement de valeur */
  onChange: (value: number) => void;
  /** Variante visuelle */
  variant?: ConfidenceSelectorVariant;
  /** Taille du composant */
  size?: ConfidenceSelectorSize;
  /** Affiche les labels de niveau */
  showLevels?: boolean;
  /** Affiche les boutons +/- */
  showControls?: boolean;
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
    badgeSize: 28,
    badgeTextSize: 13,
    sliderHeight: 32,
    scaleTextSize: 10,
    iconSize: 16,
    gap: spacing.xs,
  },
  md: {
    containerPadding: spacing.md,
    labelSize: 14,
    badgeSize: 36,
    badgeTextSize: 16,
    sliderHeight: 40,
    scaleTextSize: 11,
    iconSize: 18,
    gap: spacing.sm,
  },
  lg: {
    containerPadding: spacing.lg,
    labelSize: 16,
    badgeSize: 44,
    badgeTextSize: 20,
    sliderHeight: 48,
    scaleTextSize: 12,
    iconSize: 22,
    gap: spacing.md,
  },
} as const;

/** Labels des niveaux de confiance */
const CONFIDENCE_LEVELS = {
  low: { label: 'Faible', icon: 'alert-circle' as const, range: [0, 3] },
  medium: { label: 'Moyen', icon: 'time' as const, range: [4, 6] },
  high: { label: 'Élevé', icon: 'checkmark-circle' as const, range: [7, 10] },
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Détermine le niveau de confiance */
const getConfidenceLevel = (value: number | null): ConfidenceLevel => {
  if (value === null || value <= 3) return 'low';
  if (value <= 6) return 'medium';
  return 'high';
};

/** Récupère la couleur selon le niveau */
const getConfidenceColor = (
  value: number | null,
  colors: ThemeColors
): string => {
  if (value === null) return colors.border;
  if (value <= 3) return colors.danger;
  if (value <= 6) return colors.accent;
  return colors.primary;
};

/** Récupère le gradient selon le niveau */
const getConfidenceGradient = (value: number | null) => {
  if (value === null) return effectGradients.card;
  if (value <= 3) return effectGradients.danger;
  if (value <= 6) return effectGradients.accent;
  return effectGradients.primary;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const ConfidenceSelector: React.FC<ConfidenceSelectorProps> = ({
  value,
  onChange,
  variant = 'default',
  size = 'md',
  showLevels = false,
  showControls = false,
  animated = true,
  glassBorder = false,
  disabled = false,
  hideLabel = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size, disabled, glassBorder);
  const config = SIZE_CONFIG[size];

  const displayValue = value ?? 0;
  const confidenceColor = getConfidenceColor(value, colors);
  const confidenceGradient = getConfidenceGradient(value);
  const confidenceLevel = getConfidenceLevel(value);
  const levelConfig = CONFIDENCE_LEVELS[confidenceLevel];

  // ── Animations ─────────────────────────────────────────────────
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeRotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(displayValue / 10)).current;

  // Animation du badge au changement de valeur
  useEffect(() => {
    if (animated && value !== null) {
      Animated.sequence([
        Animated.spring(badgeScaleAnim, {
          toValue: 1.15,
          ...springConfigs.button,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          ...springConfigs.default,
        }),
      ]).start();

      Animated.timing(progressAnim, {
        toValue: value / 10,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [value, animated, badgeScaleAnim, progressAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleValueChange = useCallback(
    (newValue: number) => {
      if (!disabled) {
        onChange(Math.round(newValue));
      }
    },
    [disabled, onChange]
  );

  const handleIncrement = useCallback(() => {
    if (!disabled && (value ?? 0) < 10) {
      onChange(Math.min(10, (value ?? 0) + 1));
    }
  }, [disabled, value, onChange]);

  const handleDecrement = useCallback(() => {
    if (!disabled && (value ?? 0) > 0) {
      onChange(Math.max(0, (value ?? 0) - 1));
    }
  }, [disabled, value, onChange]);

  // ── Rendu du badge de valeur ───────────────────────────────────
  const renderValueBadge = () => {
    const badgeAnimStyle = {
      transform: [{ scale: badgeScaleAnim }],
    };

    return (
      <Animated.View style={badgeAnimStyle}>
        <LinearGradient
          colors={confidenceGradient.colors}
          start={confidenceGradient.start}
          end={confidenceGradient.end}
          style={styles.valueBadge}
        >
          <Text
            style={[
              styles.valueText,
              value === null && styles.valueTextPlaceholder,
            ]}
          >
            {value ?? '–'}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  // ── Rendu des contrôles +/- ────────────────────────────────────
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlBtn, (value ?? 0) <= 0 && styles.controlBtnDisabled]}
          onPress={handleDecrement}
          disabled={disabled || (value ?? 0) <= 0}
          accessibilityLabel="Diminuer la confiance"
          accessibilityRole="button"
        >
          <Ionicons
            name="remove"
            size={config.iconSize}
            color={(value ?? 0) <= 0 ? colors.textTertiary : colors.text}
          />
        </TouchableOpacity>

        <View style={styles.sliderWrapper}>
          <Slider
            testID="confidence-slider"
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={displayValue}
            onValueChange={handleValueChange}
            minimumTrackTintColor={confidenceColor}
            maximumTrackTintColor={
              variant === 'glass'
                ? 'rgba(255,255,255,0.1)'
                : colors.surfaceElevated
            }
            thumbTintColor={confidenceColor}
            disabled={disabled}
          />
        </View>

        <TouchableOpacity
          style={[styles.controlBtn, (value ?? 0) >= 10 && styles.controlBtnDisabled]}
          onPress={handleIncrement}
          disabled={disabled || (value ?? 0) >= 10}
          accessibilityLabel="Augmenter la confiance"
          accessibilityRole="button"
        >
          <Ionicons
            name="add"
            size={config.iconSize}
            color={(value ?? 0) >= 10 ? colors.textTertiary : colors.text}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Rendu du slider standard ───────────────────────────────────
  const renderSlider = () => {
    if (showControls) return null;

    return (
      <View style={styles.sliderContainer}>
        {variant === 'glass' && (
          <LinearGradient
            colors={effectGradients.cardGlass.colors}
            start={effectGradients.cardGlass.start}
            end={effectGradients.cardGlass.end}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Slider
          testID="confidence-slider"
          style={styles.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={displayValue}
          onValueChange={handleValueChange}
          minimumTrackTintColor={confidenceColor}
          maximumTrackTintColor={
            variant === 'glass'
              ? 'rgba(255,255,255,0.1)'
              : colors.surfaceElevated
          }
          thumbTintColor={confidenceColor}
          disabled={disabled}
        />
      </View>
    );
  };

  // ── Rendu des niveaux ──────────────────────────────────────────
  const renderLevels = () => {
    if (!showLevels) return null;

    return (
      <View style={styles.levelsRow}>
        {(Object.entries(CONFIDENCE_LEVELS) as [ConfidenceLevel, typeof CONFIDENCE_LEVELS.low][]).map(
          ([key, level]) => {
            const isActive = confidenceLevel === key;
            const levelColor =
              key === 'low'
                ? colors.danger
                : key === 'medium'
                  ? colors.accent
                  : colors.primary;

            return (
              <View
                key={key}
                style={[
                  styles.levelItem,
                  isActive && styles.levelItemActive,
                  isActive && { borderColor: levelColor },
                ]}
              >
                <Ionicons
                  name={level.icon}
                  size={config.iconSize - 2}
                  color={isActive ? levelColor : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.levelText,
                    isActive && { color: levelColor },
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.levelRange}>
                  {level.range[0]}-{level.range[1]}
                </Text>
              </View>
            );
          }
        )}
      </View>
    );
  };

  // ── Rendu de l'échelle ─────────────────────────────────────────
  const renderScale = () => (
    <View style={styles.scaleRow}>
      <View style={styles.scaleItem}>
        <Ionicons name="alert-circle" size={12} color={colors.danger} />
        <Text style={[styles.scaleText, styles.scaleLow]}>0</Text>
      </View>
      <Text style={styles.scaleText}>5</Text>
      <View style={styles.scaleItem}>
        <Text style={[styles.scaleText, styles.scaleHigh]}>10</Text>
        <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
      </View>
    </View>
  );

  // ── Rendu principal ────────────────────────────────────────────
  const containerContent = (
    <>
      {!hideLabel && (
        <View style={styles.labelRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Indice de confiance</Text>
            {showLevels && value !== null && (
              <View style={[styles.levelBadge, { backgroundColor: confidenceColor + '20' }]}>
                <Ionicons
                  name={levelConfig.icon}
                  size={config.iconSize - 4}
                  color={confidenceColor}
                />
                <Text style={[styles.levelBadgeText, { color: confidenceColor }]}>
                  {levelConfig.label}
                </Text>
              </View>
            )}
          </View>
          {renderValueBadge()}
        </View>
      )}

      {renderSlider()}
      {renderControls()}
      {!showLevels && renderScale()}
      {renderLevels()}
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
  variant: ConfidenceSelectorVariant,
  size: ConfidenceSelectorSize,
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
      labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: config.gap,
      },
      labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
      },
      label: {
        fontSize: config.labelSize,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.3,
      },
      levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
      },
      levelBadgeText: {
        fontSize: config.labelSize - 2,
        fontWeight: '600',
      },
      valueBadge: {
        borderRadius: radius.md,
        minWidth: config.badgeSize,
        height: config.badgeSize,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
        ...effectShadows.glowPrimarySubtle,
      },
      valueText: {
        fontSize: config.badgeTextSize,
        fontWeight: '900',
        color: colors.textOnPrimary,
        fontVariant: ['tabular-nums'],
      },
      valueTextPlaceholder: {
        color: colors.textSecondary,
        fontWeight: '500',
      },
      sliderContainer: {
        backgroundColor:
          variant === 'glass' ? 'transparent' : colors.surface,
        borderRadius: radius.lg,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
        overflow: 'hidden',
        borderWidth: variant === 'glass' ? 1 : 0,
        borderColor: variant === 'glass' ? effectGlass.light.borderColor : 'transparent',
      },
      slider: {
        width: '100%',
        height: config.sliderHeight,
      },
      controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      },
      controlBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
      },
      controlBtnDisabled: {
        opacity: 0.4,
      },
      sliderWrapper: {
        flex: 1,
        backgroundColor:
          variant === 'glass' ? 'rgba(255,255,255,0.05)' : colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.xs,
      },
      scaleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        marginTop: spacing.xs,
      },
      scaleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
      },
      scaleText: {
        fontSize: config.scaleTextSize,
        color: colors.textTertiary,
        fontWeight: '500',
      },
      scaleLow: {
        color: colors.danger,
        fontWeight: '600',
      },
      scaleHigh: {
        color: colors.primary,
        fontWeight: '600',
      },
      levelsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
      },
      levelItem: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      levelItemActive: {
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
      levelText: {
        fontSize: config.scaleTextSize,
        fontWeight: '600',
        color: colors.textTertiary,
      },
      levelRange: {
        fontSize: config.scaleTextSize - 1,
        color: colors.textTertiary,
        fontWeight: '500',
      },
    });
  }, [colors, variant, size, disabled, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * ConfidenceSelector par défaut
 */
export const DefaultConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="default" />;

/**
 * ConfidenceSelector en carte
 */
export const CardConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="card" />;

/**
 * ConfidenceSelector avec effet glassmorphism
 */
export const GlassConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="glass" glassBorder />;

/**
 * ConfidenceSelector minimal
 */
export const MinimalConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="minimal" />;

/**
 * ConfidenceSelector avec niveaux affichés
 */
export const DetailedConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="card" showLevels />;

/**
 * ConfidenceSelector avec contrôles +/-
 */
export const ControlledConfidenceSelector: React.FC<ConfidenceSelectorProps> = (
  props
) => <ConfidenceSelector {...props} variant="default" showControls />;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(ConfidenceSelector);

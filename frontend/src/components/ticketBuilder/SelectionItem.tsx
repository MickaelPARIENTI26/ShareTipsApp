/**
 * SelectionItem — Composant de sélection pour le Ticket Builder
 *
 * Affiche une sélection de pari avec les détails du match,
 * la cote et une option de suppression.
 *
 * @example
 * // Utilisation basique
 * <SelectionItem item={selection} onRemove={handleRemove} />
 *
 * @example
 * // Variante compacte
 * <CompactSelectionItem item={selection} onRemove={handleRemove} />
 *
 * @example
 * // Variante glass avec animation
 * <GlassSelectionItem item={selection} onRemove={handleRemove} animated />
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
import { Ionicons } from '@expo/vector-icons';
import type { TicketSelection } from '../../types';
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
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type SelectionItemVariant = 'default' | 'compact' | 'detailed' | 'glass';

/** Tailles disponibles */
export type SelectionItemSize = 'sm' | 'md' | 'lg';

/** Props du composant SelectionItem */
export interface SelectionItemProps {
  /** Données de la sélection */
  item: TicketSelection;
  /** Callback de suppression */
  onRemove: (matchId: string) => void;
  /** Variante visuelle */
  variant?: SelectionItemVariant;
  /** Taille du composant */
  size?: SelectionItemSize;
  /** Active les animations d'entrée */
  animated?: boolean;
  /** Délai d'animation (pour listes) */
  animationDelay?: number;
  /** Affiche la bordure glass */
  glassBorder?: boolean;
  /** Désactive l'interaction */
  disabled?: boolean;
  /** Affiche un indicateur de tendance */
  showTrend?: boolean;
  /** Direction de la tendance */
  trend?: 'up' | 'down' | 'stable';
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
    matchLabelSize: 12,
    leagueSize: 10,
    marketSize: 10,
    badgePaddingH: spacing.xs,
    badgePaddingV: 2,
    badgeTextSize: 10,
    oddsSize: 14,
    removeIconSize: 20,
    gap: spacing.xxs,
  },
  md: {
    containerPadding: spacing.md,
    matchLabelSize: 14,
    leagueSize: 12,
    marketSize: 11,
    badgePaddingH: spacing.sm,
    badgePaddingV: spacing.xxs,
    badgeTextSize: 12,
    oddsSize: 16,
    removeIconSize: 24,
    gap: spacing.xs,
  },
  lg: {
    containerPadding: spacing.lg,
    matchLabelSize: 16,
    leagueSize: 13,
    marketSize: 12,
    badgePaddingH: spacing.md,
    badgePaddingV: spacing.xs,
    badgeTextSize: 13,
    oddsSize: 18,
    removeIconSize: 28,
    gap: spacing.sm,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const SelectionItem: React.FC<SelectionItemProps> = ({
  item,
  onRemove,
  variant = 'default',
  size = 'md',
  animated = false,
  animationDelay = 0,
  glassBorder = false,
  disabled = false,
  showTrend = false,
  trend = 'stable',
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size, disabled, glassBorder);
  const sizeConfig = SIZE_CONFIG[size];

  // ── Animations ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(animated ? 20 : 0)).current;
  const removeScaleAnim = useRef(new Animated.Value(1)).current;

  // Animation d'entrée
  useEffect(() => {
    if (animated) {
      const delay = animationDelay;
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          delay,
          ...springConfigs.default,
        }),
      ]).start();
    }
  }, [animated, animationDelay, opacityAnim, translateYAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    haptics.light();
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      ...springConfigs.button,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.default,
    }).start();
  }, [scaleAnim]);

  const handleRemovePressIn = useCallback(() => {
    haptics.light();
    Animated.spring(removeScaleAnim, {
      toValue: 0.85,
      ...springConfigs.button,
    }).start();
  }, [removeScaleAnim]);

  const handleRemovePressOut = useCallback(() => {
    Animated.spring(removeScaleAnim, {
      toValue: 1,
      ...springConfigs.default,
    }).start();
  }, [removeScaleAnim]);

  const handleRemove = useCallback(() => {
    if (!disabled) {
      // Haptic feedback on remove
      haptics.warning();
      // Animation de sortie
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onRemove(item.matchId);
      });
    }
  }, [disabled, item.matchId, onRemove, opacityAnim, scaleAnim]);

  // ── Trend Icon ─────────────────────────────────────────────────
  const trendIcon = useMemo(() => {
    if (!showTrend) return null;

    const config = {
      up: { icon: 'trending-up' as const, color: colors.success },
      down: { icon: 'trending-down' as const, color: colors.danger },
      stable: { icon: 'remove' as const, color: colors.textTertiary },
    };

    const { icon, color } = config[trend];

    return (
      <Ionicons
        name={icon}
        size={sizeConfig.removeIconSize - 4}
        color={color}
        style={styles.trendIcon}
      />
    );
  }, [showTrend, trend, colors, sizeConfig.removeIconSize, styles.trendIcon]);

  // ── Container animé ────────────────────────────────────────────
  const animatedContainerStyle = useMemo(
    () => ({
      opacity: opacityAnim,
      transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
    }),
    [opacityAnim, scaleAnim, translateYAnim]
  );

  // ── Rendu du badge de sélection ────────────────────────────────
  const renderSelectionBadge = useMemo(() => {
    if (variant === 'glass') {
      return (
        <LinearGradient
          colors={effectGradients.primary.colors}
          start={effectGradients.primary.start}
          end={effectGradients.primary.end}
          style={styles.selBadge}
        >
          <Text style={styles.selBadgeText}>{item.selectionLabel}</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.selBadge}>
        <Text style={styles.selBadgeText}>{item.selectionLabel}</Text>
      </View>
    );
  }, [variant, styles.selBadge, styles.selBadgeText, item.selectionLabel]);

  // ── Rendu du contenu ───────────────────────────────────────────
  const renderContent = () => (
    <>
      <View style={styles.info}>
        <Text style={styles.matchLabel} numberOfLines={1}>
          {item.matchLabel}
        </Text>

        {variant !== 'compact' && (
          <Text style={styles.league} numberOfLines={1}>
            {item.leagueName}
          </Text>
        )}

        <View style={styles.selectionRow}>
          <Text style={styles.marketLabel} numberOfLines={1}>
            {item.marketLabel}
          </Text>
          {renderSelectionBadge}
          <View style={styles.oddsContainer}>
            {trendIcon}
            <Text style={styles.odds}>{item.odds.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: removeScaleAnim }] }}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          onPressIn={handleRemovePressIn}
          onPressOut={handleRemovePressOut}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={disabled}
          accessibilityLabel="Supprimer la sélection"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={effectGradients.danger.colors}
            start={effectGradients.danger.start}
            end={effectGradients.danger.end}
            style={styles.removeButtonGradient}
          >
            <Ionicons
              name="close"
              size={sizeConfig.removeIconSize - 8}
              color={colors.textOnPrimary}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  // ── Rendu principal ────────────────────────────────────────────
  if (variant === 'glass') {
    return (
      <Animated.View style={[styles.wrapper, animatedContainerStyle, style]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityLabel={`Sélection: ${item.matchLabel}, ${item.selectionLabel}`}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={effectGradients.cardGlass.colors}
            start={effectGradients.cardGlass.start}
            end={effectGradients.cardGlass.end}
            style={styles.container}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={`Sélection: ${item.matchLabel}, ${item.selectionLabel}`}
        accessibilityRole="button"
      >
        <View style={styles.container}>{renderContent()}</View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: SelectionItemVariant,
  size: SelectionItemSize,
  disabled: boolean,
  glassBorder: boolean
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];

    // Configuration par variante
    const variantStyles = {
      default: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      },
      compact: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      },
      detailed: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: 1,
        ...effectShadows.card,
      },
      glass: {
        ...effectGlass.card,
        borderColor: glassBorder ? effectGlass.primary.borderColor : effectGlass.card.borderColor,
      },
    };

    const currentVariant = variantStyles[variant];

    return StyleSheet.create({
      wrapper: {
        marginBottom: spacing.sm,
      },
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.lg,
        padding: config.containerPadding,
        backgroundColor: currentVariant.backgroundColor,
        borderWidth: currentVariant.borderWidth,
        borderColor: currentVariant.borderColor,
        opacity: disabled ? 0.5 : 1,
        ...(variant === 'detailed' && effectShadows.card),
      },
      info: {
        flex: 1,
        gap: config.gap,
      },
      matchLabel: {
        fontSize: config.matchLabelSize,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.3,
      },
      league: {
        fontSize: config.leagueSize,
        color: colors.textSecondary,
        marginBottom: variant === 'detailed' ? spacing.xs : 0,
      },
      selectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
      },
      marketLabel: {
        fontSize: config.marketSize,
        color: colors.textTertiary,
        flex: variant === 'compact' ? 0 : 1,
        maxWidth: variant === 'compact' ? 80 : undefined,
      },
      selBadge: {
        backgroundColor: variant === 'glass' ? 'transparent' : colors.primary,
        borderRadius: radius.sm,
        paddingHorizontal: config.badgePaddingH,
        paddingVertical: config.badgePaddingV,
        overflow: 'hidden',
      },
      selBadgeText: {
        fontSize: config.badgeTextSize,
        fontWeight: '700',
        color: colors.textOnPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      oddsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
      },
      trendIcon: {
        marginRight: spacing.xxs,
      },
      odds: {
        fontSize: config.oddsSize,
        fontWeight: '800',
        color: colors.accent,
        fontVariant: ['tabular-nums'],
      },
      removeButton: {
        marginLeft: spacing.sm,
      },
      removeButtonGradient: {
        width: config.removeIconSize,
        height: config.removeIconSize,
        borderRadius: config.removeIconSize / 2,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });
  }, [colors, variant, size, disabled, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * SelectionItem par défaut
 */
export const DefaultSelectionItem: React.FC<SelectionItemProps> = (props) => (
  <SelectionItem {...props} variant="default" />
);

/**
 * SelectionItem compact pour espaces réduits
 */
export const CompactSelectionItem: React.FC<SelectionItemProps> = (props) => (
  <SelectionItem {...props} variant="compact" size="sm" />
);

/**
 * SelectionItem détaillé avec ombre
 */
export const DetailedSelectionItem: React.FC<SelectionItemProps> = (props) => (
  <SelectionItem {...props} variant="detailed" />
);

/**
 * SelectionItem avec effet glassmorphism
 */
export const GlassSelectionItem: React.FC<SelectionItemProps> = (props) => (
  <SelectionItem {...props} variant="glass" glassBorder />
);

/**
 * SelectionItem animé avec effet glass
 */
export const AnimatedSelectionItem: React.FC<SelectionItemProps> = (props) => (
  <SelectionItem {...props} variant="glass" animated glassBorder />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(SelectionItem);

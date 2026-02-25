/**
 * TicketBuilderHeader — En-tête du constructeur de ticket
 *
 * Affiche le titre, le nombre de sélections, la cote totale
 * et permet d'ouvrir/fermer le ticket builder.
 *
 * @example
 * // Utilisation basique
 * <TicketBuilderHeader
 *   count={3}
 *   isOpen={false}
 *   totalOdds={4.25}
 *   onToggle={handleToggle}
 * />
 *
 * @example
 * // Variante glass
 * <GlassTicketBuilderHeader
 *   count={3}
 *   isOpen={false}
 *   totalOdds={4.25}
 *   onToggle={handleToggle}
 * />
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
export type TicketBuilderHeaderVariant = 'default' | 'gradient' | 'glass' | 'minimal';

/** Tailles disponibles */
export type TicketBuilderHeaderSize = 'sm' | 'md' | 'lg';

/** Props du composant TicketBuilderHeader */
export interface TicketBuilderHeaderProps {
  /** Nombre de sélections */
  count: number;
  /** État ouvert/fermé */
  isOpen: boolean;
  /** Cote totale */
  totalOdds: number;
  /** Callback toggle */
  onToggle: () => void;
  /** Variante visuelle */
  variant?: TicketBuilderHeaderVariant;
  /** Taille du composant */
  size?: TicketBuilderHeaderSize;
  /** Titre personnalisé */
  title?: string;
  /** Affiche le gain potentiel */
  showPotentialWin?: boolean;
  /** Mise actuelle pour calcul du gain */
  stake?: number;
  /** Active les animations */
  animated?: boolean;
  /** Affiche la bordure glass */
  glassBorder?: boolean;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/** Configuration des tailles */
const SIZE_CONFIG = {
  sm: {
    paddingH: spacing.md,
    paddingV: spacing.sm,
    iconWrapperSize: 28,
    iconSize: 16,
    titleSize: 14,
    badgeSize: 18,
    badgeTextSize: 11,
    oddsLabelSize: 10,
    oddsValueSize: 14,
    chevronSize: 24,
    chevronIconSize: 16,
    gap: spacing.xs,
  },
  md: {
    paddingH: spacing.base,
    paddingV: spacing.md,
    iconWrapperSize: 34,
    iconSize: 18,
    titleSize: 16,
    badgeSize: 22,
    badgeTextSize: 12,
    oddsLabelSize: 11,
    oddsValueSize: 16,
    chevronSize: 28,
    chevronIconSize: 18,
    gap: spacing.sm,
  },
  lg: {
    paddingH: spacing.lg,
    paddingV: spacing.base,
    iconWrapperSize: 40,
    iconSize: 22,
    titleSize: 18,
    badgeSize: 26,
    badgeTextSize: 13,
    oddsLabelSize: 12,
    oddsValueSize: 18,
    chevronSize: 32,
    chevronIconSize: 20,
    gap: spacing.md,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const TicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = ({
  count,
  isOpen,
  totalOdds,
  onToggle,
  variant = 'default',
  size = 'md',
  title = 'Coupon',
  showPotentialWin = false,
  stake = 0,
  animated = true,
  glassBorder = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size, glassBorder);
  const config = SIZE_CONFIG[size];

  // ── Animations ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const chevronRotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const badgePulseAnim = useRef(new Animated.Value(1)).current;
  const countRef = useRef(count);

  // Animation du chevron
  useEffect(() => {
    if (animated) {
      Animated.spring(chevronRotateAnim, {
        toValue: isOpen ? 1 : 0,
        ...springConfigs.default,
      }).start();
    } else {
      chevronRotateAnim.setValue(isOpen ? 1 : 0);
    }
  }, [isOpen, animated, chevronRotateAnim]);

  // Animation du badge quand count change
  useEffect(() => {
    if (animated && count !== countRef.current && count > 0) {
      Animated.sequence([
        Animated.spring(badgePulseAnim, {
          toValue: 1.3,
          ...springConfigs.button,
        }),
        Animated.spring(badgePulseAnim, {
          toValue: 1,
          ...springConfigs.default,
        }),
      ]).start();
    }
    countRef.current = count;
  }, [count, animated, badgePulseAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, scaleAnim]);

  // ── Calculs ────────────────────────────────────────────────────
  const potentialWin = useMemo(() => {
    if (!showPotentialWin || stake <= 0) return 0;
    return stake * totalOdds;
  }, [showPotentialWin, stake, totalOdds]);

  // ── Rotation du chevron ────────────────────────────────────────
  const chevronRotation = chevronRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // ── Rendu du badge de count ────────────────────────────────────
  const renderBadge = () => {
    if (count <= 0) return null;

    return (
      <Animated.View
        style={[
          styles.badge,
          { transform: [{ scale: badgePulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={effectGradients.accent.colors}
          start={effectGradients.accent.start}
          end={effectGradients.accent.end}
          style={styles.badgeGradient}
        >
          <Text style={styles.badgeText}>{count}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  // ── Rendu du côté droit ────────────────────────────────────────
  const renderRight = () => {
    if (!isOpen && count > 0) {
      return (
        <View style={styles.right}>
          <View style={styles.oddsContainer}>
            <Text style={styles.oddsLabel}>Cote totale</Text>
            <Text style={styles.oddsValue}>{totalOdds.toFixed(2)}</Text>
          </View>

          {showPotentialWin && stake > 0 && (
            <View style={styles.potentialWinContainer}>
              <Text style={styles.potentialWinLabel}>Gain</Text>
              <Text style={styles.potentialWinValue}>
                {potentialWin.toFixed(2)}€
              </Text>
            </View>
          )}

          <Animated.View
            style={[
              styles.chevronWrapper,
              { transform: [{ rotate: chevronRotation }] },
            ]}
          >
            <Ionicons
              name="chevron-up"
              size={config.chevronIconSize}
              color={colors.textOnPrimary}
            />
          </Animated.View>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.chevronWrapper,
          { transform: [{ rotate: chevronRotation }] },
        ]}
      >
        <Ionicons
          name="chevron-up"
          size={config.chevronIconSize}
          color={colors.textOnPrimary}
        />
      </Animated.View>
    );
  };

  // ── Rendu du contenu ───────────────────────────────────────────
  const renderContent = () => (
    <>
      <View style={styles.left}>
        <View style={styles.iconWrapper}>
          <Ionicons name="receipt" size={config.iconSize} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {renderBadge()}
      </View>
      {renderRight()}
    </>
  );

  // ── Container animé ────────────────────────────────────────────
  const animatedContainerStyle = useMemo(
    () => ({
      transform: [{ scale: scaleAnim }],
    }),
    [scaleAnim]
  );

  // ── Rendu principal ────────────────────────────────────────────
  if (variant === 'gradient' || variant === 'default') {
    return (
      <Animated.View style={[animatedContainerStyle, style]}>
        <TouchableOpacity
          testID="ticket-builder-header"
          activeOpacity={0.95}
          onPress={onToggle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={`${title}, ${count} sélections, cote ${totalOdds.toFixed(2)}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
        >
          <LinearGradient
            colors={effectGradients.primary.colors}
            start={effectGradients.primary.start}
            end={effectGradients.primary.end}
            style={styles.container}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'glass') {
    return (
      <Animated.View style={[animatedContainerStyle, style]}>
        <TouchableOpacity
          testID="ticket-builder-header"
          activeOpacity={0.95}
          onPress={onToggle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={`${title}, ${count} sélections, cote ${totalOdds.toFixed(2)}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
        >
          <LinearGradient
            colors={effectGradients.cardGlass.colors}
            start={effectGradients.cardGlass.start}
            end={effectGradients.cardGlass.end}
            style={[styles.container, styles.containerGlass]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Minimal
  return (
    <Animated.View style={[animatedContainerStyle, style]}>
      <TouchableOpacity
        testID="ticket-builder-header"
        style={styles.container}
        activeOpacity={0.85}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`${title}, ${count} sélections, cote ${totalOdds.toFixed(2)}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: TicketBuilderHeaderVariant,
  size: TicketBuilderHeaderSize,
  glassBorder: boolean
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];

    const isGlass = variant === 'glass';
    const isMinimal = variant === 'minimal';

    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isMinimal ? colors.surface : 'transparent',
        paddingHorizontal: config.paddingH,
        paddingVertical: config.paddingV,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        borderWidth: isMinimal ? 1 : 0,
        borderColor: colors.border,
        ...(variant === 'default' || variant === 'gradient'
          ? effectShadows.glowPrimarySubtle
          : {}),
      },
      containerGlass: {
        ...effectGlass.card,
        borderColor: glassBorder
          ? effectGlass.primary.borderColor
          : effectGlass.card.borderColor,
        borderWidth: 1,
        borderBottomWidth: 0,
      },
      left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: config.gap,
      },
      iconWrapper: {
        width: config.iconWrapperSize,
        height: config.iconWrapperSize,
        borderRadius: radius.md,
        backgroundColor: colors.textOnPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        ...effectShadows.cardSubtle,
      },
      title: {
        fontSize: config.titleSize,
        fontWeight: '800',
        color: isMinimal ? colors.text : colors.textOnPrimary,
        letterSpacing: -0.3,
      },
      badge: {
        marginLeft: spacing.xxs,
      },
      badgeGradient: {
        borderRadius: radius.full,
        minWidth: config.badgeSize,
        height: config.badgeSize,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xs,
        ...effectShadows.glowAccentSubtle,
      },
      badgeText: {
        fontSize: config.badgeTextSize,
        fontWeight: '800',
        color: colors.textOnPrimary,
        fontVariant: ['tabular-nums'],
      },
      right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: config.gap,
      },
      oddsContainer: {
        alignItems: 'flex-end',
        marginRight: spacing.xs,
      },
      oddsLabel: {
        fontSize: config.oddsLabelSize,
        color: isMinimal
          ? colors.textSecondary
          : `${colors.textOnPrimary}99`,
        fontWeight: '500',
      },
      oddsValue: {
        fontSize: config.oddsValueSize,
        fontWeight: '900',
        color: isMinimal ? colors.accent : colors.textOnPrimary,
        fontVariant: ['tabular-nums'],
      },
      potentialWinContainer: {
        alignItems: 'flex-end',
        paddingLeft: config.gap,
        borderLeftWidth: 1,
        borderLeftColor: `${colors.textOnPrimary}30`,
      },
      potentialWinLabel: {
        fontSize: config.oddsLabelSize,
        color: isMinimal
          ? colors.textSecondary
          : `${colors.textOnPrimary}99`,
        fontWeight: '500',
      },
      potentialWinValue: {
        fontSize: config.oddsValueSize,
        fontWeight: '900',
        color: isMinimal ? colors.success : '#4ADE80',
        fontVariant: ['tabular-nums'],
      },
      chevronWrapper: {
        width: config.chevronSize,
        height: config.chevronSize,
        borderRadius: radius.full,
        backgroundColor: isMinimal
          ? colors.surface
          : `${colors.textOnPrimary}20`,
        borderWidth: isMinimal ? 1 : 0,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      },
    });
  }, [colors, variant, size, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * TicketBuilderHeader par défaut avec gradient
 */
export const DefaultTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="default" />;

/**
 * TicketBuilderHeader avec gradient accentué
 */
export const GradientTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="gradient" />;

/**
 * TicketBuilderHeader avec effet glassmorphism
 */
export const GlassTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="glass" glassBorder />;

/**
 * TicketBuilderHeader minimal
 */
export const MinimalTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="minimal" />;

/**
 * TicketBuilderHeader compact
 */
export const CompactTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="gradient" size="sm" />;

/**
 * TicketBuilderHeader large avec gain potentiel
 */
export const DetailedTicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = (
  props
) => <TicketBuilderHeader {...props} variant="gradient" size="lg" showPotentialWin />;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(TicketBuilderHeader);

/**
 * FilterPanel — Panneau de filtres pour le Marketplace
 *
 * Modal permettant de filtrer les tickets par sport, type,
 * cote, confiance et nombre de matchs.
 *
 * @example
 * // Utilisation basique
 * <FilterPanel
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   filters={filters}
 *   onApply={handleApplyFilters}
 *   meta={filterMeta}
 * />
 *
 * @example
 * // Variante glass
 * <FilterPanel
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   filters={filters}
 *   onApply={handleApplyFilters}
 *   meta={filterMeta}
 *   variant="glass"
 * />
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { MarketplaceFilters } from '../../api/marketplace.api';
import type { TicketFilterMetaDto } from '../../types';
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
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Définition d'une plage de valeurs */
interface Range {
  label: string;
  min?: number;
  max?: number;
}

/** Variantes visuelles disponibles */
export type FilterPanelVariant = 'default' | 'glass' | 'minimal';

/** Props du composant FilterPanel */
export interface FilterPanelProps {
  /** Visibilité du modal */
  visible: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Filtres actuels */
  filters: MarketplaceFilters;
  /** Callback application des filtres */
  onApply: (filters: MarketplaceFilters) => void;
  /** Métadonnées des filtres disponibles */
  meta: TicketFilterMetaDto | null;
  /** Variante visuelle */
  variant?: FilterPanelVariant;
  /** Active les animations */
  animated?: boolean;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const ODDS_RANGES: Range[] = [
  { label: '< 2', max: 2 },
  { label: '2 – 5', min: 2, max: 5 },
  { label: '5 – 10', min: 5, max: 10 },
  { label: '10+', min: 10 },
];

const SELECTIONS_RANGES: Range[] = [
  { label: '1', min: 1, max: 1 },
  { label: '2 – 3', min: 2, max: 3 },
  { label: '4 – 5', min: 4, max: 5 },
  { label: '6+', min: 6 },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function rangeMatches(
  range: Range,
  currentMin?: number,
  currentMax?: number
): boolean {
  return currentMin === range.min && currentMax === range.max;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Props du Chip animé */
interface AnimatedChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
  variant: FilterPanelVariant;
  accentColor?: boolean;
  colors: ThemeColors;
  animated?: boolean;
}

/** Chip animé pour les filtres */
const AnimatedChip: React.FC<AnimatedChipProps> = React.memo(
  ({
    label,
    icon,
    isSelected,
    onPress,
    variant,
    accentColor = false,
    colors,
    animated = true,
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      if (animated) {
        Animated.spring(scaleAnim, {
          toValue: 0.95,
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

    const chipStyle = useMemo(() => {
      const baseStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
      };

      if (isSelected) {
        return {
          ...baseStyle,
          backgroundColor: accentColor ? colors.accent : colors.primary,
          borderColor: accentColor ? colors.accent : colors.primary,
          ...effectShadows.glowPrimarySubtle,
        };
      }

      return {
        ...baseStyle,
        backgroundColor:
          variant === 'glass'
            ? effectGlass.card.backgroundColor
            : colors.background,
        borderColor:
          variant === 'glass' ? effectGlass.card.borderColor : colors.border,
      };
    }, [isSelected, accentColor, variant, colors]);

    const textStyle = useMemo(
      () => ({
        fontSize: 13,
        fontWeight: '600' as const,
        color: isSelected ? colors.textOnPrimary : colors.textSecondary,
      }),
      [isSelected, colors]
    );

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={chipStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={`Filtre ${label}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={16}
              color={isSelected ? colors.textOnPrimary : colors.textSecondary}
            />
          )}
          <Text style={textStyle}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

AnimatedChip.displayName = 'AnimatedChip';

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  meta,
  variant = 'default',
  animated = true,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant);

  // ── State ──────────────────────────────────────────────────────
  const [draft, setDraft] = useState<MarketplaceFilters>(filters);

  // ── Animations ─────────────────────────────────────────────────
  const applyScaleAnim = useRef(new Animated.Value(1)).current;
  const resetScaleAnim = useRef(new Animated.Value(1)).current;
  const closeScaleAnim = useRef(new Animated.Value(1)).current;

  // Reset draft when modal opens
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const availableSports = meta?.availableSports ?? [];

  // ── Handlers ───────────────────────────────────────────────────
  const toggleSport = useCallback((sport: string) => {
    setDraft((prev) => {
      const current = prev.sports ?? [];
      const next = current.includes(sport)
        ? current.filter((s) => s !== sport)
        : [...current, sport];
      return { ...prev, sports: next.length > 0 ? next : undefined };
    });
  }, []);

  const toggleOddsRange = useCallback((range: Range) => {
    setDraft((prev) => {
      if (rangeMatches(range, prev.minOdds, prev.maxOdds)) {
        return { ...prev, minOdds: undefined, maxOdds: undefined };
      }
      return { ...prev, minOdds: range.min, maxOdds: range.max };
    });
  }, []);

  const toggleSelectionsRange = useCallback((range: Range) => {
    setDraft((prev) => {
      if (rangeMatches(range, prev.minSelections, prev.maxSelections)) {
        return { ...prev, minSelections: undefined, maxSelections: undefined };
      }
      return { ...prev, minSelections: range.min, maxSelections: range.max };
    });
  }, []);

  const toggleTicketType = useCallback((type: 'public' | 'private') => {
    setDraft((prev) => ({
      ...prev,
      ticketType: prev.ticketType === type ? undefined : type,
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  const handleReset = useCallback(() => {
    setDraft({});
  }, []);

  // ── Press animations ───────────────────────────────────────────
  const handleApplyPressIn = useCallback(() => {
    if (animated) {
      Animated.spring(applyScaleAnim, {
        toValue: 0.96,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, applyScaleAnim]);

  const handleApplyPressOut = useCallback(() => {
    if (animated) {
      Animated.spring(applyScaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, applyScaleAnim]);

  const handleResetPressIn = useCallback(() => {
    if (animated) {
      Animated.spring(resetScaleAnim, {
        toValue: 0.95,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, resetScaleAnim]);

  const handleResetPressOut = useCallback(() => {
    if (animated) {
      Animated.spring(resetScaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, resetScaleAnim]);

  const handleClosePressIn = useCallback(() => {
    if (animated) {
      Animated.spring(closeScaleAnim, {
        toValue: 0.9,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, closeScaleAnim]);

  const handleClosePressOut = useCallback(() => {
    if (animated) {
      Animated.spring(closeScaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, closeScaleAnim]);

  // ── Computed values ────────────────────────────────────────────
  const activeFilterCount = useMemo(
    () =>
      [
        draft.sports?.length ?? 0,
        draft.ticketType ? 1 : 0,
        draft.minOdds !== undefined || draft.maxOdds !== undefined ? 1 : 0,
        draft.minSelections !== undefined || draft.maxSelections !== undefined
          ? 1
          : 0,
      ].reduce((a, b) => a + b, 0),
    [draft]
  );

  // ── Render section ─────────────────────────────────────────────
  const renderSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    children: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: closeScaleAnim }] }}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              onPressIn={handleClosePressIn}
              onPressOut={handleClosePressOut}
              activeOpacity={0.9}
              accessibilityLabel="Fermer les filtres"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Filtres</Text>
            {activeFilterCount > 0 && (
              <LinearGradient
                colors={effectGradients.primary.colors}
                start={effectGradients.primary.start}
                end={effectGradients.primary.end}
                style={styles.filterCountBadge}
              >
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </LinearGradient>
            )}
          </View>

          <Animated.View style={{ transform: [{ scale: resetScaleAnim }] }}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              onPressIn={handleResetPressIn}
              onPressOut={handleResetPressOut}
              activeOpacity={0.8}
              accessibilityLabel="Réinitialiser les filtres"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={16} color={colors.danger} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Sports multi-select */}
          {availableSports.length > 0 &&
            renderSection(
              'Sports',
              'football',
              availableSports.map((sport) => (
                <AnimatedChip
                  key={sport}
                  label={SPORT_LABELS[sport] ?? sport}
                  icon={SPORT_ICONS[sport] ?? 'help-circle'}
                  isSelected={draft.sports?.includes(sport) ?? false}
                  onPress={() => toggleSport(sport)}
                  variant={variant}
                  colors={colors}
                  animated={animated}
                />
              ))
            )}

          {/* Ticket type */}
          {renderSection(
            'Type de ticket',
            'pricetag',
            (['public', 'private'] as const).map((type) => (
              <AnimatedChip
                key={type}
                label={type === 'public' ? 'Public' : 'Privé'}
                icon={type === 'public' ? 'earth' : 'lock-closed'}
                isSelected={draft.ticketType === type}
                onPress={() => toggleTicketType(type)}
                variant={variant}
                accentColor={type === 'private'}
                colors={colors}
                animated={animated}
              />
            ))
          )}

          {/* Odds range */}
          {renderSection(
            'Cote moyenne',
            'trending-up',
            ODDS_RANGES.map((range) => (
              <AnimatedChip
                key={range.label}
                label={range.label}
                isSelected={rangeMatches(range, draft.minOdds, draft.maxOdds)}
                onPress={() => toggleOddsRange(range)}
                variant={variant}
                colors={colors}
                animated={animated}
              />
            ))
          )}

          {/* Match count range */}
          {renderSection(
            'Nombre de matchs',
            'list',
            SELECTIONS_RANGES.map((range) => (
              <AnimatedChip
                key={range.label}
                label={range.label}
                isSelected={rangeMatches(
                  range,
                  draft.minSelections,
                  draft.maxSelections
                )}
                onPress={() => toggleSelectionsRange(range)}
                variant={variant}
                colors={colors}
                animated={animated}
              />
            ))
          )}
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <Animated.View
            style={[
              styles.applyBtnWrapper,
              { transform: [{ scale: applyScaleAnim }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleApply}
              onPressIn={handleApplyPressIn}
              onPressOut={handleApplyPressOut}
              accessibilityLabel="Appliquer les filtres"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={effectGradients.primary.colors}
                start={effectGradients.primary.start}
                end={effectGradients.primary.end}
                style={styles.applyBtn}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.textOnPrimary}
                />
                <Text style={styles.applyBtnText}>
                  Appliquer{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (colors: ThemeColors, variant: FilterPanelVariant) =>
  useMemo(() => {
    const isGlass = variant === 'glass';

    return StyleSheet.create({
      modal: {
        flex: 1,
        backgroundColor: isGlass
          ? 'rgba(10, 10, 10, 0.95)'
          : colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        backgroundColor: isGlass ? 'transparent' : colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
      },
      closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isGlass
          ? effectGlass.card.backgroundColor
          : colors.background,
        borderWidth: 1,
        borderColor: isGlass ? effectGlass.card.borderColor : colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
      },
      filterCountBadge: {
        borderRadius: radius.full,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xs,
      },
      filterCountText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textOnPrimary,
      },
      resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: colors.danger + '15',
      },
      resetText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.danger,
      },
      content: {
        padding: spacing.base,
        paddingBottom: spacing.xl,
      },
      section: {
        backgroundColor: isGlass
          ? effectGlass.card.backgroundColor
          : colors.surface,
        borderRadius: radius.xl,
        padding: spacing.base,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: isGlass ? effectGlass.card.borderColor : colors.border,
      },
      sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
      },
      sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.2,
      },
      chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
      },
      footer: {
        padding: spacing.base,
        backgroundColor: isGlass ? 'transparent' : colors.surface,
        borderTopWidth: 1,
        borderTopColor: isGlass ? effectGlass.light.borderColor : colors.border,
      },
      applyBtnWrapper: {
        borderRadius: radius.lg,
        overflow: 'hidden',
      },
      applyBtn: {
        paddingVertical: spacing.md + 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: radius.lg,
        ...effectShadows.glowPrimarySubtle,
      },
      applyBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textOnPrimary,
        letterSpacing: 0.3,
      },
    });
  }, [colors, variant]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * FilterPanel par défaut
 */
export const DefaultFilterPanel: React.FC<FilterPanelProps> = (props) => (
  <FilterPanel {...props} variant="default" />
);

/**
 * FilterPanel avec effet glassmorphism
 */
export const GlassFilterPanel: React.FC<FilterPanelProps> = (props) => (
  <FilterPanel {...props} variant="glass" />
);

/**
 * FilterPanel minimal
 */
export const MinimalFilterPanel: React.FC<FilterPanelProps> = (props) => (
  <FilterPanel {...props} variant="minimal" />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(FilterPanel);

/**
 * TicketBuilderFooter — Pied de page du constructeur de ticket
 *
 * Affiche le récapitulatif du ticket (sélections, cote, confiance, visibilité)
 * et les boutons d'action (créer, vider).
 *
 * @example
 * // Utilisation basique
 * <TicketBuilderFooter
 *   totalOdds={4.25}
 *   count={3}
 *   confidenceIndex={7}
 *   visibility="PUBLIC"
 *   priceEur={null}
 *   onClear={handleClear}
 *   onSubmit={handleSubmit}
 * />
 *
 * @example
 * // Variante glass
 * <GlassTicketBuilderFooter
 *   totalOdds={4.25}
 *   count={3}
 *   confidenceIndex={7}
 *   visibility="PRIVATE"
 *   priceEur={50}
 *   onClear={handleClear}
 *   onSubmit={handleSubmit}
 * />
 */

import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
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
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type TicketBuilderFooterVariant = 'default' | 'glass' | 'card' | 'minimal';

/** Tailles disponibles */
export type TicketBuilderFooterSize = 'sm' | 'md' | 'lg';

/** Props du composant TicketBuilderFooter */
export interface TicketBuilderFooterProps {
  /** Cote totale */
  totalOdds: number;
  /** Nombre de sélections */
  count: number;
  /** Indice de confiance (1-10) */
  confidenceIndex: number | null;
  /** Visibilité du ticket */
  visibility: TicketVisibility;
  /** Prix en euros (pour tickets privés) */
  priceEur: number | null;
  /** Callback vider le coupon */
  onClear: () => void;
  /** Callback créer le ticket */
  onSubmit: () => void;
  /** Variante visuelle */
  variant?: TicketBuilderFooterVariant;
  /** Taille du composant */
  size?: TicketBuilderFooterSize;
  /** État de chargement */
  loading?: boolean;
  /** Active les animations */
  animated?: boolean;
  /** Affiche la bordure glass */
  glassBorder?: boolean;
  /** Texte personnalisé du bouton submit */
  submitLabel?: string;
  /** Masque le disclaimer */
  hideDisclaimer?: boolean;
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
    sectionPadding: spacing.sm,
    labelSize: 12,
    valueSize: 12,
    totalSize: 18,
    badgeSize: 10,
    buttonPadding: spacing.md,
    buttonTextSize: 14,
    iconSize: 18,
    gap: spacing.xs,
  },
  md: {
    paddingH: spacing.base,
    paddingV: spacing.md,
    sectionPadding: spacing.md,
    labelSize: 13,
    valueSize: 14,
    totalSize: 22,
    badgeSize: 11,
    buttonPadding: spacing.md + 2,
    buttonTextSize: 15,
    iconSize: 22,
    gap: spacing.sm,
  },
  lg: {
    paddingH: spacing.lg,
    paddingV: spacing.base,
    sectionPadding: spacing.lg,
    labelSize: 14,
    valueSize: 16,
    totalSize: 26,
    badgeSize: 12,
    buttonPadding: spacing.lg,
    buttonTextSize: 16,
    iconSize: 24,
    gap: spacing.md,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Valide si le ticket peut être créé */
function isValid(
  count: number,
  confidenceIndex: number | null,
  visibility: TicketVisibility,
  priceEur: number | null
): boolean {
  if (count === 0) return false;
  if (confidenceIndex == null || confidenceIndex < 1 || confidenceIndex > 10)
    return false;
  if (visibility === 'PRIVATE' && (priceEur == null || priceEur < 1))
    return false;
  return true;
}

/** Récupère la couleur de confiance */
const getConfidenceColor = (value: number | null, colors: ThemeColors): string => {
  if (value === null) return colors.textTertiary;
  if (value <= 3) return colors.danger;
  if (value <= 6) return colors.accent;
  return colors.primary;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const TicketBuilderFooter: React.FC<TicketBuilderFooterProps> = ({
  totalOdds,
  count,
  confidenceIndex,
  visibility,
  priceEur,
  onClear,
  onSubmit,
  variant = 'default',
  size = 'md',
  loading = false,
  animated = true,
  glassBorder = false,
  submitLabel = 'Créer le ticket',
  hideDisclaimer = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size, glassBorder);
  const config = SIZE_CONFIG[size];

  const valid = isValid(count, confidenceIndex, visibility, priceEur);
  const confidenceColor = getConfidenceColor(confidenceIndex, colors);
  const isDisabled = !valid || loading;

  // ── Animations ─────────────────────────────────────────────────
  const submitScaleAnim = useRef(new Animated.Value(1)).current;
  const clearScaleAnim = useRef(new Animated.Value(1)).current;

  // ── Handlers ───────────────────────────────────────────────────
  const handleSubmitPressIn = useCallback(() => {
    if (!isDisabled) {
      // Success haptic for ticket creation
      haptics.success();
    }
    if (animated && !isDisabled) {
      Animated.spring(submitScaleAnim, {
        toValue: 0.96,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, isDisabled, submitScaleAnim]);

  const handleSubmitPressOut = useCallback(() => {
    if (animated) {
      Animated.spring(submitScaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, submitScaleAnim]);

  const handleClearPressIn = useCallback(() => {
    // Warning haptic for clearing ticket
    haptics.warning();
    if (animated) {
      Animated.spring(clearScaleAnim, {
        toValue: 0.95,
        ...springConfigs.button,
      }).start();
    }
  }, [animated, clearScaleAnim]);

  const handleClearPressOut = useCallback(() => {
    if (animated) {
      Animated.spring(clearScaleAnim, {
        toValue: 1,
        ...springConfigs.default,
      }).start();
    }
  }, [animated, clearScaleAnim]);

  // ── Rendu de la ligne de résumé ────────────────────────────────
  const renderSummaryRow = (
    label: string,
    content: React.ReactNode,
    isHighlight = false
  ) => (
    <View style={[styles.summaryRow, isHighlight && styles.summaryRowHighlight]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      {content}
    </View>
  );

  // ── Rendu de la section résumé ─────────────────────────────────
  const renderSummary = () => {
    const summaryContent = (
      <>
        {/* Cote totale - mise en avant */}
        <View style={styles.totalSection}>
          <View style={styles.totalLabelRow}>
            <Ionicons name="calculator" size={16} color={colors.primary} />
            <Text style={styles.totalLabel}>Cote totale</Text>
          </View>
          <Text style={styles.totalValue}>{totalOdds.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Détails */}
        <View style={styles.detailsGrid}>
          {/* Sélections */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sélections</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{count}</Text>
            </View>
          </View>

          {/* Confiance */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Confiance</Text>
            <View
              style={[
                styles.confidenceBadge,
                { backgroundColor: confidenceColor + '20' },
              ]}
            >
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidenceIndex != null ? `${confidenceIndex}/10` : '–'}
              </Text>
            </View>
          </View>

          {/* Visibilité */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Visibilité</Text>
            <View
              style={[
                styles.visibilityBadge,
                visibility === 'PUBLIC'
                  ? styles.visibilityPublic
                  : styles.visibilityPrivate,
              ]}
            >
              <Ionicons
                name={visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
                size={12}
                color={visibility === 'PUBLIC' ? colors.primary : colors.accent}
              />
              <Text
                style={[
                  styles.visibilityText,
                  { color: visibility === 'PUBLIC' ? colors.primary : colors.accent },
                ]}
              >
                {visibility === 'PUBLIC' ? 'Public' : 'Privé'}
              </Text>
            </View>
          </View>

          {/* Prix (si privé) */}
          {visibility === 'PRIVATE' && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Prix</Text>
              <View style={styles.priceBadge}>
                <Text style={styles.priceValue}>
                  {priceEur != null ? `${priceEur}€` : '–'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </>
    );

    if (variant === 'glass') {
      return (
        <LinearGradient
          colors={effectGradients.cardGlass.colors}
          start={effectGradients.cardGlass.start}
          end={effectGradients.cardGlass.end}
          style={styles.summarySection}
        >
          {summaryContent}
        </LinearGradient>
      );
    }

    return <View style={styles.summarySection}>{summaryContent}</View>;
  };

  // ── Rendu du bouton submit ─────────────────────────────────────
  const renderSubmitButton = () => {
    const buttonContent = (
      <>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Ionicons
            name="checkmark-circle"
            size={config.iconSize}
            color={colors.textOnPrimary}
          />
        )}
        <Text style={styles.submitText}>
          {loading ? 'Création...' : submitLabel}
        </Text>
      </>
    );

    return (
      <Animated.View
        style={[
          styles.submitBtnWrapper,
          { transform: [{ scale: submitScaleAnim }] },
        ]}
      >
        <TouchableOpacity
          testID="create-ticket-button"
          activeOpacity={0.95}
          onPress={onSubmit}
          onPressIn={handleSubmitPressIn}
          onPressOut={handleSubmitPressOut}
          disabled={isDisabled}
          accessibilityLabel={submitLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled }}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [colors.textTertiary, colors.textTertiary]
                : effectGradients.primary.colors
            }
            start={effectGradients.primary.start}
            end={effectGradients.primary.end}
            style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── Rendu du bouton clear ──────────────────────────────────────
  const renderClearButton = () => (
    <Animated.View style={{ transform: [{ scale: clearScaleAnim }] }}>
      <TouchableOpacity
        testID="clear-ticket-button"
        style={styles.clearBtn}
        onPress={onClear}
        onPressIn={handleClearPressIn}
        onPressOut={handleClearPressOut}
        activeOpacity={0.7}
        accessibilityLabel="Vider le coupon"
        accessibilityRole="button"
      >
        <View style={styles.clearBtnContent}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.clearText}>Vider le coupon</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // ── Rendu principal ────────────────────────────────────────────
  return (
    <View style={[styles.container, style]}>
      {/* Résumé */}
      {renderSummary()}

      {/* Disclaimer */}
      {!hideDisclaimer && (
        <View style={styles.disclaimerContainer}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.textTertiary}
          />
          <Text style={styles.disclaimer}>
            En créant ce ticket, vous partagez un pronostic. Aucun résultat n'est
            garanti.
          </Text>
        </View>
      )}

      {/* Actions */}
      {renderSubmitButton()}
      {renderClearButton()}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: TicketBuilderFooterVariant,
  size: TicketBuilderFooterSize,
  glassBorder: boolean
) =>
  useMemo(() => {
    const config = SIZE_CONFIG[size];

    const isGlass = variant === 'glass';

    return StyleSheet.create({
      container: {
        paddingHorizontal: config.paddingH,
        paddingTop: config.paddingV,
        paddingBottom: config.gap,
        borderTopWidth: variant === 'minimal' ? 0 : 1,
        borderTopColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
      },
      summarySection: {
        backgroundColor: isGlass ? 'transparent' : colors.surface,
        borderRadius: radius.xl,
        padding: config.sectionPadding,
        marginBottom: config.gap,
        borderWidth: 1,
        borderColor: isGlass
          ? glassBorder
            ? effectGlass.primary.borderColor
            : effectGlass.card.borderColor
          : colors.border,
        ...(variant === 'card' && effectShadows.card),
      },
      totalSection: {
        alignItems: 'center',
        paddingBottom: config.gap,
      },
      totalLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xxs,
      },
      totalLabel: {
        fontSize: config.labelSize,
        color: colors.textSecondary,
        fontWeight: '500',
      },
      totalValue: {
        fontSize: config.totalSize,
        fontWeight: '900',
        color: colors.primary,
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
      },
      divider: {
        height: 1,
        backgroundColor: isGlass
          ? effectGlass.light.borderColor
          : colors.border,
        marginBottom: config.gap,
      },
      detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: config.gap,
      },
      detailItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        gap: spacing.xxs,
      },
      detailLabel: {
        fontSize: config.labelSize - 1,
        color: colors.textTertiary,
        fontWeight: '500',
      },
      detailValueContainer: {
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.sm,
      },
      detailValue: {
        fontSize: config.valueSize,
        fontWeight: '700',
        color: colors.text,
        fontVariant: ['tabular-nums'],
      },
      summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
      },
      summaryRowHighlight: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: config.gap,
        marginBottom: spacing.xs,
      },
      summaryLabel: {
        fontSize: config.labelSize,
        color: colors.textSecondary,
        fontWeight: '500',
      },
      confidenceBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
      },
      confidenceText: {
        fontSize: config.badgeSize,
        fontWeight: '700',
      },
      visibilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
      },
      visibilityPublic: {
        backgroundColor: colors.primary + '20',
      },
      visibilityPrivate: {
        backgroundColor: colors.accent + '20',
      },
      visibilityText: {
        fontSize: config.badgeSize,
        fontWeight: '600',
      },
      priceBadge: {
        backgroundColor: colors.accent + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.full,
      },
      priceValue: {
        fontSize: config.valueSize,
        fontWeight: '800',
        color: colors.accent,
        fontVariant: ['tabular-nums'],
      },
      disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.xs,
        marginBottom: config.gap,
        paddingHorizontal: spacing.xs,
      },
      disclaimer: {
        flex: 1,
        fontSize: 11,
        color: colors.textTertiary,
        lineHeight: 16,
      },
      submitBtnWrapper: {
        marginBottom: config.gap,
      },
      submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: config.gap,
        paddingVertical: config.buttonPadding,
        borderRadius: radius.lg,
        ...effectShadows.glowPrimarySubtle,
      },
      submitBtnDisabled: {
        ...effectShadows.none,
        opacity: 0.6,
      },
      submitText: {
        fontSize: config.buttonTextSize,
        fontWeight: '700',
        color: colors.textOnPrimary,
        letterSpacing: 0.3,
      },
      clearBtn: {
        alignItems: 'center',
        padding: config.gap,
      },
      clearBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      },
      clearText: {
        fontSize: config.labelSize,
        fontWeight: '600',
        color: colors.danger,
      },
    });
  }, [colors, variant, size, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * TicketBuilderFooter par défaut
 */
export const DefaultTicketBuilderFooter: React.FC<TicketBuilderFooterProps> = (
  props
) => <TicketBuilderFooter {...props} variant="default" />;

/**
 * TicketBuilderFooter avec effet glassmorphism
 */
export const GlassTicketBuilderFooter: React.FC<TicketBuilderFooterProps> = (
  props
) => <TicketBuilderFooter {...props} variant="glass" glassBorder />;

/**
 * TicketBuilderFooter en carte
 */
export const CardTicketBuilderFooter: React.FC<TicketBuilderFooterProps> = (
  props
) => <TicketBuilderFooter {...props} variant="card" />;

/**
 * TicketBuilderFooter minimal
 */
export const MinimalTicketBuilderFooter: React.FC<TicketBuilderFooterProps> = (
  props
) => <TicketBuilderFooter {...props} variant="minimal" />;

/**
 * TicketBuilderFooter compact
 */
export const CompactTicketBuilderFooter: React.FC<TicketBuilderFooterProps> = (
  props
) => <TicketBuilderFooter {...props} variant="default" size="sm" hideDisclaimer />;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(TicketBuilderFooter);

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ticketApi } from '../api/ticket.api';
import { stripeApi } from '../api/stripe.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import type { RootStackParamList, TicketSelection, ConnectedAccountStatusDto } from '../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectShadows,
  effectGradients,
  springConfigs,
} from '../theme';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
  HOCKEY: 'snow',
  RUGBY: 'american-football',
  BASEBALL: 'baseball',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Section header - Style harmonisé avec MatchesScreen
 */
const SectionHeader: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count?: number;
  colors: ThemeColors;
}> = React.memo(({ icon, title, count, colors }) => (
  <View style={[sectionStyles.container, { backgroundColor: colors.surfaceSecondary }]}>
    <Ionicons name={icon} size={16} color={colors.primary} />
    <Text style={[sectionStyles.title, { color: colors.text }]}>{title}</Text>
    {count !== undefined && (
      <View style={[sectionStyles.countBadge, { backgroundColor: colors.primaryBg }]}>
        <Text style={[sectionStyles.countText, { color: colors.primary }]}>{count}</Text>
      </View>
    )}
  </View>
));

SectionHeader.displayName = 'SectionHeader';

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  countBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

/**
 * Carte de sélection propre et structurée (4 lignes)
 */
const SelectionCard: React.FC<{
  item: TicketSelection;
  index: number;
  colors: ThemeColors;
}> = React.memo(({ item, index, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            selCardStyles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header: Badge numéro + Badge sport */}
          <View style={selCardStyles.headerRow}>
            <View style={[selCardStyles.numberBadge, { backgroundColor: colors.primary }]}>
              <Text style={selCardStyles.numberText}>{index + 1}</Text>
            </View>
            <View style={[selCardStyles.sportBadge, { backgroundColor: colors.primaryBg }]}>
              <Ionicons
                name={SPORT_ICONS[item.sportCode] || 'trophy'}
                size={14}
                color={colors.primary}
              />
              <Text style={[selCardStyles.sportText, { color: colors.primary }]}>
                {item.sportCode}
              </Text>
            </View>
          </View>

          {/* Ligne 1: Compétition + Date/Heure (côte à côte) */}
          <View style={[selCardStyles.compactRowBg, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={selCardStyles.compactItem}>
              <Ionicons name="trophy-outline" size={14} color={colors.textSecondary} />
              <Text style={[selCardStyles.compactValue, { color: colors.text }]} numberOfLines={1}>
                {item.leagueName}
              </Text>
            </View>
            <View style={[selCardStyles.verticalDivider, { backgroundColor: colors.border }]} />
            <View style={selCardStyles.compactItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[selCardStyles.compactValue, { color: colors.text }]} numberOfLines={1}>
                {formatShortDateTime(item.startTime)}
              </Text>
            </View>
          </View>

          {/* Ligne 2: Match */}
          <View style={selCardStyles.infoRow}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={[selCardStyles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {item.matchLabel}
            </Text>
          </View>

          {/* Ligne 3: Marché + Sélection */}
          <View style={selCardStyles.infoRow}>
            <Ionicons name="trending-up" size={16} color={colors.textSecondary} />
            <Text style={[selCardStyles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {item.marketLabel} — <Text style={{ fontWeight: '700' }}>{item.selectionLabel}</Text>
            </Text>
          </View>

          {/* Ligne 4: Cote (mise en avant) */}
          <View style={[selCardStyles.oddsRow, { backgroundColor: colors.accentBg }]}>
            <Ionicons name="stats-chart-outline" size={18} color={colors.accent} />
            <Text style={[selCardStyles.oddsLabel, { color: colors.textSecondary }]}>Cote</Text>
            <View style={{ flex: 1 }} />
            <Text style={[selCardStyles.oddsValue, { color: colors.accent }]}>
              {item.odds.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

SelectionCard.displayName = 'SelectionCard';

const selCardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...effectShadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  sportText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Ligne compacte avec fond (2 infos côte à côte)
  compactRowBg: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  compactValue: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  verticalDivider: {
    width: 1,
    height: 16,
    marginHorizontal: spacing.sm,
  },
  // Ligne info standard
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Ligne cote (mise en avant)
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  oddsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  oddsValue: {
    fontSize: 22,
    fontWeight: '900',
  },
});

/**
 * Card récapitulative sur une seule ligne
 */
const SummaryCard: React.FC<{
  count: number;
  totalOdds: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  priceEur?: number | null;
  colors: ThemeColors;
}> = React.memo(({ count, totalOdds, visibility, priceEur, colors }) => (
  <View style={[summaryCardStyles.container, { backgroundColor: colors.surfaceSecondary }]}>
    <View style={summaryCardStyles.row}>
      {/* Sélections */}
      <View style={summaryCardStyles.item}>
        <Ionicons name="list-outline" size={14} color={colors.textSecondary} />
        <Text style={[summaryCardStyles.label, { color: colors.textSecondary }]}>Sélections</Text>
        <Text style={[summaryCardStyles.value, { color: colors.text }]}>{count}</Text>
      </View>

      <View style={[summaryCardStyles.divider, { backgroundColor: colors.border }]} />

      {/* Cote totale */}
      <View style={summaryCardStyles.item}>
        <Ionicons name="stats-chart-outline" size={14} color={colors.accent} />
        <Text style={[summaryCardStyles.label, { color: colors.textSecondary }]}>Cote</Text>
        <Text style={[summaryCardStyles.valueHighlight, { color: colors.accent }]}>
          {totalOdds.toFixed(2)}
        </Text>
      </View>

      <View style={[summaryCardStyles.divider, { backgroundColor: colors.border }]} />

      {/* Visibilité */}
      <View style={summaryCardStyles.item}>
        <Ionicons
          name={visibility === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
          size={14}
          color={colors.primary}
        />
        <Text style={[summaryCardStyles.valueSuccess, { color: colors.primary }]}>
          {visibility === 'PUBLIC' ? 'Public' : 'Privé'}
        </Text>
      </View>

      {/* Prix si privé */}
      {visibility === 'PRIVATE' && priceEur != null && (
        <>
          <View style={[summaryCardStyles.divider, { backgroundColor: colors.border }]} />
          <View style={summaryCardStyles.item}>
            <Ionicons name="pricetag-outline" size={14} color={colors.accent} />
            <Text style={[summaryCardStyles.valueHighlight, { color: colors.accent }]}>
              {priceEur}€
            </Text>
          </View>
        </>
      )}
    </View>
  </View>
));

SummaryCard.displayName = 'SummaryCard';

const summaryCardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: '900',
  },
  valueSuccess: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
  },
});

/**
 * Carte d'avertissement
 */
const WarningCard: React.FC<{
  title: string;
  items: string[];
  colors: ThemeColors;
}> = React.memo(({ title, items, colors }) => (
  <View
    style={[
      warningStyles.container,
      {
        backgroundColor: colors.accentBg,
        borderColor: `${colors.warning}40`,
      },
    ]}
  >
    <View style={[warningStyles.iconWrapper, { backgroundColor: `${colors.warning}20` }]}>
      <Ionicons name="warning" size={20} color={colors.warning} />
    </View>
    <View style={warningStyles.content}>
      <Text style={[typography.body, { color: colors.text, fontWeight: '700', marginBottom: spacing.xs }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View key={index} style={warningStyles.itemRow}>
          <View style={[warningStyles.bullet, { backgroundColor: colors.warning }]} />
          <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20 }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  </View>
));

WarningCard.displayName = 'WarningCard';

const warningStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    marginTop: 7,
  },
});

/**
 * Carte info Stripe
 */
const StripeInfoCard: React.FC<{
  onSetup: () => void;
  loading: boolean;
  colors: ThemeColors;
}> = React.memo(({ onSetup, loading, colors }) => (
  <View
    style={[
      stripeStyles.container,
      {
        backgroundColor: colors.primaryBg,
        borderColor: `${colors.primary}30`,
      },
    ]}
  >
    <View style={[stripeStyles.iconWrapper, { backgroundColor: `${colors.primary}20` }]}>
      <Ionicons name="information-circle" size={24} color={colors.primary} />
    </View>
    <View style={stripeStyles.content}>
      <Text style={[typography.body, { color: colors.primary, fontWeight: '700', marginBottom: spacing.xs }]}>
        Configuration Stripe recommandée
      </Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md }]}>
        Configurez Stripe pour pouvoir retirer vos gains.
      </Text>
      <TouchableOpacity
        style={[
          stripeStyles.btn,
          {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}10`,
          },
        ]}
        onPress={onSetup}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Ionicons name="card" size={18} color={colors.primary} />
            <Text style={[typography.button, { color: colors.primary }]}>
              Configurer maintenant
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
));

StripeInfoCard.displayName = 'StripeInfoCard';

const stripeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
});

/**
 * Checkbox CGU
 */
const TermsCheckbox: React.FC<{
  accepted: boolean;
  onToggle: () => void;
  onPressTerms: () => void;
  colors: ThemeColors;
}> = React.memo(({ accepted, onToggle, onPressTerms, colors }) => (
  <TouchableOpacity
    style={checkboxStyles.row}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View
      style={[
        checkboxStyles.box,
        { borderColor: accepted ? colors.primary : colors.border },
        accepted && { backgroundColor: colors.primary },
      ]}
    >
      {accepted && (
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
      )}
    </View>
    <Text style={[checkboxStyles.text, { color: colors.textSecondary }]}>
      J'accepte les{' '}
      <Text
        style={[checkboxStyles.link, { color: colors.primary }]}
        onPress={onPressTerms}
      >
        conditions générales
      </Text>
    </Text>
  </TouchableOpacity>
));

TermsCheckbox.displayName = 'TermsCheckbox';

const checkboxStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    flex: 1,
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

/**
 * Bouton d'action
 */
const ActionButton: React.FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  colors: ThemeColors;
}> = React.memo(({ label, icon, onPress, variant, loading, disabled, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isPrimary = variant === 'primary';

  if (isPrimary) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              disabled
                ? [colors.textTertiary, colors.textTertiary]
                : effectGradients.primary.colors
            }
            start={effectGradients.primary.start}
            end={effectGradients.primary.end}
            style={[
              actionBtnStyles.primary,
              !disabled && effectShadows.glowPrimarySubtle,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            )}
            <Text style={actionBtnStyles.primaryText}>
              {label}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          actionBtnStyles.secondary,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={[actionBtnStyles.secondaryText, { color: colors.primary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

ActionButton.displayName = 'ActionButton';

const actionBtnStyles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const TicketPreviewScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const route = useRoute();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { draft } = route.params as RootStackParamList['TicketPreview'];
  const clear = useTicketBuilderStore((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<ConnectedAccountStatusDto | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Check if this is a paid ticket
  const isPaidTicket = draft.visibility === 'PRIVATE' && (draft.priceEur ?? 0) > 0;
  const isStripeConfigured = stripeStatus?.status === 'Completed';

  // Load Stripe status on mount if ticket is paid
  useEffect(() => {
    if (isPaidTicket) {
      stripeApi.getStatus()
        .then(({ data }) => setStripeStatus(data))
        .catch(() => setStripeStatus(null));
    }
  }, [isPaidTicket]);

  const handleModify = () => {
    navigation.goBack();
  };

  const handleSetupStripe = async () => {
    setStripeLoading(true);
    try {
      const { data } = await stripeApi.startOnboarding();
      await Linking.openURL(data.url);
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer la configuration Stripe');
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePressTerms = () => {
    // Navigate to CGU screen or open URL
    Linking.openURL('https://sharetips.app/cgu');
  };

  const handleConfirm = async () => {
    if (!acceptedTerms) {
      Alert.alert('Conditions requises', 'Veuillez accepter les conditions générales pour continuer.');
      return;
    }

    setSubmitting(true);
    try {
      // Build title from match labels
      const title = draft.selections
        .map((s) => s.matchLabel)
        .join(' + ');

      const payload = {
        title,
        isPublic: draft.visibility === 'PUBLIC',
        priceEur:
          draft.visibility === 'PRIVATE' && draft.priceEur != null
            ? draft.priceEur
            : 0,
        selections: draft.selections.map((s) => ({
          matchId: s.matchId,
          sport: s.sportCode,
          marketType: s.marketType,
          selectionCode: s.selectionLabel,
          odds: s.odds,
          matchLabel: s.matchLabel,
          leagueName: s.leagueName,
        })),
      };

      await ticketApi.create(payload);

      // Clear betslip
      clear();

      // Navigate back to Matches tab
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                index: 2, // Matches tab index
                routes: [
                  { name: 'Home' },
                  { name: 'Marketplace' },
                  { name: 'Matches' },
                  { name: 'Profile' },
                ],
              },
            },
          ],
        })
      );
    } catch (err: unknown) {
      const message =
        err != null &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (err as { response: { data: { error: string } } }).response.data
              .error
          : 'Une erreur est survenue lors de la création du ticket';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Selections */}
        <SectionHeader
          icon="list-outline"
          title="SÉLECTIONS"
          count={draft.selections.length}
          colors={colors}
        />
        {draft.selections.map((sel, i) => (
          <SelectionCard
            key={sel.selectionId}
            item={sel}
            index={i}
            colors={colors}
          />
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <SectionHeader
            icon="document-text-outline"
            title="RÉCAPITULATIF"
            colors={colors}
          />
          <SummaryCard
            count={draft.selections.length}
            totalOdds={draft.totalOdds}
            visibility={draft.visibility}
            priceEur={draft.priceEur}
            colors={colors}
          />
        </View>

        {/* Warning */}
        <WarningCard
          title="Une fois le ticket créé :"
          items={[
            'Il ne pourra plus être modifié',
            "Il ne pourra plus être supprimé s'il est public",
            'Les cotes sont figées',
          ]}
          colors={colors}
        />

        {/* Stripe info for paid tickets - shown only if not configured */}
        {isPaidTicket && !isStripeConfigured && (
          <StripeInfoCard
            onSetup={handleSetupStripe}
            loading={stripeLoading}
            colors={colors}
          />
        )}
      </ScrollView>

      {/* Actions */}
      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {/* Checkbox CGU */}
        <TermsCheckbox
          accepted={acceptedTerms}
          onToggle={() => setAcceptedTerms(!acceptedTerms)}
          onPressTerms={handlePressTerms}
          colors={colors}
        />

        <ActionButton
          label="Modifier le ticket"
          icon="arrow-back"
          onPress={handleModify}
          variant="secondary"
          colors={colors}
        />
        <ActionButton
          label={submitting ? 'Création...' : 'Confirmer et créer'}
          icon="checkmark-circle"
          onPress={handleConfirm}
          variant="primary"
          loading={submitting}
          disabled={submitting || !acceptedTerms}
          colors={colors}
        />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scroll: {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        },
        summarySection: {
          marginTop: spacing.lg,
        },
        actions: {
          padding: spacing.md,
          borderTopWidth: 1,
          gap: spacing.sm,
          ...(Platform.OS === 'ios' ? effectShadows.card : {}),
          ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
        },
      }),
    [colors]
  );

export default TicketPreviewScreen;

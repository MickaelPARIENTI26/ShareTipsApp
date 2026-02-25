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
import { BlurView } from 'expo-blur';
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
  palette,
  effectGlass,
  effectShadows,
  createGlow,
  springConfigs,
} from '../theme';

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
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Section header avec gradient
 */
const SectionHeader: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: ThemeColors;
}> = React.memo(({ icon, title, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={sectionStyles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            sectionStyles.badge,
            Platform.select({
              ios: createGlow(colors.primary, 0.3),
              android: { elevation: 4 },
            }),
          ]}
        >
          <Ionicons name={icon} size={14} color="#FFFFFF" />
          <Text style={[typography.label, { color: '#FFFFFF' }]}>{title}</Text>
        </LinearGradient>
      </Animated.View>
      <LinearGradient
        colors={[colors.border, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={sectionStyles.line}
      />
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  line: {
    flex: 1,
    height: 1,
  },
});

/**
 * Carte de sélection avec design premium
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

  const cardContent = (
    <>
      {/* Header */}
      <View style={selCardStyles.header}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight || colors.primary]}
          style={[
            selCardStyles.indexBadge,
            Platform.select({
              ios: createGlow(colors.primary, 0.4),
              android: { elevation: 4 },
            }),
          ]}
        >
          <Text style={[typography.badge, { color: '#FFFFFF', fontWeight: '800' }]}>
            {index + 1}
          </Text>
        </LinearGradient>
        <View style={[selCardStyles.sportBadge, { backgroundColor: colors.primaryBg }]}>
          <Ionicons
            name={SPORT_ICONS[item.sportCode] || 'trophy'}
            size={12}
            color={colors.primary}
          />
          <Text style={[typography.badge, { color: colors.primary }]}>
            {SPORT_LABELS[item.sportCode] ?? item.sportCode}
          </Text>
        </View>
      </View>

      {/* Rows */}
      <View style={[selCardStyles.row, { borderBottomColor: colors.border }]}>
        <View style={selCardStyles.labelContainer}>
          <View style={[selCardStyles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="ribbon" size={12} color={colors.primary} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Compétition</Text>
        </View>
        <Text style={[typography.bodySmall, selCardStyles.value, { color: colors.text }]} numberOfLines={1}>
          {item.leagueName}
        </Text>
      </View>

      <View style={[selCardStyles.row, { borderBottomColor: colors.border }]}>
        <View style={selCardStyles.labelContainer}>
          <View style={[selCardStyles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="football" size={12} color={colors.primary} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Match</Text>
        </View>
        <Text style={[typography.bodySmall, selCardStyles.value, { color: colors.text }]} numberOfLines={1}>
          {item.matchLabel}
        </Text>
      </View>

      <View style={[selCardStyles.row, { borderBottomColor: colors.border }]}>
        <View style={selCardStyles.labelContainer}>
          <View style={[selCardStyles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="stats-chart" size={12} color={colors.primary} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Marché</Text>
        </View>
        <Text style={[typography.bodySmall, selCardStyles.value, { color: colors.text }]} numberOfLines={1}>
          {item.marketLabel} — {item.selectionLabel}
        </Text>
      </View>

      <View style={[selCardStyles.row, { borderBottomColor: colors.border }]}>
        <View style={selCardStyles.labelContainer}>
          <View style={[selCardStyles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="time" size={12} color={colors.primary} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Heure</Text>
        </View>
        <Text style={[typography.bodySmall, selCardStyles.value, { color: colors.text }]}>
          {formatDateTime(item.startTime)}
        </Text>
      </View>

      <View style={[selCardStyles.row, selCardStyles.rowLast]}>
        <View style={selCardStyles.labelContainer}>
          <View style={[selCardStyles.iconWrapper, { backgroundColor: `${colors.accent}20` }]}>
            <Ionicons name="trending-up" size={12} color={colors.accent} />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Cote</Text>
        </View>
        <LinearGradient
          colors={[`${colors.accent}20`, `${colors.accent}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={selCardStyles.oddsContainer}
        >
          <Text style={[typography.odds, { color: colors.accent }]}>
            {item.odds.toFixed(2)}
          </Text>
        </LinearGradient>
      </View>
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={effectGlass.light.intensity}
            tint="light"
            style={[
              selCardStyles.container,
              {
                backgroundColor: `${colors.surface}90`,
                borderColor: colors.border,
              },
            ]}
          >
            {cardContent}
          </BlurView>
        ) : (
          <View
            style={[
              selCardStyles.container,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                elevation: 3,
              },
            ]}
          >
            {cardContent}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

SelectionCard.displayName = 'SelectionCard';

const selCardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingTop: spacing.lg,
    paddingBottom: 0,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '50%',
  },
  oddsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
});

/**
 * Ligne de résumé avec design amélioré
 */
const SummaryRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  colors: ThemeColors;
}> = React.memo(({ label, value, highlight, icon, iconColor, colors }) => (
  <View style={[summaryRowStyles.container, { borderBottomColor: colors.border }]}>
    <Text style={[typography.body, { color: colors.textSecondary }]}>{label}</Text>
    <View style={summaryRowStyles.right}>
      {icon && (
        <View
          style={[
            summaryRowStyles.iconWrapper,
            { backgroundColor: `${iconColor || colors.primary}20` },
          ]}
        >
          <Ionicons name={icon} size={14} color={iconColor ?? colors.primary} />
        </View>
      )}
      <Text
        style={[
          typography.body,
          { color: colors.text, fontWeight: '700' },
          highlight && { ...typography.h3, color: colors.accent },
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
));

SummaryRow.displayName = 'SummaryRow';

const summaryRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Carte d'avertissement avec design premium
 */
const WarningCard: React.FC<{
  title: string;
  items: string[];
  colors: ThemeColors;
}> = React.memo(({ title, items, colors }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 3, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -3, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  return (
    <View
      style={[
        warningStyles.container,
        {
          backgroundColor: colors.accentBg,
          borderColor: `${colors.accent}40`,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <LinearGradient
          colors={[`${colors.warning}30`, `${colors.warning}15`]}
          style={warningStyles.iconWrapper}
        >
          <Ionicons name="warning" size={20} color={colors.warning} />
        </LinearGradient>
      </Animated.View>
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
  );
});

WarningCard.displayName = 'WarningCard';

const warningStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
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
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 7,
  },
});

/**
 * Carte info Stripe avec design premium
 */
const StripeInfoCard: React.FC<{
  onSetup: () => void;
  loading: boolean;
  colors: ThemeColors;
}> = React.memo(({ onSetup, loading, colors }) => {
  const btnScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(btnScale, {
      toValue: 0.95,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [btnScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(btnScale, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [btnScale]);

  return (
    <View
      style={[
        stripeStyles.container,
        {
          backgroundColor: colors.primaryBg,
          borderColor: `${colors.primary}30`,
        },
      ]}
    >
      <LinearGradient
        colors={[`${colors.primary}30`, `${colors.primary}15`]}
        style={stripeStyles.iconWrapper}
      >
        <Ionicons name="information-circle" size={24} color={colors.primary} />
      </LinearGradient>
      <View style={stripeStyles.content}>
        <Text style={[typography.body, { color: colors.primary, fontWeight: '700', marginBottom: spacing.xs }]}>
          Configuration Stripe recommandée
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md }]}>
          Vous pouvez créer ce ticket payant maintenant. Vos gains seront conservés jusqu'à ce que vous configuriez Stripe pour les retirer.
        </Text>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              stripeStyles.btn,
              {
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}10`,
              },
            ]}
            onPress={onSetup}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={0.9}
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
        </Animated.View>
      </View>
    </View>
  );
});

StripeInfoCard.displayName = 'StripeInfoCard';

const stripeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
});

/**
 * Bouton d'action avec animation
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
                : [colors.primary, colors.primaryLight || colors.primary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              actionBtnStyles.primary,
              !disabled && Platform.select({
                ios: createGlow(colors.primary, 0.4),
                android: { elevation: 6 },
              }),
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            )}
            <Text style={[typography.button, { color: '#FFFFFF', fontSize: 16 }]}>
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
        <Text style={[typography.button, { color: colors.primary }]}>{label}</Text>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
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

  const handleConfirm = async () => {
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
          icon="list"
          title={`Sélections (${draft.selections.length})`}
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
          <SectionHeader icon="receipt" title="Récapitulatif" colors={colors} />
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={effectGlass.light.intensity}
              tint="light"
              style={[
                styles.summaryCard,
                {
                  backgroundColor: `${colors.surface}90`,
                  borderColor: colors.border,
                },
              ]}
            >
              <SummaryRow
                label="Sélections"
                value={String(draft.selections.length)}
                colors={colors}
              />
              <SummaryRow
                label="Cote totale"
                value={draft.totalOdds.toFixed(2)}
                highlight
                colors={colors}
              />
              <SummaryRow
                label="Visibilité"
                value={draft.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
                icon={draft.visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
                iconColor={draft.visibility === 'PUBLIC' ? colors.primary : colors.warning}
                colors={colors}
              />
              {draft.visibility === 'PRIVATE' && draft.priceEur != null && (
                <SummaryRow
                  label="Prix"
                  value={`${draft.priceEur.toFixed(2)} €`}
                  colors={colors}
                />
              )}
            </BlurView>
          ) : (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  elevation: 3,
                },
              ]}
            >
              <SummaryRow
                label="Sélections"
                value={String(draft.selections.length)}
                colors={colors}
              />
              <SummaryRow
                label="Cote totale"
                value={draft.totalOdds.toFixed(2)}
                highlight
                colors={colors}
              />
              <SummaryRow
                label="Visibilité"
                value={draft.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
                icon={draft.visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
                iconColor={draft.visibility === 'PUBLIC' ? colors.primary : colors.warning}
                colors={colors}
              />
              {draft.visibility === 'PRIVATE' && draft.priceEur != null && (
                <SummaryRow
                  label="Prix"
                  value={`${draft.priceEur.toFixed(2)} €`}
                  colors={colors}
                />
              )}
            </View>
          )}
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
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={effectGlass.medium.intensity}
          tint="light"
          style={[
            styles.actions,
            {
              backgroundColor: `${colors.surface}90`,
              borderTopColor: colors.border,
            },
          ]}
        >
          <ActionButton
            label="Modifier le ticket"
            icon="arrow-back"
            onPress={handleModify}
            variant="secondary"
            colors={colors}
          />
          <ActionButton
            label={submitting ? 'Création en cours…' : 'Confirmer et créer le ticket'}
            icon="checkmark-circle"
            onPress={handleConfirm}
            variant="primary"
            loading={submitting}
            disabled={submitting}
            colors={colors}
          />
        </BlurView>
      ) : (
        <View
          style={[
            styles.actions,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              elevation: 8,
            },
          ]}
        >
          <ActionButton
            label="Modifier le ticket"
            icon="arrow-back"
            onPress={handleModify}
            variant="secondary"
            colors={colors}
          />
          <ActionButton
            label={submitting ? 'Création en cours…' : 'Confirmer et créer le ticket'}
            icon="checkmark-circle"
            onPress={handleConfirm}
            variant="primary"
            loading={submitting}
            disabled={submitting}
            colors={colors}
          />
        </View>
      )}
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
          padding: spacing.base,
          paddingBottom: spacing.xxl,
        },
        summarySection: {
          marginTop: spacing.xl,
        },
        summaryCard: {
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          overflow: 'hidden',
        },
        actions: {
          padding: spacing.base,
          borderTopWidth: 1,
          gap: spacing.md,
          overflow: 'hidden',
        },
      }),
    [colors]
  );

export default TicketPreviewScreen;

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { userApi } from '../api/user.api';
import { stripeApi } from '../api/stripe.api';
import type { WalletTransactionDto } from '../types/user.types';
import type {
  TipsterWalletDto,
  ConnectedAccountStatusDto,
} from '../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  effectShadows,
  springConfigs,
} from '../theme';
import { SkeletonTransactionList, Skeleton } from '../components/common/Skeleton';
import { WalletRefreshControl } from '../components/common/PremiumRefreshControl';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  Deposit: 'Dépôt',
  Purchase: 'Achat',
  Sale: 'Vente',
  Commission: 'Commission',
  Win: 'Bonus pronostic',
  Refund: 'Remboursement',
  SubscriptionPurchase: 'Abonnement',
  SubscriptionSale: 'Vente abonnement',
};

const TRANSACTION_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Deposit: 'arrow-down-circle',
  Purchase: 'cart',
  Sale: 'cash',
  Commission: 'git-branch',
  Win: 'trophy',
  Refund: 'refresh-circle',
  SubscriptionPurchase: 'people',
  SubscriptionSale: 'people-circle',
};

const STATUS_LABELS: Record<string, string> = {
  Pending: 'En attente',
  Completed: 'Terminé',
  Failed: 'Échoué',
};

// ─────────────────────────────────────────────────────────────
// Sub-components with glassmorphism & animations
// ─────────────────────────────────────────────────────────────

interface TransactionRowProps {
  tx: WalletTransactionDto;
  colors: ThemeColors;
}

const TransactionRow: React.FC<TransactionRowProps> = React.memo(({ tx, colors }) => {
  const styles = useTransactionStyles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const TRANSACTION_TYPE_COLORS: Record<string, string> = {
    Deposit: colors.success,
    Purchase: colors.warning,
    Sale: colors.success,
    Commission: colors.textSecondary,
    Win: colors.success,
    Refund: colors.primary,
    SubscriptionPurchase: colors.subscription,
    SubscriptionSale: colors.success,
  };

  const label = TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type;
  const icon = TRANSACTION_TYPE_ICONS[tx.type] ?? 'ellipse';
  const color = TRANSACTION_TYPE_COLORS[tx.type] ?? colors.textSecondary;
  const isPositive = tx.amountEur > 0;
  const date = new Date(tx.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const CardContainer = Platform.OS === 'ios' ? BlurView : View;
  const cardContainerProps = Platform.OS === 'ios'
    ? { intensity: 20, tint: 'dark' as const }
    : {};

  return (
    <Animated.View style={[styles.txWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <CardContainer {...cardContainerProps} style={styles.txRow}>
          {Platform.OS === 'android' && (
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={[`${colors.surface}F5`, `${colors.surface}E8`]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          <LinearGradient
            colors={[color, `${color}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.txIcon}
          >
            <Ionicons name={icon} size={20} color={colors.textOnPrimary} />
          </LinearGradient>

          <View style={styles.txInfo}>
            <Text style={styles.txLabel}>{label}</Text>
            <View style={styles.txDateRow}>
              <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
              <Text style={styles.txDate}>{date}</Text>
            </View>
            {tx.status !== 'Completed' && (
              <View style={[
                styles.txStatusBadge,
                tx.status === 'Failed' && styles.txStatusBadgeFailed,
              ]}>
                <Ionicons
                  name={tx.status === 'Failed' ? 'close-circle' : 'time'}
                  size={10}
                  color={tx.status === 'Failed' ? colors.danger : colors.warning}
                />
                <Text
                  style={[
                    styles.txStatus,
                    tx.status === 'Failed' && { color: colors.danger },
                  ]}
                >
                  {STATUS_LABELS[tx.status] ?? tx.status}
                </Text>
              </View>
            )}
          </View>

          <LinearGradient
            colors={isPositive
              ? [`${colors.success}25`, `${colors.success}15`]
              : [`${colors.danger}25`, `${colors.danger}15`]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.txAmountBadge,
              { borderColor: isPositive ? `${colors.success}40` : `${colors.danger}40` },
            ]}
          >
            <Text
              style={[
                styles.txAmount,
                { color: isPositive ? colors.success : colors.danger },
              ]}
            >
              {isPositive ? '+' : ''}
              {tx.amountEur.toFixed(2)} €
            </Text>
          </LinearGradient>
        </CardContainer>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Tipster Earnings Card
// ─────────────────────────────────────────────────────────────

interface TipsterEarningsCardProps {
  tipsterWallet: TipsterWalletDto | null;
  stripeStatus: ConnectedAccountStatusDto | null;
  onSetupStripe: () => void;
  onRequestPayout: () => void;
  loading: boolean;
  colors: ThemeColors;
}

const TipsterEarningsCard: React.FC<TipsterEarningsCardProps> = React.memo(({
  tipsterWallet,
  stripeStatus,
  onSetupStripe,
  onRequestPayout,
  loading,
  colors,
}) => {
  const styles = useEarningsStyles(colors);
  const setupScaleAnim = useRef(new Animated.Value(1)).current;
  const payoutScaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isStripeConfigured = stripeStatus?.status === 'Completed';
  const canRequestPayout =
    isStripeConfigured && (tipsterWallet?.availableBalance ?? 0) >= 10;

  const hasEarnings = (tipsterWallet?.availableBalance ?? 0) > 0 || (tipsterWallet?.totalEarned ?? 0) > 0;

  useEffect(() => {
    if (isStripeConfigured && (tipsterWallet?.availableBalance ?? 0) > 0) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [isStripeConfigured, tipsterWallet?.availableBalance, pulseAnim]);

  const handleSetupPressIn = useCallback(() => {
    Animated.spring(setupScaleAnim, {
      toValue: 0.96,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [setupScaleAnim]);

  const handleSetupPressOut = useCallback(() => {
    Animated.spring(setupScaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [setupScaleAnim]);

  const handlePayoutPressIn = useCallback(() => {
    Animated.spring(payoutScaleAnim, {
      toValue: 0.96,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [payoutScaleAnim]);

  const handlePayoutPressOut = useCallback(() => {
    Animated.spring(payoutScaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [payoutScaleAnim]);

  const CardContainer = Platform.OS === 'ios' ? BlurView : View;
  const cardContainerProps = Platform.OS === 'ios'
    ? { intensity: 30, tint: 'dark' as const }
    : {};

  if (!isStripeConfigured) {
    return (
      <View style={styles.cardWrapper}>
        <CardContainer {...cardContainerProps} style={styles.earningsCard}>
          {Platform.OS === 'android' && (
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={[`${colors.surface}F8`, `${colors.surface}F0`]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Header */}
          <View style={styles.earningsHeader}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.earningsIconWrapper}
            >
              <Ionicons name="wallet-outline" size={24} color={colors.textOnPrimary} />
            </LinearGradient>
            <View style={styles.earningsHeaderText}>
              <Text style={styles.earningsTitle}>Mes revenus tipster</Text>
              <Text style={styles.earningsSubtitle}>Gérez vos gains</Text>
            </View>
          </View>

          {/* Balance if user has earnings */}
          {hasEarnings && (
            <View style={styles.balanceContainer}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceLabelRow}>
                  <View style={styles.balanceIconWrapper}>
                    <Ionicons name="wallet" size={14} color={colors.success} />
                  </View>
                  <Text style={styles.balanceLabel}>Solde disponible</Text>
                </View>
                <LinearGradient
                  colors={[colors.success, `${colors.success}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.balanceValueBadge}
                >
                  <Text style={styles.balanceValue}>
                    {tipsterWallet?.availableBalance.toFixed(2) ?? '0.00'} €
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.totalRow}>
                <View style={styles.balanceLabelRow}>
                  <View style={[styles.balanceIconWrapper, { backgroundColor: colors.primaryBg }]}>
                    <Ionicons name="trending-up" size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.totalLabel}>Total gagné</Text>
                </View>
                <Text style={styles.totalValue}>
                  {tipsterWallet?.totalEarned.toFixed(2) ?? '0.00'} €
                </Text>
              </View>
            </View>
          )}

          {/* Setup CTA */}
          <View style={styles.setupContainer}>
            <View style={styles.setupIconWrapper}>
              <Ionicons name="card-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.setupText}>
              {hasEarnings
                ? 'Configurez Stripe pour retirer vos gains vers votre compte bancaire.'
                : 'Configurez Stripe pour recevoir vos paiements et retirer vos gains.'}
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: setupScaleAnim }] }}>
            <TouchableOpacity
              onPress={onSetupStripe}
              onPressIn={handleSetupPressIn}
              onPressOut={handleSetupPressOut}
              disabled={loading}
              activeOpacity={1}
              accessibilityLabel="Configurer mes paiements"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.setupBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <>
                    <Ionicons name="card-outline" size={18} color={colors.textOnPrimary} />
                    <Text style={styles.setupBtnText}>
                      {hasEarnings ? 'Configurer pour retirer' : 'Configurer mes paiements'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {stripeStatus?.status === 'Pending' && (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingIconWrapper}>
                <Ionicons name="time" size={14} color={colors.warning} />
              </View>
              <Text style={styles.pendingText}>
                Configuration en cours... Terminez votre inscription Stripe.
              </Text>
            </View>
          )}

          {/* Decorative line */}
          <LinearGradient
            colors={[colors.primary, colors.accent, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </CardContainer>
      </View>
    );
  }

  // Stripe configured state
  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <CardContainer {...cardContainerProps} style={styles.earningsCardActive}>
        {Platform.OS === 'android' && (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={[`${colors.surface}F8`, `${colors.surface}F0`]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* Header */}
        <View style={styles.earningsHeader}>
          <LinearGradient
            colors={[colors.success, `${colors.success}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.earningsIconWrapper}
          >
            <Ionicons name="wallet" size={24} color={colors.textOnPrimary} />
          </LinearGradient>
          <View style={styles.earningsHeaderText}>
            <Text style={styles.earningsTitle}>Mes revenus</Text>
            <View style={styles.stripeActiveBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={styles.stripeActiveText}>Stripe activé</Text>
            </View>
          </View>
        </View>

        {/* Main Balance */}
        <View style={styles.balanceContainerMain}>
          <Text style={styles.balanceLabelMain}>Solde disponible</Text>
          <View style={styles.balanceAmountRow}>
            <LinearGradient
              colors={[colors.success, `${colors.success}DD`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.balanceAmountGradient}
            >
              <Text style={styles.balanceValueLarge}>
                {tipsterWallet?.availableBalance.toFixed(2) ?? '0.00'}
              </Text>
              <Text style={styles.balanceCurrency}>EUR</Text>
            </LinearGradient>
          </View>

          {(tipsterWallet?.pendingPayout ?? 0) > 0 && (
            <View style={styles.pendingPayoutRow}>
              <View style={styles.pendingPayoutIcon}>
                <Ionicons name="swap-horizontal" size={14} color={colors.accent} />
              </View>
              <Text style={styles.pendingPayoutLabel}>En cours de virement</Text>
              <Text style={styles.pendingPayoutValue}>
                {tipsterWallet?.pendingPayout.toFixed(2)} €
              </Text>
            </View>
          )}

          <View style={styles.totalRowConfigured}>
            <View style={styles.totalRowContent}>
              <View style={[styles.totalIconWrapper]}>
                <Ionicons name="stats-chart" size={14} color={colors.primary} />
              </View>
              <Text style={styles.totalLabel}>Total gagné</Text>
            </View>
            <Text style={styles.totalValueConfigured}>
              {tipsterWallet?.totalEarned.toFixed(2) ?? '0.00'} €
            </Text>
          </View>
        </View>

        {/* Payout Button */}
        <Animated.View style={{ transform: [{ scale: payoutScaleAnim }] }}>
          <TouchableOpacity
            onPress={onRequestPayout}
            onPressIn={handlePayoutPressIn}
            onPressOut={handlePayoutPressOut}
            disabled={!canRequestPayout || loading}
            activeOpacity={1}
            accessibilityLabel="Demander un virement"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={canRequestPayout
                ? [colors.success, `${colors.success}DD`]
                : [colors.border, colors.border]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.payoutBtn, !canRequestPayout && styles.payoutBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="arrow-up-circle"
                    size={20}
                    color={canRequestPayout ? colors.textOnPrimary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.payoutBtnText,
                      !canRequestPayout && styles.payoutBtnTextDisabled,
                    ]}
                  >
                    Demander un virement
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.minTextContainer}>
          <Ionicons name="information-circle" size={12} color={colors.textTertiary} />
          <Text style={styles.minText}>Minimum: 10 EUR</Text>
        </View>

        {/* Decorative line */}
        <LinearGradient
          colors={[colors.success, colors.primary, colors.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </CardContainer>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const styles = useSectionStyles(colors);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.sectionHeader}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sectionBadge}
        >
          <Ionicons name="list" size={12} color={colors.textOnPrimary} />
          <Text style={styles.sectionBadgeText}>Historique</Text>
        </LinearGradient>
      </Animated.View>
      <View style={styles.sectionLine} />
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────────────────────

const LoadingState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const styles = useLoadingStyles(colors);

  return (
    <View style={styles.container}>
      {/* Balance skeleton */}
      <View style={styles.balanceSection}>
        <Skeleton width={100} height={14} variant="text" />
        <Skeleton width={150} height={36} variant="text" animationDelay={50} />
      </View>

      {/* Transactions skeleton */}
      <View style={styles.transactionsSection}>
        <Skeleton width={120} height={16} variant="text" animationDelay={100} />
        <SkeletonTransactionList count={5} style={styles.transactionsList} />
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const styles = useEmptyStyles(colors);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim]);

  return (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
        <LinearGradient
          colors={[`${colors.primary}20`, `${colors.primary}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyGradient}
        >
          <Ionicons name="receipt-outline" size={40} color={colors.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>Aucune transaction</Text>
      <Text style={styles.emptyText}>
        Vos transactions apparaîtront ici
      </Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────

const WalletScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [tipsterWallet, setTipsterWallet] = useState<TipsterWalletDto | null>(null);
  const [stripeStatus, setStripeStatus] = useState<ConnectedAccountStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes, statusRes] = await Promise.all([
        stripeApi.getTipsterWallet().catch(() => ({ data: null })),
        userApi.getTransactions().catch(() => ({ data: [] })),
        stripeApi.getStatus().catch(() => ({ data: null })),
      ]);
      setTipsterWallet(walletRes.data);
      setTransactions(txRes.data);
      setStripeStatus(statusRes.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleSetupStripe = useCallback(async () => {
    setStripeLoading(true);
    try {
      const { data } = await stripeApi.startOnboarding();
      await Linking.openURL(data.url);
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer la configuration Stripe');
    } finally {
      setStripeLoading(false);
    }
  }, []);

  const handleRequestPayout = useCallback(async () => {
    const amount = tipsterWallet?.availableBalance ?? 0;
    Alert.alert(
      'Demander un virement',
      `Virer ${amount.toFixed(2)} EUR vers votre compte bancaire ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setStripeLoading(true);
            try {
              const { data } = await stripeApi.requestPayout();
              if (data.success) {
                Alert.alert(
                  'Succès',
                  `Virement de ${data.amount?.toFixed(2)} EUR initié`
                );
                fetchData();
              } else {
                Alert.alert('Erreur', data.message ?? 'Impossible de créer le virement');
              }
            } catch {
              Alert.alert('Erreur', 'Impossible de créer le virement');
            } finally {
              setStripeLoading(false);
            }
          },
        },
      ]
    );
  }, [tipsterWallet, fetchData]);

  const renderHeader = useCallback(() => (
    <View>
      <TipsterEarningsCard
        tipsterWallet={tipsterWallet}
        stripeStatus={stripeStatus}
        onSetupStripe={handleSetupStripe}
        onRequestPayout={handleRequestPayout}
        loading={stripeLoading}
        colors={colors}
      />
      <SectionHeader colors={colors} />
    </View>
  ), [tipsterWallet, stripeStatus, handleSetupStripe, handleRequestPayout, stripeLoading, colors]);

  const renderTransaction = useCallback(
    ({ item }: { item: WalletTransactionDto }) => (
      <TransactionRow tx={item} colors={colors} />
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: WalletTransactionDto) => item.id, []);

  if (loading) {
    return <LoadingState colors={colors} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <WalletRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={<EmptyState colors={colors} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listContent: {
          padding: spacing.md,
          paddingBottom: spacing.xxl + 80,
        },
        separator: {
          height: spacing.sm,
        },
      }),
    [colors]
  );

const useTransactionStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        txWrapper: {
          borderRadius: radius.lg,
          ...effectShadows.md,
        },
        txRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radius.lg,
          padding: spacing.md,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.card.borderColor,
          backgroundColor: Platform.OS === 'android' ? 'transparent' : undefined,
        },
        txIcon: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          ...effectShadows.sm,
        },
        txInfo: {
          flex: 1,
        },
        txLabel: {
          ...typography.body,
          fontWeight: '600',
          color: colors.text,
        },
        txDateRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          marginTop: spacing.xxs,
        },
        txDate: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        txStatusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          backgroundColor: colors.warning + '15',
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
          marginTop: spacing.xs,
          borderWidth: 1,
          borderColor: colors.warning + '30',
        },
        txStatusBadgeFailed: {
          backgroundColor: colors.danger + '15',
          borderColor: colors.danger + '30',
        },
        txStatus: {
          ...typography.caption,
          fontSize: 10,
          fontWeight: '600',
          color: colors.warning,
        },
        txAmountBadge: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
        },
        txAmount: {
          ...typography.body,
          fontWeight: '700',
        },
      }),
    [colors]
  );

const useEarningsStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        cardWrapper: {
          marginBottom: spacing.lg,
          borderRadius: radius.xl,
          ...effectShadows.lg,
        },
        earningsCard: {
          borderRadius: radius.xl,
          padding: spacing.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.card.borderColor,
          backgroundColor: Platform.OS === 'android' ? 'transparent' : undefined,
        },
        earningsCardActive: {
          borderRadius: radius.xl,
          padding: spacing.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: `${colors.success}40`,
          backgroundColor: Platform.OS === 'android' ? 'transparent' : undefined,
        },
        earningsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.lg,
        },
        earningsIconWrapper: {
          width: 52,
          height: 52,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          ...effectShadows.md,
        },
        earningsHeaderText: {
          flex: 1,
        },
        earningsTitle: {
          ...typography.h3,
          color: colors.text,
        },
        earningsSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xxs,
        },
        stripeActiveBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          marginTop: spacing.xs,
          backgroundColor: colors.success + '15',
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        stripeActiveText: {
          ...typography.caption,
          color: colors.success,
          fontWeight: '600',
        },
        balanceContainer: {
          backgroundColor: `${colors.background}90`,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        balanceRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        balanceLabelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        balanceIconWrapper: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.successBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        balanceLabel: {
          ...typography.body,
          color: colors.textSecondary,
        },
        balanceValueBadge: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.md,
        },
        balanceValue: {
          ...typography.h4,
          color: colors.textOnPrimary,
          fontWeight: '700',
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        totalLabel: {
          ...typography.bodySmall,
          color: colors.textSecondary,
        },
        totalValue: {
          ...typography.body,
          fontWeight: '600',
          color: colors.text,
        },
        balanceContainerMain: {
          backgroundColor: `${colors.background}90`,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        balanceLabelMain: {
          ...typography.caption,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: spacing.sm,
        },
        balanceAmountRow: {
          marginBottom: spacing.md,
        },
        balanceAmountGradient: {
          flexDirection: 'row',
          alignItems: 'baseline',
          alignSelf: 'flex-start',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
          ...effectShadows.md,
        },
        balanceValueLarge: {
          ...typography.h1,
          color: colors.textOnPrimary,
          fontWeight: '700',
        },
        balanceCurrency: {
          ...typography.body,
          color: `${colors.textOnPrimary}CC`,
          fontWeight: '600',
        },
        pendingPayoutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.accentBg,
          padding: spacing.md,
          borderRadius: radius.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: `${colors.accent}30`,
        },
        pendingPayoutIcon: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          backgroundColor: colors.accent + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        pendingPayoutLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          flex: 1,
        },
        pendingPayoutValue: {
          ...typography.body,
          fontWeight: '700',
          color: colors.accent,
        },
        totalRowConfigured: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        totalRowContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        totalIconWrapper: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        totalValueConfigured: {
          ...typography.h4,
          fontWeight: '700',
          color: colors.text,
        },
        setupContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          backgroundColor: colors.accentBg,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderWidth: 1,
          borderColor: colors.accent + '20',
        },
        setupIconWrapper: {
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          backgroundColor: colors.accent + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        setupText: {
          ...typography.body,
          color: colors.textSecondary,
          flex: 1,
          lineHeight: 22,
        },
        setupBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          minHeight: 48,
          ...effectShadows.md,
        },
        setupBtnText: {
          ...typography.button,
          color: colors.textOnPrimary,
        },
        pendingBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.warning + '15',
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.md,
          borderWidth: 1,
          borderColor: colors.warning + '30',
        },
        pendingIconWrapper: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.warning + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        pendingText: {
          ...typography.caption,
          color: colors.warning,
          flex: 1,
        },
        payoutBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          minHeight: 48,
          ...effectShadows.md,
        },
        payoutBtnDisabled: {
          ...Platform.select({
            ios: {
              shadowOpacity: 0,
            },
            android: {
              elevation: 0,
            },
          }),
        },
        payoutBtnText: {
          ...typography.button,
          color: colors.textOnPrimary,
        },
        payoutBtnTextDisabled: {
          color: colors.textTertiary,
        },
        minTextContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          marginTop: spacing.md,
        },
        minText: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        accentLine: {
          position: 'absolute',
          bottom: 0,
          left: spacing.lg,
          right: spacing.lg,
          height: 2,
          borderRadius: radius.full,
        },
      }),
    [colors]
  );

const useSectionStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.md,
        },
        sectionBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          ...effectShadows.sm,
        },
        sectionBadgeText: {
          ...typography.label,
          color: colors.textOnPrimary,
          fontWeight: '600',
        },
        sectionLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
      }),
    [colors]
  );

const useLoadingStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.md,
        },
        balanceSection: {
          alignItems: 'center',
          paddingVertical: spacing.xl,
          gap: spacing.sm,
        },
        transactionsSection: {
          gap: spacing.md,
        },
        transactionsList: {
          marginTop: spacing.sm,
        },
      }),
    [colors]
  );

const useEmptyStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        emptyState: {
          alignItems: 'center',
          paddingTop: spacing.xxl,
          paddingHorizontal: spacing.xl,
        },
        emptyIconWrapper: {
          marginBottom: spacing.lg,
        },
        emptyGradient: {
          width: 100,
          height: 100,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${colors.primary}30`,
          borderStyle: 'dashed',
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        emptyText: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [colors]
  );

export default WalletScreen;

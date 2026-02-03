import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { userApi } from '../api/user.api';
import { stripeApi } from '../api/stripe.api';
import type { WalletTransactionDto } from '../types/user.types';
import type {
  TipsterWalletDto,
  ConnectedAccountStatusDto,
} from '../types';
import { useTheme, type ThemeColors } from '../theme';

// Deposit functionality removed - now using direct EUR payments via Stripe

// --- Transaction row ---
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  Deposit: 'Depot',
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

const TransactionRow: React.FC<{
  tx: WalletTransactionDto;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({ tx, styles, colors }) => {
  const TRANSACTION_TYPE_COLORS: Record<string, string> = {
    Deposit: colors.success,
    Purchase: colors.warning,
    Sale: colors.success,
    Commission: colors.textSecondary,
    Win: colors.success,
    Refund: colors.primary,
    SubscriptionPurchase: '#AF52DE',
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

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{label}</Text>
        <Text style={styles.txDate}>{date}</Text>
        {tx.status !== 'Completed' && (
          <Text
            style={[
              styles.txStatus,
              tx.status === 'Failed' && { color: colors.danger },
            ]}
          >
            {STATUS_LABELS[tx.status] ?? tx.status}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: isPositive ? colors.success : colors.danger },
        ]}
      >
        {isPositive ? '+' : ''}
        {tx.amountEur.toFixed(2)} EUR
      </Text>
    </View>
  );
};

const STATUS_LABELS: Record<string, string> = {
  Pending: 'En attente',
  Completed: 'Termine',
  Failed: 'Echoue',
};

// --- Tipster Earnings Section ---
const TipsterEarningsCard: React.FC<{
  tipsterWallet: TipsterWalletDto | null;
  stripeStatus: ConnectedAccountStatusDto | null;
  onSetupStripe: () => void;
  onRequestPayout: () => void;
  loading: boolean;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({
  tipsterWallet,
  stripeStatus,
  onSetupStripe,
  onRequestPayout,
  loading,
  styles,
  colors,
}) => {
  const isStripeConfigured = stripeStatus?.status === 'Completed';
  const canRequestPayout =
    isStripeConfigured && (tipsterWallet?.availableBalance ?? 0) >= 10;

  if (!isStripeConfigured) {
    return (
      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          <Text style={styles.earningsTitle}>Mes revenus tipster</Text>
        </View>
        <Text style={styles.setupText}>
          Configurez Stripe pour recevoir vos paiements et retirer vos gains.
        </Text>
        <TouchableOpacity
          style={styles.setupBtn}
          onPress={onSetupStripe}
          disabled={loading}
        >
          <Ionicons name="card-outline" size={18} color={colors.textOnPrimary} />
          <Text style={styles.setupBtnText}>Configurer mes paiements</Text>
        </TouchableOpacity>
        {stripeStatus?.status === 'Pending' && (
          <Text style={styles.pendingText}>
            Configuration en cours... Terminez votre inscription Stripe.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsHeader}>
        <Ionicons name="wallet" size={24} color={colors.success} />
        <Text style={styles.earningsTitle}>Mes revenus</Text>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Solde disponible</Text>
        <Text style={styles.balanceValue}>
          {tipsterWallet?.availableBalance.toFixed(2) ?? '0.00'} EUR
        </Text>
      </View>

      {(tipsterWallet?.pendingPayout ?? 0) > 0 && (
        <View style={styles.pendingRow}>
          <Text style={styles.pendingLabel}>En cours de virement</Text>
          <Text style={styles.pendingValue}>
            {tipsterWallet?.pendingPayout.toFixed(2)} EUR
          </Text>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total gagne</Text>
        <Text style={styles.totalValue}>
          {tipsterWallet?.totalEarned.toFixed(2) ?? '0.00'} EUR
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.payoutBtn,
          !canRequestPayout && styles.payoutBtnDisabled,
        ]}
        onPress={onRequestPayout}
        disabled={!canRequestPayout || loading}
      >
        <Ionicons
          name="arrow-up-circle-outline"
          size={18}
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
      </TouchableOpacity>
      <Text style={styles.minText}>Minimum: 10 EUR</Text>
    </View>
  );
};

// --- Main screen ---
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
      Alert.alert('Erreur', 'Impossible de charger les donnees');
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

  // --- Stripe Setup ---
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

  // --- Payout ---
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
                  'Succes',
                  `Virement de ${data.amount?.toFixed(2)} EUR initie`
                );
                fetchData();
              } else {
                Alert.alert('Erreur', data.message ?? 'Impossible de creer le virement');
              }
            } catch {
              Alert.alert('Erreur', 'Impossible de creer le virement');
            } finally {
              setStripeLoading(false);
            }
          },
        },
      ]
    );
  }, [tipsterWallet, fetchData]);


  // --- Header ---
  const renderHeader = () => (
    <View>
      {/* Tipster Earnings Card */}
      <TipsterEarningsCard
        tipsterWallet={tipsterWallet}
        stripeStatus={stripeStatus}
        onSetupStripe={handleSetupStripe}
        onRequestPayout={handleRequestPayout}
        loading={stripeLoading}
        styles={styles}
        colors={colors}
      />

      {/* Section title */}
      <Text style={styles.sectionTitle}>Historique des transactions</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow tx={item} styles={styles} colors={colors} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
      />

    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        listContent: {
          padding: 16,
          paddingBottom: 32,
        },

        // Tipster Earnings Card
        earningsCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.success + '30',
        },
        earningsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        },
        earningsTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        setupText: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 16,
          lineHeight: 20,
        },
        setupBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          gap: 8,
        },
        setupBtnText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        pendingText: {
          fontSize: 12,
          color: colors.warning,
          marginTop: 12,
          textAlign: 'center',
        },
        balanceRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        balanceLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        balanceValue: {
          fontSize: 24,
          fontWeight: '800',
          color: colors.success,
        },
        pendingRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        pendingLabel: {
          fontSize: 13,
          color: colors.textTertiary,
        },
        pendingValue: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.warning,
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          marginBottom: 16,
        },
        totalLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        totalValue: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
        },
        payoutBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.success,
          borderRadius: 12,
          paddingVertical: 14,
          gap: 8,
        },
        payoutBtnDisabled: {
          backgroundColor: colors.border,
        },
        payoutBtnText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        payoutBtnTextDisabled: {
          color: colors.textTertiary,
        },
        minText: {
          fontSize: 11,
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: 8,
        },

        // Section
        sectionTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 10,
        },

        // Transactions
        txRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        txIcon: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        txInfo: {
          flex: 1,
        },
        txLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        txDate: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        txStatus: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.warning,
          marginTop: 2,
        },
        txAmount: {
          fontSize: 16,
          fontWeight: '700',
        },

        // Empty state
        emptyState: {
          alignItems: 'center',
          paddingTop: 40,
          gap: 8,
        },
        emptyText: {
          fontSize: 15,
          color: colors.textSecondary,
        },

      }),
    [colors]
  );

export default WalletScreen;

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { userApi } from '../api/user.api';
import { stripeApi } from '../api/stripe.api';
import type {
  WalletDto,
  WalletTransactionDto,
} from '../types/user.types';
import type {
  TipsterWalletDto,
  ConnectedAccountStatusDto,
} from '../types';
import { useTheme, type ThemeColors } from '../theme';

const DEPOSIT_AMOUNTS = [5, 10, 20, 50] as const;
const CREDITS_PER_EURO = 10;

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
  const isPositive = tx.amountCredits > 0;
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
        {tx.amountCredits}
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

  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [tipsterWallet, setTipsterWallet] = useState<TipsterWalletDto | null>(
    null
  );
  const [stripeStatus, setStripeStatus] =
    useState<ConnectedAccountStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes, tipsterRes, statusRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getTransactions(),
        stripeApi.getTipsterWallet().catch(() => ({ data: null })),
        stripeApi.getStatus().catch(() => ({ data: null })),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
      setTipsterWallet(tipsterRes.data);
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

  // --- Deposit ---
  const handleDeposit = useCallback(
    async (amountEur: number) => {
      setDepositing(true);
      try {
        const { data } = await userApi.deposit(amountEur);
        if (!data.success) {
          Alert.alert('Erreur', data.message ?? 'Impossible de creer le depot');
          return;
        }
        setShowDeposit(false);
        if (data.moonPayUrl) {
          await Linking.openURL(data.moonPayUrl);
        }
        Alert.alert(
          'Depot initie',
          `${data.creditsToReceive} credits seront ajoutes apres confirmation du paiement.`
        );
        fetchData();
      } catch {
        Alert.alert('Erreur', 'Impossible de creer le depot');
      } finally {
        setDepositing(false);
      }
    },
    [fetchData]
  );

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

      {/* Legacy Credits Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.creditsLabel}>Credits disponibles</Text>
        <Text style={styles.creditsAmount}>
          {wallet?.availableCredits ?? 0}{' '}
          <Text style={styles.creditsUnit}>credits</Text>
        </Text>
        {wallet && wallet.lockedCredits > 0 && (
          <Text style={styles.lockedText}>
            {wallet.lockedCredits} credits reserves
          </Text>
        )}

        {/* Credits info banner */}
        <View style={styles.creditsInfo}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.creditsInfoText}>
            Les credits servent uniquement a acceder aux contenus premium.
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.depositBtn}
            onPress={() => setShowDeposit(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={18}
              color={colors.textOnPrimary}
            />
            <Text style={styles.depositBtnText}>Acheter des credits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Historique</Text>
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

      {/* Deposit Modal */}
      <Modal
        visible={showDeposit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeposit(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeposit(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Acheter des credits</Text>
            <Text style={styles.modalSubtitle}>
              1 EUR = {CREDITS_PER_EURO} credits
            </Text>
            <Text style={styles.modalInfo}>Non convertibles en argent reel</Text>
            <View style={styles.amountGrid}>
              {DEPOSIT_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.amountBtn}
                  onPress={() => handleDeposit(amount)}
                  disabled={depositing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.amountValue}>{amount} EUR</Text>
                  <Text style={styles.amountCredits}>
                    {amount * CREDITS_PER_EURO} credits
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {depositing && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: 12 }}
              />
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDeposit(false)}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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

        // Legacy Credits Balance card
        balanceCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          marginBottom: 20,
        },
        creditsLabel: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        creditsAmount: {
          fontSize: 36,
          fontWeight: '800',
          color: colors.text,
        },
        creditsUnit: {
          fontSize: 16,
          fontWeight: '400',
          color: colors.textSecondary,
        },
        lockedText: {
          fontSize: 13,
          color: colors.warning,
          marginTop: 6,
        },
        creditsInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primaryLight,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginTop: 14,
          gap: 8,
        },
        creditsInfoText: {
          flex: 1,
          fontSize: 12,
          color: colors.primary,
          lineHeight: 16,
        },
        actionButtons: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 18,
        },
        depositBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.success,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 6,
        },
        depositBtnText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary,
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

        // Modals
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          width: '85%',
          alignItems: 'center',
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 4,
        },
        modalSubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        modalInfo: {
          fontSize: 11,
          color: colors.textTertiary,
          marginBottom: 16,
          fontStyle: 'italic',
        },
        amountGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
        },
        amountBtn: {
          backgroundColor: colors.background,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          alignItems: 'center',
          minWidth: 120,
        },
        amountValue: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.primary,
        },
        amountCredits: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        modalClose: {
          marginTop: 16,
          paddingVertical: 8,
        },
        modalCloseText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.danger,
        },
      }),
    [colors]
  );

export default WalletScreen;

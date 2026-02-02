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
import type {
  WalletDto,
  WalletTransactionDto,
} from '../types/user.types';
import { useTheme, type ThemeColors } from '../theme';

const DEPOSIT_AMOUNTS = [5, 10, 20, 50] as const;
const CREDITS_PER_EURO = 10;

// --- Transaction row ---
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
  Completed: 'Terminé',
  Failed: 'Échoué',
};

// --- Main screen ---
const WalletScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositing, setDepositing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getTransactions(),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les crédits');
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

  // --- Deposit ---
  const handleDeposit = useCallback(
    async (amountEur: number) => {
      setDepositing(true);
      try {
        const { data } = await userApi.deposit(amountEur);
        if (!data.success) {
          Alert.alert('Erreur', data.message ?? 'Impossible de créer le dépôt');
          return;
        }
        setShowDeposit(false);
        if (data.moonPayUrl) {
          await Linking.openURL(data.moonPayUrl);
        }
        Alert.alert(
          'Dépôt initié',
          `${data.creditsToReceive} crédits seront ajoutés après confirmation du paiement.`
        );
        fetchData();
      } catch {
        Alert.alert('Erreur', 'Impossible de créer le dépôt');
      } finally {
        setDepositing(false);
      }
    },
    [fetchData]
  );

  // --- Header ---
  const renderHeader = () => (
    <View>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Crédits disponibles</Text>
        <Text style={styles.balanceAmount}>
          {wallet?.availableCredits ?? 0}{' '}
          <Text style={styles.balanceUnit}>crédits</Text>
        </Text>
        {wallet && wallet.lockedCredits > 0 && (
          <Text style={styles.lockedText}>
            {wallet.lockedCredits} crédits réservés
          </Text>
        )}

        {/* Credits info banner */}
        <View style={styles.creditsInfo}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.creditsInfoText}>
            Les crédits servent uniquement à accéder aux contenus premium.
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.depositBtn}
            onPress={() => setShowDeposit(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.depositBtnText}>Acheter des crédits</Text>
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
        renderItem={({ item }) => <TransactionRow tx={item} styles={styles} colors={colors} />}
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
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Acheter des crédits</Text>
            <Text style={styles.modalSubtitle}>
              1 € = {CREDITS_PER_EURO} crédits
            </Text>
            <Text style={styles.modalInfo}>
              Non convertibles en argent réel
            </Text>
            <View style={styles.amountGrid}>
              {DEPOSIT_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.amountBtn}
                  onPress={() => handleDeposit(amount)}
                  disabled={depositing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.amountValue}>{amount} €</Text>
                  <Text style={styles.amountCredits}>
                    {amount * CREDITS_PER_EURO} crédits
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

        // Balance card
        balanceCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          marginBottom: 20,
        },
        balanceLabel: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        balanceAmount: {
          fontSize: 36,
          fontWeight: '800',
          color: colors.text,
        },
        balanceUnit: {
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

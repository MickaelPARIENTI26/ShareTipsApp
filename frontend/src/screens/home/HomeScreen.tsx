import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import type { HomeStackParamList, RootStackParamList } from '../../types';
import { useTheme, type ThemeColors } from '../../theme';

const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { colors } = useTheme();
  const styles = useStyles(colors);

  // Global wallet store
  const wallet = useWalletStore((s) => s.wallet);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const hydrateWallet = useWalletStore((s) => s.hydrate);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      hydrateWallet();
    }, [hydrateWallet])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  }, [refreshWallet]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User info */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={48} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user?.username ?? '—'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* Wallet — tappable, navigates to WalletScreen */}
      <TouchableOpacity
        style={styles.walletCard}
        onPress={() => rootNavigation.navigate('Wallet')}
        activeOpacity={0.7}
      >
        <View style={styles.walletHeader}>
          <Text style={styles.walletLabel}>Solde disponible</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Appuyez pour réessayer</Text>
          </View>
        ) : (
          <Text style={styles.walletAmount}>
            {wallet?.availableBalance?.toFixed(2) ?? '0.00'}{' '}
            <Text style={styles.walletUnit}>EUR</Text>
          </Text>
        )}
        {wallet && !loading && !error && wallet.pendingPayout > 0 && (
          <Text style={styles.walletLocked}>
            {wallet.pendingPayout.toFixed(2)} EUR en virement
          </Text>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionButton
          icon="receipt-outline"
          label="Mes tickets"
          onPress={() => rootNavigation.navigate('MyTickets')}
          colors={colors}
          styles={styles}
        />
        <ActionButton
          icon="football-outline"
          label="Voir les sports"
          onPress={() => navigation.navigate('SportsList')}
          colors={colors}
          styles={styles}
        />
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerText}>
            ShareTips est une plateforme de partage de pronostics. Nous ne proposons pas de paris et ne garantissons aucun résultat. Vous restez seul responsable de vos décisions.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('CGU')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalLink}>CGU</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('CGV')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalLink}>CGV</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('PrivacyPolicy')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalLink}>Confidentialité</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, colors, styles }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={28} color={colors.primary} />
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
  </TouchableOpacity>
);

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 16,
          paddingBottom: 32,
        },
        userCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        },
        avatar: {
          marginRight: 12,
        },
        userInfo: {
          flex: 1,
        },
        username: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
        },
        email: {
          fontSize: 14,
          color: colors.textSecondary,
          marginTop: 2,
        },
        walletCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
          marginBottom: 16,
        },
        walletHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8,
        },
        walletLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        walletAmount: {
          fontSize: 36,
          fontWeight: '800',
          color: colors.text,
        },
        walletUnit: {
          fontSize: 16,
          fontWeight: '400',
          color: colors.textSecondary,
        },
        walletLocked: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 6,
        },
        errorText: {
          color: colors.danger,
          fontSize: 14,
          textAlign: 'center',
        },
        retryText: {
          color: colors.primary,
          fontSize: 14,
          textAlign: 'center',
          marginTop: 4,
        },
        actions: {
          gap: 10,
        },
        actionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
        },
        actionLabel: {
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          color: colors.text,
          marginLeft: 12,
        },
        disclaimer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginTop: 24,
          paddingHorizontal: 8,
        },
        disclaimerContent: {
          flex: 1,
        },
        disclaimerText: {
          fontSize: 11,
          color: colors.textTertiary,
          lineHeight: 16,
        },
        legalLinks: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
        },
        legalLink: {
          fontSize: 11,
          color: colors.primary,
          textDecorationLine: 'underline',
        },
        legalSeparator: {
          fontSize: 11,
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

export default HomeScreen;

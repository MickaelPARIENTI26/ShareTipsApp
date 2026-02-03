import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { useProfileStore } from '../store/profile.store';
import type { RootStackParamList } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Use profile store for cached stats (no flickering on navigation)
  const stats = useProfileStore((s) => s.stats);
  const loadingStats = useProfileStore((s) => s.loading && !s.stats);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  const scrollViewRef = useRef<ScrollView>(null);

  // Hydrate profile data on mount (uses cache if available)
  useEffect(() => {
    hydrateProfile();
    fetchUnreadCount();
  }, [hydrateProfile, fetchUnreadCount]);

  const goToMyTickets = useCallback(
    () => navigation.navigate('MyTickets'),
    [navigation]
  );
  const goToFavoris = useCallback(
    () => navigation.navigate('MesFavoris'),
    [navigation]
  );
  const goToAbonnements = useCallback(
    () => navigation.navigate('MesAbonnements'),
    [navigation]
  );
  const goToWallet = useCallback(
    () => navigation.navigate('Wallet'),
    [navigation]
  );
  const goToNotifications = useCallback(
    () => navigation.navigate('Notifications'),
    [navigation]
  );
  const goToStatistiques = useCallback(
    () => navigation.navigate('Statistiques'),
    [navigation]
  );
  const goToAbonnes = useCallback(
    () => navigation.navigate('MesAbonnes'),
    [navigation]
  );
  const goToPlansAbonnement = useCallback(
    () => navigation.navigate('MesPlansAbonnement'),
    [navigation]
  );
  const goToHistorique = useCallback(
    () => navigation.navigate('Historique'),
    [navigation]
  );

  const ActionRow: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    badge?: number;
  }> = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.actionLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.actionLabel}>{label}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const StatItem: React.FC<{
    value: number | undefined;
    label: string;
    onPress?: () => void;
  }> = ({ value, label, onPress }) => (
    <TouchableOpacity
      style={styles.statItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      {loadingStats ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={styles.statValue}>{value ?? 0}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={colors.primary} />
        </View>
        <Text style={styles.username}>{user?.username ?? '—'}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatItem
            value={stats?.ticketsCreated}
            label="Tickets créés"
            onPress={goToMyTickets}
          />
          <View style={styles.statDivider} />
          <StatItem
            value={stats?.ticketsSold}
            label="Tickets vendus"
          />
          <View style={styles.statDivider} />
          <StatItem
            value={stats?.followersCount}
            label="Abonnés"
          />
        </View>

        {/* Stats Button */}
        <TouchableOpacity style={styles.statsButton} onPress={goToStatistiques} activeOpacity={0.7}>
          <Ionicons name="stats-chart" size={18} color={colors.textOnPrimary} />
          <Text style={styles.statsButtonText}>Voir les stats</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToMyTickets} activeOpacity={0.7}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="document-text" size={22} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.quickActionLabel}>Mes tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToHistorique} activeOpacity={0.7}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="key" size={22} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.quickActionLabel}>Mes accès</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToFavoris} activeOpacity={0.7}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="heart" size={22} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.quickActionLabel}>Favoris</Text>
        </TouchableOpacity>
      </View>

      {/* Réseau Section */}
      <View style={styles.networkSection}>
        <Text style={styles.sectionTitle}>Réseau</Text>
        <View style={styles.networkCard}>
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToAbonnes}
            activeOpacity={0.6}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="people" size={20} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.networkLabel}>Mes abonnés</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.networkDivider} />
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToAbonnements}
            activeOpacity={0.6}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="person-add" size={20} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.networkLabel}>Mes abonnements</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.networkDivider} />
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToPlansAbonnement}
            activeOpacity={0.6}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="pricetag" size={20} color={colors.textOnPrimary} />
              </View>
              <Text style={styles.networkLabel}>{"Mes plans d'abonnement"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Paramètres Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsCard}>
          <ActionRow icon="notifications-outline" label="Notifications" onPress={goToNotifications} badge={unreadCount} />
          <ActionRow icon="wallet-outline" label="Mon portefeuille" onPress={goToWallet} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={colors.textOnPrimary} style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
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
        scrollContent: {
          paddingBottom: 32,
        },
        header: {
          backgroundColor: colors.surface,
          paddingTop: 24,
          paddingBottom: 20,
          paddingHorizontal: 24,
          alignItems: 'center',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        avatarContainer: {
          marginBottom: 12,
        },
        username: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16,
        },
        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
        },
        statValue: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
        },
        statLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 4,
          textAlign: 'center',
        },
        statDivider: {
          width: 1,
          height: 32,
          backgroundColor: colors.separator,
        },
        statsButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 16,
          paddingVertical: 10,
          paddingHorizontal: 20,
          backgroundColor: colors.primary,
          borderRadius: 20,
        },
        statsButtonText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        quickActions: {
          flexDirection: 'row',
          marginHorizontal: 16,
          marginBottom: 16,
          gap: 10,
        },
        quickActionCard: {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          alignItems: 'center',
        },
        quickActionIcon: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        },
        quickActionLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 10,
        },
        networkSection: {
          marginHorizontal: 16,
          marginBottom: 16,
        },
        networkCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        networkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
        },
        networkRowLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        networkIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        networkLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        networkDivider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.separator,
          marginLeft: 68,
        },
        settingsSection: {
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 16,
        },
        settingsCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          overflow: 'hidden',
        },
        actionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
        actionLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        actionLabel: {
          fontSize: 16,
          color: colors.text,
        },
        badge: {
          backgroundColor: colors.danger,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 6,
          marginLeft: 8,
        },
        badgeText: {
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 'bold',
        },
        logoutButton: {
          flexDirection: 'row',
          backgroundColor: colors.danger,
          padding: 16,
          borderRadius: 12,
          marginHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        logoutIcon: {
          marginRight: 4,
        },
        logoutText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default ProfileScreen;

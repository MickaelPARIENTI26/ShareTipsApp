import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { useProfileStore } from '../store/profile.store';
import { gamificationApi } from '../api/gamification.api';
import { GamificationCard } from '../components/gamification';
import type { RootStackParamList } from '../types';
import type { UserGamificationDto } from '../types/gamification.types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const ProfileScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Use profile store for cached stats (no flickering on navigation)
  const stats = useProfileStore((s) => s.stats);
  const loadingStats = useProfileStore((s) => s.loading && !s.stats);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  const scrollViewRef = useRef<ScrollView>(null);

  // Gamification state
  const [gamification, setGamification] = useState<UserGamificationDto | null>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Hydrate profile data on mount (uses cache if available)
  useEffect(() => {
    hydrateProfile();
    fetchUnreadCount();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch gamification data and record daily login
    const loadGamification = async () => {
      try {
        await gamificationApi.recordDailyLogin();
        const { data } = await gamificationApi.getMyGamification();
        setGamification(data);
      } catch {
        // Silently fail - gamification is not critical
      }
    };
    loadGamification();
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
  const goToMyBadges = useCallback(
    () => navigation.navigate('MyBadges'),
    [navigation]
  );
  const goToXpGuide = useCallback(
    () => navigation.navigate('XpGuide'),
    [navigation]
  );

  const ActionRow: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    badge?: number;
  }> = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionLeft}>
        <View style={styles.actionIconContainer}>
          <Ionicons name={icon} size={18} color={DS.colors.green} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={DS.colors.textSecondary} />
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
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {loadingStats ? (
        <ActivityIndicator size="small" color={DS.colors.green} />
      ) : (
        <Text style={styles.statValue}>{value ?? 0}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      testID="profile-screen"
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[DS.colors.green, '#1E5C34']}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={36} color={DS.colors.white} />
          </LinearGradient>
        </View>
        <Text testID="profile-username" style={styles.username}>
          {user?.username ?? '—'}
        </Text>

        {/* Stats Row */}
        <View testID="profile-stats" style={styles.statsRow}>
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
        <TouchableOpacity style={styles.statsButton} onPress={goToStatistiques} activeOpacity={0.8}>
          <Ionicons name="stats-chart" size={18} color={DS.colors.white} />
          <Text style={styles.statsButtonText}>Voir les stats</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Gamification Card */}
      {gamification && (
        <Animated.View
          style={[
            styles.gamificationSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <GamificationCard
            gamification={gamification}
            colors={{
              primary: DS.colors.green,
              primaryBg: DS.colors.greenBgSubtle,
              surface: DS.colors.cardBg,
              text: DS.colors.white,
              textSecondary: DS.colors.textSecondary,
              textOnPrimary: DS.colors.white,
              border: DS.colors.cardBorder,
              accent: '#FBBF24',
              accentBg: 'rgba(251, 191, 36, 0.15)',
            }}
            onBadgesPress={goToMyBadges}
            onXpPress={goToXpGuide}
          />
        </Animated.View>
      )}

      {/* Quick Actions */}
      <Animated.View
        style={[
          styles.quickActions,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.quickActionCard} onPress={goToMyTickets} activeOpacity={0.8}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="document-text" size={22} color={DS.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Mes tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToHistorique} activeOpacity={0.8}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="key" size={22} color={DS.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Mes accès</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={goToFavoris} activeOpacity={0.8}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="heart" size={22} color={DS.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Favoris</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Réseau Section */}
      <Animated.View
        style={[
          styles.networkSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Réseau</Text>
        <View style={styles.networkCard}>
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToAbonnes}
            activeOpacity={0.7}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="people" size={18} color={DS.colors.white} />
              </View>
              <Text style={styles.networkLabel}>Mes abonnés</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.networkDivider} />
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToAbonnements}
            activeOpacity={0.7}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="person-add" size={18} color={DS.colors.white} />
              </View>
              <Text style={styles.networkLabel}>Mes abonnements</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.networkDivider} />
          <TouchableOpacity
            style={styles.networkRow}
            onPress={goToPlansAbonnement}
            activeOpacity={0.7}
          >
            <View style={styles.networkRowLeft}>
              <View style={styles.networkIconContainer}>
                <Ionicons name="pricetag" size={18} color={DS.colors.white} />
              </View>
              <Text style={styles.networkLabel}>{"Mes plans d'abonnement"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={DS.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Paramètres Section */}
      <Animated.View
        style={[
          styles.settingsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsCard}>
          <ActionRow icon="notifications-outline" label="Notifications" onPress={goToNotifications} badge={unreadCount} />
          <ActionRow icon="wallet-outline" label="Mon portefeuille" onPress={goToWallet} />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={DS.colors.white} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: DS.colors.cardBg,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: DS.colors.buttonBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: DS.colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: DS.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: DS.colors.cardBorder,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: DS.colors.green,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
  },
  gamificationSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DS.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.white,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  networkSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  networkCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DS.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
  },
  networkDivider: {
    height: 1,
    backgroundColor: DS.colors.cardBorder,
    marginLeft: 64,
  },
  settingsSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  settingsCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: DS.colors.white,
  },
  badge: {
    backgroundColor: '#EF4444',
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
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutIcon: {
    marginRight: 4,
  },
  logoutText: {
    color: DS.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

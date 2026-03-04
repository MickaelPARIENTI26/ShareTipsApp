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
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { useProfileStore } from '../store/profile.store';
import { useWalletStore } from '../store/wallet.store';
import { gamificationApi } from '../api/gamification.api';
import { followApi } from '../api/follow.api';
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

  // Wallet store
  const wallet = useWalletStore((s) => s.wallet);
  const walletLoading = useWalletStore((s) => s.loading);
  const walletError = useWalletStore((s) => s.error);
  const hydrateWallet = useWalletStore((s) => s.hydrate);

  const scrollViewRef = useRef<ScrollView>(null);

  // Wallet card animation
  const walletScaleAnim = useRef(new Animated.Value(1)).current;

  // Gamification state
  const [gamification, setGamification] = useState<UserGamificationDto | null>(null);

  // Follow info state
  const [followInfo, setFollowInfo] = useState<{ followerCount: number; followingCount: number } | null>(null);

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

    // Fetch follow info for current user
    const loadFollowInfo = async () => {
      if (!user?.id) return;
      try {
        const { data } = await followApi.getFollowInfo(user.id);
        setFollowInfo({
          followerCount: data.followerCount,
          followingCount: data.followingCount,
        });
      } catch {
        // Silently fail
      }
    };
    loadFollowInfo();
  }, [hydrateProfile, fetchUnreadCount, user?.id]);

  // Hydrate wallet on focus
  useFocusEffect(
    useCallback(() => {
      hydrateWallet();
    }, [hydrateWallet])
  );

  // Wallet press handlers
  const handleWalletPressIn = useCallback(() => {
    Animated.spring(walletScaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [walletScaleAnim]);

  const handleWalletPressOut = useCallback(() => {
    Animated.spring(walletScaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [walletScaleAnim]);

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
  // Performance stats (mock data for now)
  const performanceStats = {
    ranking: 42, // Not available in UserStatsDto yet
    avgOdds: stats?.avgOdds ?? 2.45,
    winRate: 67, // Not available in UserStatsDto yet
  };

  // Image picker functions
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleEditProfileImage = () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir dans la galerie', onPress: pickImageFromGallery },
        { text: 'Annuler', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

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
        <TouchableOpacity style={styles.avatarContainer} onPress={handleEditProfileImage} activeOpacity={0.8}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[DS.colors.green, '#1E5C34']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={36} color={DS.colors.white} />
            </LinearGradient>
          )}
          {/* Edit badge */}
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color={DS.colors.white} />
          </View>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.statItem} activeOpacity={1}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={DS.colors.green} />
            ) : (
              <View style={styles.premiumValueRow}>
                <Text style={styles.statValue}>{0}</Text>
                <Text style={styles.crownIcon}>👑</Text>
              </View>
            )}
            <Text style={styles.statLabel}>Membres Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Followers/Following Row with Stats Button */}
        <View style={styles.followSection}>
          <TouchableOpacity style={styles.followItem} onPress={goToAbonnes} activeOpacity={0.7}>
            {!followInfo ? (
              <ActivityIndicator size="small" color={DS.colors.green} />
            ) : (
              <Text style={styles.followValue}>{followInfo.followerCount}</Text>
            )}
            <Text style={styles.followLabel}>Abonnés</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statsButton} onPress={goToStatistiques} activeOpacity={0.8}>
            <Ionicons name="stats-chart" size={18} color={DS.colors.white} />
            <Text style={styles.statsButtonText}>Voir les stats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.followItem} onPress={goToAbonnements} activeOpacity={0.7}>
            {!followInfo ? (
              <ActivityIndicator size="small" color={DS.colors.green} />
            ) : (
              <Text style={styles.followValue}>{followInfo.followingCount}</Text>
            )}
            <Text style={styles.followLabel}>Suivis</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Wallet Card */}
      <Animated.View
        style={[
          styles.walletCardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: walletScaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.walletCardOuter}
          onPress={goToWallet}
          onPressIn={handleWalletPressIn}
          onPressOut={handleWalletPressOut}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={[DS.colors.green, '#1E5C34']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            {/* Decorative pattern overlay */}
            <View style={styles.walletPattern}>
              <View style={styles.walletPatternCircle1} />
              <View style={styles.walletPatternCircle2} />
            </View>

            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet" size={18} color={DS.colors.white} />
            </View>
            <View style={styles.walletContent}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletLabel}>Solde disponible</Text>
                <View style={styles.walletChevron}>
                  <Ionicons name="chevron-forward" size={14} color={DS.colors.white} />
                </View>
              </View>
              {walletLoading ? (
                <View style={styles.walletLoadingContainer}>
                  <ActivityIndicator size="small" color={DS.colors.white} />
                  <Text style={styles.walletLoadingText}>Chargement...</Text>
                </View>
              ) : walletError ? (
                <View style={styles.walletErrorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={DS.colors.white} />
                  <Text style={styles.walletErrorText}>{walletError}</Text>
                  <Text style={styles.walletRetryText}>Appuyez pour réessayer</Text>
                </View>
              ) : (
                <View style={styles.walletAmountRow}>
                  <Text style={styles.walletAmount}>
                    {wallet?.availableBalance?.toFixed(2) ?? '0.00'}
                  </Text>
                  <Text style={styles.walletUnit}>EUR</Text>
                </View>
              )}
              {wallet && !walletLoading && !walletError && wallet.pendingPayout > 0 && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="time-outline" size={12} color="#FBBF24" />
                  <Text style={styles.walletLocked}>
                    {wallet.pendingPayout.toFixed(2)} EUR en virement
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Performance Stats Card */}
      <Animated.View
        style={[
          styles.performanceStatsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.performanceStatsRow}>
          <View style={styles.performanceStatColumn}>
            <Ionicons name="trophy-outline" size={20} color="#FBBF24" />
            <Text style={styles.performanceStatValue}>#{performanceStats.ranking}</Text>
            <Text style={styles.performanceStatLabel}>Classement</Text>
          </View>
          <View style={styles.performanceStatDivider} />
          <View style={styles.performanceStatColumn}>
            <Ionicons name="stats-chart-outline" size={20} color={DS.colors.green} />
            <Text style={styles.performanceStatValue}>{performanceStats.avgOdds.toFixed(2)}</Text>
            <Text style={styles.performanceStatLabel}>Cote moy.</Text>
          </View>
          <View style={styles.performanceStatDivider} />
          <View style={styles.performanceStatColumn}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
            <Text style={styles.performanceStatValue}>{performanceStats.winRate}%</Text>
            <Text style={styles.performanceStatLabel}>Réussite</Text>
          </View>
        </View>
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
            <Ionicons name="receipt" size={22} color={DS.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Mes achats</Text>
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
            style={[styles.networkRow, styles.networkRowLast]}
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
    position: 'relative',
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: DS.colors.green,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DS.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DS.colors.cardBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
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
  premiumValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crownIcon: {
    fontSize: 14,
  },
  followSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  followItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  followValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DS.colors.white,
  },
  followLabel: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },

  // Wallet Card
  walletCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  walletCardOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  walletPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  walletPatternCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  walletPatternCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  walletIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  walletContent: {
    flex: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  walletChevron: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: DS.colors.white,
    letterSpacing: -0.5,
  },
  walletUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  walletLocked: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  walletLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletLoadingText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  walletErrorContainer: {
    gap: 4,
  },
  walletErrorText: {
    fontSize: 14,
    color: DS.colors.white,
    opacity: 0.9,
  },
  walletRetryText: {
    fontSize: 12,
    color: DS.colors.white,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },

  // Performance Stats Card
  performanceStatsCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 10,
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
  performanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  performanceStatColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
  },
  performanceStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
    marginTop: 4,
  },
  performanceStatLabel: {
    fontSize: 10,
    color: DS.colors.textSecondary,
    marginTop: 1,
  },
  performanceStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: DS.colors.cardBorder,
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
  networkRowLast: {
    borderBottomWidth: 0,
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

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import type { RootStackParamList } from '../../types';
import { DS } from '../../theme/designSystem';
import { PrimaryRefreshControl } from '../../components/common';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Global wallet store
  const wallet = useWalletStore((s) => s.wallet);
  const loading = useWalletStore((s) => s.loading);
  const error = useWalletStore((s) => s.error);
  const hydrateWallet = useWalletStore((s) => s.hydrate);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const walletScaleAnim = useRef(new Animated.Value(1)).current;
  const settingsScaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      hydrateWallet();
    }, [hydrateWallet])
  );

  // Entrance animation
  useEffect(() => {
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  }, [refreshWallet]);

  // Press handlers with animations
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

  const handleSettingsPressIn = useCallback(() => {
    Animated.spring(settingsScaleAnim, {
      toValue: 0.9,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [settingsScaleAnim]);

  const handleSettingsPressOut = useCallback(() => {
    Animated.spring(settingsScaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [settingsScaleAnim]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <PrimaryRefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          icon="home"
        />
      }
    >
      {/* User info card */}
      <Animated.View
        style={[
          styles.userCardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <LinearGradient
              colors={[DS.colors.green, '#1E5C34']}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={28} color={DS.colors.white} />
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Bienvenue</Text>
            <Text style={styles.username}>{user?.username ?? '—'}</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: settingsScaleAnim }] }}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => rootNavigation.navigate('MainTabs', { screen: 'Profile' })}
              onPressIn={handleSettingsPressIn}
              onPressOut={handleSettingsPressOut}
              activeOpacity={0.9}
            >
              <Ionicons name="settings-outline" size={22} color={DS.colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Wallet card */}
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
          onPress={() => rootNavigation.navigate('Wallet')}
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
              <Ionicons name="wallet" size={26} color={DS.colors.white} />
            </View>
            <View style={styles.walletContent}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletLabel}>Solde disponible</Text>
                <View style={styles.walletChevron}>
                  <Ionicons name="chevron-forward" size={18} color={DS.colors.white} />
                </View>
              </View>
              {loading ? (
                <View style={styles.walletLoadingContainer}>
                  <ActivityIndicator size="small" color={DS.colors.white} />
                  <Text style={styles.walletLoadingText}>Chargement...</Text>
                </View>
              ) : error ? (
                <View style={styles.walletErrorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={DS.colors.white} />
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.retryText}>Appuyez pour réessayer</Text>
                </View>
              ) : (
                <View style={styles.walletAmountRow}>
                  <Text style={styles.walletAmount}>
                    {wallet?.availableBalance?.toFixed(2) ?? '0.00'}
                  </Text>
                  <Text style={styles.walletUnit}>EUR</Text>
                </View>
              )}
              {wallet && !loading && !error && wallet.pendingPayout > 0 && (
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

      {/* How it works banner */}
      <Animated.View
        style={[
          styles.howItWorksBanner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.howItWorksContent}
          onPress={() => rootNavigation.navigate('HowItWorks')}
          activeOpacity={0.8}
        >
          <View style={styles.howItWorksIcon}>
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              style={styles.howItWorksIconGradient}
            >
              <Ionicons name="bulb" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.howItWorksTextContainer}>
            <Text style={styles.howItWorksTitle}>Comment ça marche ?</Text>
            <Text style={styles.howItWorksSubtitle}>Découvrez ShareTips en quelques étapes</Text>
          </View>
          <View style={styles.howItWorksArrow}>
            <Ionicons name="chevron-forward" size={20} color="#FBBF24" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Actions Section */}
      <Animated.View
        style={[
          styles.actionsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flash" size={14} color={DS.colors.green} />
            </View>
            <Text style={styles.sectionTitle}>Raccourcis</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <ActionButton
            icon="receipt-outline"
            label="Mes tickets"
            subtitle="Voir mes pronostics"
            onPress={() => rootNavigation.navigate('MyTickets')}
          />
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View
        style={[
          styles.disclaimer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.disclaimerIconContainer}>
          <Ionicons name="information-circle" size={18} color={DS.colors.textSecondary} />
        </View>
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerText}>
            ShareTips est une plateforme de partage de pronostics. Nous ne proposons pas de paris et ne garantissons aucun résultat. Vous restez seul responsable de vos décisions.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('CGU')}
              activeOpacity={0.7}
              style={styles.legalLinkBtn}
            >
              <Text style={styles.legalLink}>CGU</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('CGV')}
              activeOpacity={0.7}
              style={styles.legalLinkBtn}
            >
              <Text style={styles.legalLink}>CGV</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => rootNavigation.navigate('PrivacyPolicy')}
              activeOpacity={0.7}
              style={styles.legalLinkBtn}
            >
              <Text style={styles.legalLink}>Confidentialité</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, subtitle, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.actionIconContainer}>
          <View style={styles.actionIconGradient}>
            <Ionicons name={icon} size={24} color={DS.colors.green} />
          </View>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionLabel}>{label}</Text>
          {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actionChevron}>
          <Ionicons name="chevron-forward" size={20} color={DS.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // User Card
  userCardWrapper: {
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    padding: 16,
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
  avatar: {
    marginRight: 12,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
        elevation: 4,
      },
    }),
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.textSecondary,
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: DS.colors.white,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DS.colors.buttonBorder,
  },

  // Wallet Card
  walletCardWrapper: {
    marginBottom: 16,
  },
  walletCardOuter: {
    borderRadius: 16,
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
    borderRadius: 16,
    padding: 20,
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
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  walletPatternCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  walletChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 36,
    fontWeight: '800',
    color: DS.colors.white,
    letterSpacing: -1,
  },
  walletUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  walletLocked: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
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
  errorText: {
    fontSize: 14,
    color: DS.colors.white,
    opacity: 0.9,
  },
  retryText: {
    fontSize: 12,
    color: DS.colors.white,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },

  // How it works banner
  howItWorksBanner: {
    marginBottom: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  howItWorksContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  howItWorksIcon: {
    marginRight: 12,
  },
  howItWorksIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksTextContainer: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
  howItWorksSubtitle: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  howItWorksArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions Section
  actionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionIconContainer: {
    marginRight: 12,
  },
  actionIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 1,
    borderColor: 'rgba(45, 140, 78, 0.2)',
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
  actionSubtitle: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  actionChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  disclaimerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerText: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  legalLinkBtn: {
    paddingVertical: 2,
  },
  legalLink: {
    fontSize: 12,
    color: DS.colors.green,
    fontWeight: '600',
  },
  legalSeparator: {
    fontSize: 12,
    color: DS.colors.textSecondary,
  },
});

export default HomeScreen;

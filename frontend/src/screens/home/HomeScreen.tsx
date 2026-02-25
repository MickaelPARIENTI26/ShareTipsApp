import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
import { BlurView } from 'expo-blur';

import { useAuthStore } from '../../store/auth.store';
import { useWalletStore } from '../../store/wallet.store';
import type { RootStackParamList } from '../../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGradients,
  effectGlass,
  effectShadows,
  springConfigs,
} from '../../theme';
import { useDashboardEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { PrimaryRefreshControl } from '../../components/common';

const HomeScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
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

  // Entrance animations for dashboard sections (5 sections: user, wallet, howItWorks, actions, disclaimer)
  const { animatedStyles: entranceStyles, triggerEntrance, reset: resetEntrance } = useDashboardEntranceAnimation(5);

  // Animations
  const walletScaleAnim = useRef(new Animated.Value(1)).current;
  const settingsScaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      hydrateWallet();
    }, [hydrateWallet])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    resetEntrance();
    await refreshWallet();
    setRefreshing(false);
    triggerEntrance();
  }, [refreshWallet, resetEntrance, triggerEntrance]);

  // Press handlers with animations
  const handleWalletPressIn = useCallback(() => {
    Animated.spring(walletScaleAnim, {
      toValue: 0.98,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [walletScaleAnim]);

  const handleWalletPressOut = useCallback(() => {
    Animated.spring(walletScaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [walletScaleAnim]);

  const handleSettingsPressIn = useCallback(() => {
    Animated.spring(settingsScaleAnim, {
      toValue: 0.9,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [settingsScaleAnim]);

  const handleSettingsPressOut = useCallback(() => {
    Animated.spring(settingsScaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
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
      {/* User info card with glassmorphism */}
      <Animated.View style={[styles.userCardWrapper, entranceStyles[0]]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={styles.userCardBlur}>
            <View style={styles.userCardContent}>
              <View style={styles.avatar}>
                <LinearGradient
                  colors={effectGradients.primary.colors}
                  start={effectGradients.primary.start}
                  end={effectGradients.primary.end}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={28} color={colors.textOnPrimary} />
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
                  <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </BlurView>
        ) : (
          <LinearGradient
            colors={effectGradients.cardGlass.colors}
            start={effectGradients.cardGlass.start}
            end={effectGradients.cardGlass.end}
            style={styles.userCard}
          >
            <View style={styles.avatar}>
              <LinearGradient
                colors={effectGradients.primary.colors}
                start={effectGradients.primary.start}
                end={effectGradients.primary.end}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={28} color={colors.textOnPrimary} />
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
                <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        )}
      </Animated.View>

      {/* Wallet card — premium gradient with glow */}
      <Animated.View style={[styles.walletCardWrapper, entranceStyles[1], { transform: [{ scale: walletScaleAnim }] }]}>
        <TouchableOpacity
          style={styles.walletCardOuter}
          onPress={() => rootNavigation.navigate('Wallet')}
          onPressIn={handleWalletPressIn}
          onPressOut={handleWalletPressOut}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={effectGradients.primary.colors}
            start={effectGradients.primary.start}
            end={effectGradients.primary.end}
            style={styles.walletCard}
          >
            {/* Decorative pattern overlay */}
            <View style={styles.walletPattern}>
              <View style={styles.walletPatternCircle1} />
              <View style={styles.walletPatternCircle2} />
            </View>

            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet" size={26} color={colors.textOnPrimary} />
            </View>
            <View style={styles.walletContent}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletLabel}>Solde disponible</Text>
                <View style={styles.walletChevron}>
                  <Ionicons name="chevron-forward" size={18} color={colors.textOnPrimary} />
                </View>
              </View>
              {loading ? (
                <View style={styles.walletLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  <Text style={styles.walletLoadingText}>Chargement...</Text>
                </View>
              ) : error ? (
                <View style={styles.walletErrorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.textOnPrimary} />
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
                  <Ionicons name="time-outline" size={12} color={colors.accent} />
                  <Text style={styles.walletLocked}>
                    {wallet.pendingPayout.toFixed(2)} EUR en virement
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* How it works banner — accent gradient */}
      <Animated.View style={entranceStyles[2]}>
        <TouchableOpacity
          style={styles.howItWorksBanner}
          onPress={() => rootNavigation.navigate('HowItWorks')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.howItWorksGradient}
          >
            <View style={styles.howItWorksIcon}>
              <LinearGradient
                colors={effectGradients.accent.colors}
                start={effectGradients.accent.start}
                end={effectGradients.accent.end}
                style={styles.howItWorksIconGradient}
              >
                <Ionicons name="bulb" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>Comment ça marche ?</Text>
              <Text style={styles.howItWorksSubtitle}>Découvrez ShareTips en quelques étapes</Text>
            </View>
            <View style={styles.howItWorksArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Actions Section */}
      <Animated.View style={[styles.actionsSection, entranceStyles[3]]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flash" size={14} color={colors.primary} />
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
            colors={colors}
            styles={styles}
          />
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View style={[styles.disclaimer, entranceStyles[4]]}>
        <View style={styles.disclaimerIconContainer}>
          <Ionicons name="information-circle" size={18} color={colors.textTertiary} />
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

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, subtitle, onPress, colors, styles }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      ...springConfigs.bouncy,
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
          <LinearGradient
            colors={[`${colors.primary}20`, `${colors.primary}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionIconGradient}
          >
            <Ionicons name={icon} size={24} color={colors.primary} />
          </LinearGradient>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionLabel}>{label}</Text>
          {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actionChevron}>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
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
        content: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xxl + 80, // Extra padding for tab bar
        },

        // User Card
        userCardWrapper: {
          marginBottom: spacing.lg,
          borderRadius: radius.xl,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        userCardBlur: {
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.card.borderColor,
        },
        userCardContent: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.lg,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        userCard: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: effectGlass.card.borderColor,
        },
        avatar: {
          marginRight: spacing.md,
        },
        avatarGradient: {
          width: 56,
          height: 56,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
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
          ...typography.caption,
          color: colors.textSecondary,
          letterSpacing: 0.5,
        },
        username: {
          ...typography.h3,
          color: colors.text,
          marginTop: spacing.xxs,
          fontWeight: '700',
        },
        settingsBtn: {
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },

        // Wallet Card
        walletCardWrapper: {
          marginBottom: spacing.lg,
        },
        walletCardOuter: {
          borderRadius: radius.xl,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
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
          borderRadius: radius.xl,
          padding: spacing.xl,
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
          borderRadius: radius.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.lg,
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
          marginBottom: spacing.sm,
        },
        walletLabel: {
          ...typography.caption,
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        walletChevron: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        walletAmountRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: spacing.sm,
        },
        walletAmount: {
          fontSize: 36,
          fontWeight: '800',
          color: colors.textOnPrimary,
          letterSpacing: -1,
        },
        walletUnit: {
          ...typography.body,
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        walletLocked: {
          ...typography.caption,
          color: colors.accent,
          fontWeight: '600',
        },
        pendingBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.accentBg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
          alignSelf: 'flex-start',
          marginTop: spacing.md,
        },
        walletLoadingContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        walletLoadingText: {
          ...typography.body,
          color: 'rgba(255, 255, 255, 0.8)',
        },
        walletErrorContainer: {
          gap: spacing.xs,
        },
        errorText: {
          ...typography.bodySmall,
          color: colors.textOnPrimary,
          opacity: 0.9,
        },
        retryText: {
          ...typography.caption,
          color: colors.textOnPrimary,
          opacity: 0.7,
          textDecorationLine: 'underline',
        },

        // How it works banner
        howItWorksBanner: {
          marginBottom: spacing.xl,
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: `${colors.accent}25`,
          ...Platform.select({
            ios: {
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        howItWorksGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.lg,
        },
        howItWorksIcon: {
          marginRight: spacing.md,
        },
        howItWorksIconGradient: {
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        howItWorksContent: {
          flex: 1,
        },
        howItWorksTitle: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        howItWorksSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xxs,
        },
        howItWorksArrow: {
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: `${colors.accent}15`,
          alignItems: 'center',
          justifyContent: 'center',
        },

        // Actions Section
        actionsSection: {
          marginBottom: spacing.xl,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        sectionTitleContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        sectionIcon: {
          width: 24,
          height: 24,
          borderRadius: radius.sm,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sectionTitle: {
          ...typography.label,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        actions: {
          gap: spacing.md,
        },
        actionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
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
          marginRight: spacing.md,
        },
        actionIconGradient: {
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${colors.primary}15`,
        },
        actionContent: {
          flex: 1,
        },
        actionLabel: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        actionSubtitle: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xxs,
        },
        actionChevron: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },

        // Disclaimer
        disclaimer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
        },
        disclaimerIconContainer: {
          width: 32,
          height: 32,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        disclaimerContent: {
          flex: 1,
        },
        disclaimerText: {
          ...typography.caption,
          fontSize: 12,
          color: colors.textTertiary,
          lineHeight: 18,
        },
        legalLinks: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        legalLinkBtn: {
          paddingVertical: spacing.xxs,
        },
        legalLink: {
          ...typography.caption,
          fontSize: 12,
          color: colors.primary,
          fontWeight: '600',
        },
        legalSeparator: {
          ...typography.caption,
          fontSize: 12,
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

export default HomeScreen;

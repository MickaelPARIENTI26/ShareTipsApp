import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import {
  useTheme,
  darkColors,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectShadows,
  effectGlass,
} from '../theme';
import type { AuthStackParamList } from '../types';
import { SportyBackground, SportyButton } from '../components/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// ─────────────────────────────────────────────────────────────
// Feature Row Component
// ─────────────────────────────────────────────────────────────

interface FeatureRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  highlight: boolean;
  index: number;
  total: number;
  colors: ThemeColors;
  animValue: Animated.Value;
}

const FeatureRow: React.FC<FeatureRowProps> = React.memo(({
  icon,
  text,
  highlight,
  index,
  total,
  colors,
  animValue,
}) => {
  const styles = useFeatureStyles(colors);

  return (
    <Animated.View
      style={[
        styles.featureRow,
        index < total - 1 && styles.featureRowBorder,
        {
          opacity: animValue,
          transform: [{
            translateX: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          }],
        },
      ]}
    >
      <LinearGradient
        colors={highlight
          ? [colors.accent, `${colors.accent}CC`]
          : [colors.primary, colors.primaryLight]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIconContainer}
      >
        <Ionicons
          name={icon}
          size={20}
          color="#FFFFFF"
        />
      </LinearGradient>
      <Text style={styles.featureText}>{text}</Text>
      <View style={styles.checkmarkWrapper}>
        <Ionicons name="checkmark" size={14} color={colors.primary} />
      </View>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Trust Badge Component
// ─────────────────────────────────────────────────────────────

interface TrustBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  variant: 'primary' | 'success';
  colors: ThemeColors;
}

const TrustBadge: React.FC<TrustBadgeProps> = React.memo(({
  icon,
  text,
  variant,
  colors,
}) => {
  const styles = useTrustStyles(colors);

  return (
    <View style={styles.trustBadge}>
      <LinearGradient
        colors={variant === 'success'
          ? [colors.success, `${colors.success}CC`]
          : [`${colors.primary}60`, `${colors.primary}40`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.trustIconWrapper}
      >
        <Ionicons
          name={icon}
          size={12}
          color={variant === 'success' ? '#FFFFFF' : colors.primary}
        />
      </LinearGradient>
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  // Fallback to darkColors if theme context fails to load
  const colors = theme?.colors ?? darkColors;
  const isDark = theme?.isDark ?? true;
  const styles = useStyles(colors);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const feature1Opacity = useRef(new Animated.Value(0)).current;
  const feature2Opacity = useRef(new Animated.Value(0)).current;
  const feature3Opacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      // Title animation
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Features animation - staggered
      Animated.parallel([
        Animated.timing(featuresOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.stagger(100, [
          Animated.timing(feature1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(feature2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(feature3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ]),
      // Buttons animation
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Glow pulse animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => glowLoop.stop();
  }, []);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_wbg.png');

  const features = [
    { icon: 'shield-checkmark-outline' as const, text: 'Gratuit et sécurisé', highlight: false },
    { icon: 'flash-outline' as const, text: 'Inscription en 30 secondes', highlight: true },
    { icon: 'people-outline' as const, text: 'Rejoins +10 000 parieurs', highlight: false },
  ];

  const featureAnimValues = [feature1Opacity, feature2Opacity, feature3Opacity];

  const GlassContainer = Platform.OS === 'ios' ? BlurView : View;
  const glassProps = Platform.OS === 'ios'
    ? { intensity: 20, tint: 'dark' as const }
    : {};

  return (
    <SportyBackground>
      <SafeAreaView style={styles.container}>
        {/* Top Section - Logo & Welcome */}
        <View style={styles.topSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Animated glow behind logo */}
            <Animated.View style={[styles.logoGlowOuter, { opacity: glowPulse }]}>
              <LinearGradient
                colors={[`${colors.primary}00`, `${colors.primary}40`, `${colors.primary}00`]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.logoGlowGradient}
              />
            </Animated.View>
            <View style={styles.logoGlow}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslate }],
              },
            ]}
          >
            <View style={styles.titleBadge}>
              <LinearGradient
                colors={[`${colors.primary}40`, `${colors.primary}20`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleBadgeGradient}
              >
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.titleBadgeText}>ShareTips</Text>
              </LinearGradient>
            </View>
            <Text style={styles.welcomeTitle}>
              Prêt à faire tes pronostics ?
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Pas besoin d'être expert pour commencer
            </Text>
          </Animated.View>
        </View>

        {/* Middle Section - Features */}
        <Animated.View style={[styles.featuresSection, { opacity: featuresOpacity }]}>
          <GlassContainer {...glassProps} style={styles.featuresCard}>
            {Platform.OS === 'android' && (
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.06)']}
                style={StyleSheet.absoluteFill}
              />
            )}
            {features.map((feature, index) => (
              <FeatureRow
                key={index}
                icon={feature.icon}
                text={feature.text}
                highlight={feature.highlight}
                index={index}
                total={features.length}
                colors={colors}
                animValue={featureAnimValues[index]}
              />
            ))}
          </GlassContainer>
        </Animated.View>

        {/* Bottom Section - Buttons */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslate }],
            },
          ]}
        >
          <SportyButton
            testID="login-button"
            title="Connexion"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            icon="log-in-outline"
          />

          <View style={styles.buttonSpacer} />

          <SportyButton
            testID="register-button"
            title="Créer un compte"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            icon="person-add-outline"
          />

          {/* Trust badges */}
          <GlassContainer {...glassProps} style={styles.trustBadges}>
            {Platform.OS === 'android' && (
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <TrustBadge
              icon="lock-closed"
              text="Données protégées"
              variant="primary"
              colors={colors}
            />
            <View style={styles.trustDivider} />
            <TrustBadge
              icon="checkmark-circle"
              text="100% gratuit"
              variant="success"
              colors={colors}
            />
          </GlassContainer>

          {/* Version hint */}
          <Text style={styles.versionText}>v1.0 • Fait avec ❤️ en France</Text>
        </Animated.View>
      </SafeAreaView>
    </SportyBackground>
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
          paddingHorizontal: spacing.lg,
        },
        topSection: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: spacing.md,
        },
        logoContainer: {
          marginBottom: spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
        },
        logoGlowOuter: {
          position: 'absolute',
          width: 300,
          height: 120,
          top: -17,
        },
        logoGlowGradient: {
          flex: 1,
          borderRadius: radius.full,
        },
        logoGlow: {
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 25,
            },
            android: {},
          }),
        },
        logo: {
          width: 260,
          height: 92,
        },
        titleContainer: {
          alignItems: 'center',
        },
        titleBadge: {
          marginBottom: spacing.md,
        },
        titleBadgeGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: `${colors.primary}40`,
        },
        titleBadgeText: {
          ...typography.caption,
          color: colors.primary,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        welcomeTitle: {
          ...typography.h2,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: spacing.sm,
          letterSpacing: 0.3,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        },
        welcomeSubtitle: {
          ...typography.body,
          color: 'rgba(255, 255, 255, 0.75)',
          textAlign: 'center',
          lineHeight: 24,
          maxWidth: 280,
        },

        // Features section
        featuresSection: {
          paddingVertical: spacing.md,
        },
        featuresCard: {
          borderRadius: radius.xl,
          padding: spacing.sm,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.borderColor,
          ...effectShadows.lg,
        },

        // Bottom section
        bottomSection: {
          paddingBottom: spacing.md,
        },
        buttonSpacer: {
          height: spacing.md,
        },
        trustBadges: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.xl,
          borderRadius: radius.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          alignSelf: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
        },
        trustDivider: {
          width: 1,
          height: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        },
        versionText: {
          ...typography.caption,
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          marginTop: spacing.lg,
          fontSize: 11,
        },
      }),
    [colors]
  );

const useFeatureStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        featureRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
        },
        featureRowBorder: {
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        },
        featureIconContainer: {
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          ...effectShadows.md,
        },
        featureText: {
          ...typography.body,
          flex: 1,
          color: '#FFFFFF',
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        checkmarkWrapper: {
          width: 24,
          height: 24,
          borderRadius: radius.full,
          backgroundColor: `${colors.primary}30`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${colors.primary}50`,
        },
      }),
    [colors]
  );

const useTrustStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        trustBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        trustIconWrapper: {
          width: 24,
          height: 24,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        trustText: {
          ...typography.caption,
          color: 'rgba(255, 255, 255, 0.85)',
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default WelcomeScreen;

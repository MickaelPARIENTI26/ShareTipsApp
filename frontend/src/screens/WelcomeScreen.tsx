import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../theme';
import type { AuthStackParamList } from '../types';
import { SportyBackground, SportyButton } from '../components/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useStyles(colors);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;

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
      // Features animation
      Animated.timing(featuresOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Buttons animation
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_wbg.png'); // Use white logo on sporty background

  const features = [
    { icon: 'shield-checkmark-outline' as const, text: 'Gratuit et sécurisé' },
    { icon: 'flash-outline' as const, text: 'Inscription en 30 secondes' },
    { icon: 'people-outline' as const, text: 'Rejoins +10 000 parieurs' },
  ];

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
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            }}
          >
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
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
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
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
              <Text style={styles.trustText}>Données protégées</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.trustText}>100% gratuit</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </SportyBackground>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: 24,
        },
        topSection: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 20,
        },
        logoContainer: {
          marginBottom: 32,
        },
        logo: {
          width: 240,
          height: 85,
        },
        welcomeTitle: {
          fontSize: 26,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: 0.3,
        },
        welcomeSubtitle: {
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        },
        featuresSection: {
          paddingVertical: 24,
          gap: 16,
        },
        featureRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        featureIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: 'rgba(46, 204, 113, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        featureText: {
          fontSize: 15,
          color: colors.text,
          fontWeight: '500',
        },
        bottomSection: {
          paddingBottom: 24,
        },
        buttonSpacer: {
          height: 12,
        },
        trustBadges: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 24,
          marginTop: 20,
        },
        trustBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        trustText: {
          fontSize: 12,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

export default WelcomeScreen;

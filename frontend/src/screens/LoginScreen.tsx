import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { useTheme, darkColors, type ThemeColors, spacing, radius, typography, fontWeight, palette, size } from '../theme';
import type { AuthStackParamList } from '../types';
import { validateEmail, validateLoginPassword, isFormValid } from '../utils/validation';
import { SportyBackground, SportyInput, SportyButton } from '../components/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, login, clearError } = useAuthStore();
  const theme = useTheme();
  // Fallback to darkColors if theme context fails to load
  const colors = theme?.colors ?? darkColors;
  const isDark = theme?.isDark ?? true;
  const styles = useStyles(colors);

  // Ref for password input focus navigation
  const passwordRef = useRef<TextInputType>(null);

  // Animation values
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const emailValidation = validateEmail(email);
  const passwordValidation = validateLoginPassword(password);
  const formValid = isFormValid(emailValidation, passwordValidation);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_wbg.png');

  const handleLogin = async () => {
    if (!formValid) return;
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // error is set in the store
    }
  };

  const handleEmailChange = (value: string) => {
    if (error) clearError();
    setEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    if (error) clearError();
    setPassword(value);
  };

  return (
    <SportyBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Header */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            <Text style={styles.title}>Bon retour !</Text>
            <Text style={styles.subtitle}>
              Connecte-toi pour retrouver tes pronostics
            </Text>
          </Animated.View>

          {/* Error Box */}
          {error && (
            <Animated.View style={[styles.errorBox, { opacity: formOpacity }]}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            <SportyInput
              testID="email-input"
              placeholder="Email"
              icon="mail-outline"
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={email.length > 0 && !emailValidation.isValid ? emailValidation.error : undefined}
              accessibilityLabel="Adresse email"
              accessibilityHint="Entrez votre adresse email"
            />

            <SportyInput
              testID="password-input"
              inputRef={passwordRef}
              placeholder="Mot de passe"
              icon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={handlePasswordChange}
              textContentType="password"
              autoComplete="password"
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={password.length > 0 && !passwordValidation.isValid ? passwordValidation.error : undefined}
              accessibilityLabel="Mot de passe"
              accessibilityHint="Entrez votre mot de passe"
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              style={styles.forgotPasswordContainer}
              accessibilityLabel="Mot de passe oublié"
              accessibilityRole="link"
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <View style={styles.buttonContainer}>
              <SportyButton
                testID="login-submit-button"
                title="Se connecter"
                onPress={handleLogin}
                disabled={!formValid}
                loading={loading}
                icon="log-in-outline"
                accessibilityLabel="Se connecter"
                accessibilityHint="Appuyez pour vous connecter"
              />
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login - Placeholder for future */}
            <TouchableOpacity style={styles.socialButton} disabled>
              <Ionicons name="logo-google" size={20} color={colors.textSecondary} />
              <Text style={styles.socialButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              accessibilityLabel="Créer un compte"
              accessibilityRole="link"
            >
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Trust indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.trustText}>Connexion sécurisée</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SportyBackground>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        flex: {
          flex: 1,
        },
        container: {
          flexGrow: 1,
          padding: spacing.xl,
          paddingTop: size.auth.paddingTop,
        },
        backButton: {
          width: size.auth.backButtonSize,
          height: size.auth.backButtonSize,
          borderRadius: radius.base,
          backgroundColor: palette.white + '1A',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.base,
        },
        logoContainer: {
          alignItems: 'center',
          marginBottom: spacing.xl,
        },
        logo: {
          width: size.auth.logoWidth,
          height: size.auth.logoHeight,
        },
        headerContainer: {
          marginBottom: spacing.xl,
        },
        title: {
          ...typography.h1,
          color: palette.white,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        subtitle: {
          ...typography.body,
          color: palette.white + 'B3',
          textAlign: 'center',
          lineHeight: 22,
        },
        errorBox: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.dangerBg,
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: radius.base,
          padding: spacing['md+'],
          marginBottom: spacing.lg,
          gap: spacing['sm+'],
        },
        errorText: {
          flex: 1,
          color: colors.danger,
          ...typography.bodySmall,
        },
        formContainer: {
          marginBottom: spacing.xl,
        },
        forgotPasswordContainer: {
          alignSelf: 'flex-end',
          marginBottom: spacing.xl,
          marginTop: -spacing.sm,
        },
        forgotPasswordText: {
          color: colors.primary,
          ...typography.bodySmall,
          fontWeight: fontWeight.medium,
        },
        buttonContainer: {
          marginBottom: spacing.xl,
        },
        divider: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: palette.white + '26',
        },
        dividerText: {
          color: colors.textSecondary,
          ...typography.caption,
          marginHorizontal: spacing.base,
        },
        socialButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.white + '14',
          borderRadius: radius.lg,
          paddingVertical: spacing.base,
          gap: spacing['sm+'],
          opacity: 0.5,
        },
        socialButtonText: {
          color: colors.textSecondary,
          ...typography.body,
          fontWeight: fontWeight.medium,
        },
        registerContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing['2xs'],
          marginTop: 'auto',
          paddingTop: spacing.base,
        },
        registerText: {
          color: colors.textSecondary,
          ...typography.bodySmall,
        },
        registerLink: {
          color: colors.primary,
          ...typography.bodySmall,
          fontWeight: fontWeight.semibold,
        },
        trustIndicators: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: spacing.base,
          paddingBottom: spacing.sm,
        },
        trustItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['2xs'],
        },
        trustText: {
          color: colors.textSecondary,
          ...typography.caption,
        },
      }),
    [colors]
  );

export default LoginScreen;

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
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateDateOfBirth,
  dateToISOFormat,
  isFormValid,
} from '../utils/validation';
import { SportyBackground, SportyInput, SportyButton } from '../components/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptedCGV, setAcceptedCGV] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    dateOfBirth: false,
  });
  const { loading, error, register, clearError } = useAuthStore();
  const theme = useTheme();
  // Fallback to darkColors if theme context fails to load
  const colors = theme?.colors ?? darkColors;
  const isDark = theme?.isDark ?? true;
  const styles = useStyles(colors);

  // Refs for input focus navigation
  const emailRef = useRef<TextInputType>(null);
  const passwordRef = useRef<TextInputType>(null);
  const confirmPasswordRef = useRef<TextInputType>(null);
  const dateOfBirthRef = useRef<TextInputType>(null);

  // Animation values
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const usernameValidation = validateUsername(username);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const confirmValidation = validatePasswordMatch(password, confirmPassword);
  const dobValidation = validateDateOfBirth(dateOfBirth);
  const fieldsValid = isFormValid(usernameValidation, emailValidation, passwordValidation, confirmValidation, dobValidation);
  const formValid = fieldsValid && acceptedCGV;

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_wbg.png');

  const handleRegister = async () => {
    if (!formValid) return;
    try {
      const dobISO = dateToISOFormat(dateOfBirth);
      await register(email.trim().toLowerCase(), username.trim(), password, dobISO);
    } catch {
      // error is set in the store
    }
  };

  // Format date input with slashes as user types
  const handleDateChange = (text: string) => {
    if (error) clearError();

    // Remove non-digit characters
    let digits = text.replace(/\D/g, '');

    // Limit to 8 digits (DDMMYYYY)
    digits = digits.slice(0, 8);

    // Add slashes
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }

    setDateOfBirth(formatted);
  };

  const clearOnChange = (setter: (v: string) => void) => (value: string) => {
    if (error) clearError();
    setter(value);
  };

  // Handlers onBlur pour chaque champ
  const handleBlur = (field: keyof typeof touched) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Afficher l'erreur seulement si le champ a été touché (blur) et est invalide
  const usernameError = touched.username && !usernameValidation.isValid ? usernameValidation.error : undefined;
  const emailError = touched.email && !emailValidation.isValid ? emailValidation.error : undefined;
  const passwordError = touched.password && !passwordValidation.isValid ? passwordValidation.error : undefined;
  const confirmPasswordError = touched.confirmPassword && !confirmValidation.isValid ? confirmValidation.error : undefined;
  const dobError = touched.dateOfBirth && !dobValidation.isValid ? dobValidation.error : undefined;

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
            <Text style={styles.title}>Rejoins la communauté !</Text>
            <Text style={styles.subtitle}>
              Crée ton compte et commence à partager tes pronostics
            </Text>
          </Animated.View>

          {/* Progress indicator */}
          <Animated.View style={[styles.progressContainer, { opacity: formOpacity }]}>
            <View style={styles.progressBadge}>
              <Ionicons name="flash" size={14} color={colors.accent} />
              <Text style={styles.progressText}>Inscription rapide</Text>
            </View>
          </Animated.View>

          {/* Error Box */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
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
              testID="username-input"
              placeholder="Nom d'utilisateur"
              icon="person-outline"
              value={username}
              onChangeText={clearOnChange(setUsername)}
              onBlur={handleBlur('username')}
              autoCapitalize="none"
              textContentType="username"
              autoComplete="username"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
              error={usernameError}
              accessibilityLabel="Nom d'utilisateur"
              accessibilityHint="Entrez votre nom d'utilisateur"
            />

            <SportyInput
              testID="register-email-input"
              inputRef={emailRef}
              placeholder="Email"
              icon="mail-outline"
              value={email}
              onChangeText={clearOnChange(setEmail)}
              onBlur={handleBlur('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailError}
              accessibilityLabel="Adresse email"
              accessibilityHint="Entrez votre adresse email"
            />

            <SportyInput
              testID="register-password-input"
              inputRef={passwordRef}
              placeholder="Mot de passe"
              icon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={clearOnChange(setPassword)}
              onBlur={handleBlur('password')}
              textContentType="newPassword"
              autoComplete="new-password"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              error={passwordError}
              accessibilityLabel="Mot de passe"
              accessibilityHint="Entrez votre mot de passe"
            />

            <SportyInput
              testID="confirm-password-input"
              inputRef={confirmPasswordRef}
              placeholder="Confirmer le mot de passe"
              icon="shield-checkmark-outline"
              isPassword
              value={confirmPassword}
              onChangeText={clearOnChange(setConfirmPassword)}
              onBlur={handleBlur('confirmPassword')}
              textContentType="newPassword"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => dateOfBirthRef.current?.focus()}
              error={confirmPasswordError}
              accessibilityLabel="Confirmer le mot de passe"
              accessibilityHint="Entrez à nouveau votre mot de passe"
            />

            <SportyInput
              testID="dob-input"
              inputRef={dateOfBirthRef}
              placeholder="Date de naissance (JJ/MM/AAAA)"
              icon="calendar-outline"
              value={dateOfBirth}
              onChangeText={handleDateChange}
              onBlur={handleBlur('dateOfBirth')}
              keyboardType="number-pad"
              maxLength={10}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={dobError}
              accessibilityLabel="Date de naissance"
              accessibilityHint="Entrez votre date de naissance"
            />

            {dateOfBirth.length === 0 && (
              <Text style={styles.ageHint}>
                <Ionicons name="information-circle-outline" size={12} color={colors.textSecondary} />
                {' '}Tu dois avoir 18 ans minimum
              </Text>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="warning-outline" size={20} color={colors.accent} />
              <Text style={styles.disclaimerText}>
                ShareTips est une plateforme de partage de pronostics. Les paris sportifs comportent des risques. Joue de manière responsable.
              </Text>
            </View>

            {/* CGV Checkbox */}
            <TouchableOpacity
              testID="cgv-checkbox"
              style={styles.checkboxRow}
              onPress={() => setAcceptedCGV(!acceptedCGV)}
              activeOpacity={0.7}
              accessibilityLabel="Accepter les conditions"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedCGV }}
            >
              <View style={[styles.checkbox, acceptedCGV && styles.checkboxChecked]}>
                {acceptedCGV && (
                  <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                {"J'ai lu et j'accepte les "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate('CGV')}
                >
                  CGV
                </Text>
                {" et les "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate('CGU')}
                >
                  CGU
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <View style={styles.buttonContainer}>
              <SportyButton
                testID="register-submit-button"
                title="Créer mon compte"
                onPress={handleRegister}
                disabled={!formValid}
                loading={loading}
                icon="rocket-outline"
                accessibilityLabel="S'inscrire"
                accessibilityHint="Appuyez pour créer votre compte"
              />
            </View>
          </Animated.View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <TouchableOpacity
              testID="login-link"
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              accessibilityLabel="Se connecter"
              accessibilityRole="link"
            >
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          {/* Trust indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.trustText}>Données protégées</Text>
            </View>
            <View style={styles.trustSeparator} />
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.trustText}>100% gratuit</Text>
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
          marginBottom: spacing.base,
        },
        logo: {
          width: size.auth.logoWidthSm,
          height: size.auth.logoHeightSm,
        },
        headerContainer: {
          marginBottom: spacing.base,
        },
        title: {
          ...typography.h2,
          color: palette.white,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        subtitle: {
          ...typography.bodySmall,
          color: palette.white + 'B3',
          textAlign: 'center',
          lineHeight: 20,
        },
        progressContainer: {
          alignItems: 'center',
          marginBottom: spacing.lg,
        },
        progressBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.accentBg,
          paddingHorizontal: spacing['md+'],
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          gap: spacing['2xs'],
        },
        progressText: {
          color: colors.accent,
          ...typography.caption,
          fontWeight: fontWeight.semibold,
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
          marginBottom: spacing.base,
        },
        ageHint: {
          color: colors.textSecondary,
          ...typography.caption,
          marginTop: -spacing.sm,
          marginBottom: spacing.base,
          marginLeft: spacing.xs,
        },
        disclaimerBox: {
          flexDirection: 'row',
          backgroundColor: colors.accentBg,
          borderWidth: 1,
          borderColor: colors.accent + '4D',
          borderRadius: radius.base,
          padding: spacing['md+'],
          marginBottom: spacing.base,
          gap: spacing.md,
        },
        disclaimerText: {
          flex: 1,
          color: colors.textSecondary,
          ...typography.caption,
          lineHeight: 18,
        },
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
          gap: spacing.md,
        },
        checkbox: {
          width: size.auth.checkboxSize,
          height: size.auth.checkboxSize,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: palette.white + '4D',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.xxs,
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        checkboxLabel: {
          flex: 1,
          color: colors.textSecondary,
          ...typography.caption,
          lineHeight: 20,
        },
        linkText: {
          color: colors.primary,
          textDecorationLine: 'underline',
        },
        buttonContainer: {
          marginTop: spacing.sm,
        },
        loginContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing['2xs'],
          paddingTop: spacing.sm,
        },
        loginText: {
          color: colors.textSecondary,
          ...typography.bodySmall,
        },
        loginLink: {
          color: colors.primary,
          ...typography.bodySmall,
          fontWeight: fontWeight.semibold,
        },
        trustIndicators: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: spacing.base,
          paddingBottom: spacing.sm,
        },
        trustItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing['2xs'],
        },
        trustSeparator: {
          width: 1,
          height: spacing.md,
          backgroundColor: palette.white + '33',
          marginHorizontal: spacing.base,
        },
        trustText: {
          color: colors.textSecondary,
          ...typography.caption,
        },
      }),
    [colors]
  );

export default RegisterScreen;

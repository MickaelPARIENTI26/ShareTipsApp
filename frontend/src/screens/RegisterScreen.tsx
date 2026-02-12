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
import { useTheme, type ThemeColors } from '../theme';
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
  const { loading, error, register, clearError } = useAuthStore();
  const { colors, isDark } = useTheme();
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
              autoCapitalize="none"
              textContentType="username"
              autoComplete="username"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
              error={username.length > 0 && !usernameValidation.isValid ? usernameValidation.error : undefined}
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
              testID="register-password-input"
              inputRef={passwordRef}
              placeholder="Mot de passe"
              icon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={clearOnChange(setPassword)}
              textContentType="newPassword"
              autoComplete="new-password"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              error={password.length > 0 && !passwordValidation.isValid ? passwordValidation.error : undefined}
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
              textContentType="newPassword"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => dateOfBirthRef.current?.focus()}
              error={confirmPassword.length > 0 && !confirmValidation.isValid ? confirmValidation.error : undefined}
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
              keyboardType="number-pad"
              maxLength={10}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={dateOfBirth.length > 0 && !dobValidation.isValid ? dobValidation.error : undefined}
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
          padding: 24,
          paddingTop: 16,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        logoContainer: {
          alignItems: 'center',
          marginBottom: 16,
        },
        logo: {
          width: 140,
          height: 48,
        },
        headerContainer: {
          marginBottom: 16,
        },
        title: {
          fontSize: 26,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        progressContainer: {
          alignItems: 'center',
          marginBottom: 20,
        },
        progressBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(243, 156, 18, 0.15)',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          gap: 6,
        },
        progressText: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '600',
        },
        errorBox: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 1,
          borderColor: colors.danger,
          borderRadius: 12,
          padding: 14,
          marginBottom: 20,
          gap: 10,
        },
        errorText: {
          flex: 1,
          color: colors.danger,
          fontSize: 14,
        },
        formContainer: {
          marginBottom: 16,
        },
        ageHint: {
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: -8,
          marginBottom: 16,
          marginLeft: 4,
        },
        disclaimerBox: {
          flexDirection: 'row',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(243, 156, 18, 0.3)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          gap: 12,
        },
        disclaimerText: {
          flex: 1,
          color: colors.textSecondary,
          fontSize: 12,
          lineHeight: 18,
        },
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 20,
          gap: 12,
        },
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        checkboxLabel: {
          flex: 1,
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
        },
        linkText: {
          color: colors.primary,
          textDecorationLine: 'underline',
        },
        buttonContainer: {
          marginTop: 8,
        },
        loginContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          paddingTop: 8,
        },
        loginText: {
          color: colors.textSecondary,
          fontSize: 14,
        },
        loginLink: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
        trustIndicators: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 16,
          paddingBottom: 8,
        },
        trustItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        trustSeparator: {
          width: 1,
          height: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          marginHorizontal: 16,
        },
        trustText: {
          color: colors.textSecondary,
          fontSize: 12,
        },
      }),
    [colors]
  );

export default RegisterScreen;

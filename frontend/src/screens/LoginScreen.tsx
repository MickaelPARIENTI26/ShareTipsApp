import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { useTheme, type ThemeColors } from '../theme';
import type { AuthStackParamList } from '../types';
import { validateEmail, validateLoginPassword, isFormValid } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, login, clearError } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = useStyles(colors);

  // Ref for password input focus navigation
  const passwordRef = useRef<TextInputType>(null);

  const emailValidation = validateEmail(email);
  const passwordValidation = validateLoginPassword(password);
  const formValid = isFormValid(emailValidation, passwordValidation);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_bbg.png');

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Connectez-vous</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          testID="email-input"
          accessibilityLabel="Adresse email"
          accessibilityHint="Entrez votre adresse email"
          style={[
            styles.input,
            email.length > 0 && !emailValidation.isValid && styles.inputError,
          ]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
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
        />
        {email.length > 0 && !emailValidation.isValid && (
          <Text style={styles.fieldError}>{emailValidation.error}</Text>
        )}

        <View style={styles.passwordContainer}>
          <TextInput
            testID="password-input"
            ref={passwordRef}
            accessibilityLabel="Mot de passe"
            accessibilityHint="Entrez votre mot de passe"
            style={[
              styles.input,
              styles.passwordInput,
              password.length > 0 && !passwordValidation.isValid && styles.inputError,
            ]}
            placeholder="Mot de passe"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={!showPassword}
            textContentType="password"
            autoComplete="password"
            editable={!loading}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {password.length > 0 && !passwordValidation.isValid && (
          <Text style={styles.fieldError}>{passwordValidation.error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!formValid || loading) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!formValid || loading}
          activeOpacity={0.7}
          accessibilityLabel="Se connecter"
          accessibilityRole="button"
          accessibilityState={{ disabled: !formValid || loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} accessibilityLabel="Connexion en cours" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={loading}
          accessibilityLabel="Mot de passe oublié"
          accessibilityRole="link"
        >
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
          style={styles.registerLink}
          accessibilityLabel="Créer un compte"
          accessibilityRole="link"
        >
          <Text style={styles.link}>{"Pas de compte ? S'inscrire"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        flex: {
          flex: 1,
          backgroundColor: colors.surface,
        },
        container: {
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        },
        logo: {
          width: 180,
          height: 60,
          alignSelf: 'center',
          marginBottom: 12,
        },
        subtitle: {
          fontSize: 18,
          textAlign: 'center',
          color: colors.textSecondary,
          marginBottom: 32,
        },
        errorBox: {
          backgroundColor: colors.dangerLight,
          borderWidth: 1,
          borderColor: colors.dangerBorder,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        },
        errorText: {
          color: colors.danger,
          fontSize: 14,
          textAlign: 'center',
        },
        input: {
          borderWidth: 1,
          borderColor: colors.inputBorder,
          borderRadius: 8,
          padding: 14,
          fontSize: 16,
          marginBottom: 4,
          backgroundColor: colors.inputBackground,
          color: colors.text,
        },
        passwordContainer: {
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
        },
        passwordInput: {
          flex: 1,
          paddingRight: 50,
        },
        eyeButton: {
          position: 'absolute',
          right: 14,
          top: 14,
        },
        inputError: {
          borderColor: colors.danger,
        },
        fieldError: {
          color: colors.danger,
          fontSize: 12,
          marginBottom: 8,
          marginLeft: 4,
        },
        button: {
          backgroundColor: colors.primary,
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 12,
          marginBottom: 16,
        },
        buttonDisabled: {
          opacity: 0.5,
        },
        buttonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
        link: {
          textAlign: 'center',
          color: colors.primary,
          fontSize: 14,
        },
        registerLink: {
          marginTop: 12,
        },
      }),
    [colors]
  );

export default LoginScreen;

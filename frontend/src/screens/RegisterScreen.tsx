import React, { useState, useMemo } from 'react';
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
} from 'react-native';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const { loading, error, register, clearError } = useAuthStore();
  const { colors, isDark } = useTheme();
  const styles = useStyles(colors);

  const usernameValidation = validateUsername(username);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const confirmValidation = validatePasswordMatch(password, confirmPassword);
  const dobValidation = validateDateOfBirth(dateOfBirth);
  const formValid = isFormValid(usernameValidation, emailValidation, passwordValidation, confirmValidation, dobValidation);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_bbg.png');

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Créer un compte</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            username.length > 0 && !usernameValidation.isValid && styles.inputError,
          ]}
          placeholder={"Nom d'utilisateur"}
          placeholderTextColor={colors.placeholder}
          value={username}
          onChangeText={clearOnChange(setUsername)}
          autoCapitalize="none"
          textContentType="username"
          autoComplete="username"
          editable={!loading}
        />
        {username.length > 0 && !usernameValidation.isValid && (
          <Text style={styles.fieldError}>{usernameValidation.error}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            email.length > 0 && !emailValidation.isValid && styles.inputError,
          ]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={clearOnChange(setEmail)}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          editable={!loading}
        />
        {email.length > 0 && !emailValidation.isValid && (
          <Text style={styles.fieldError}>{emailValidation.error}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            password.length > 0 && !passwordValidation.isValid && styles.inputError,
          ]}
          placeholder="Mot de passe"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={clearOnChange(setPassword)}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          editable={!loading}
        />
        {password.length > 0 && !passwordValidation.isValid && (
          <Text style={styles.fieldError}>{passwordValidation.error}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            confirmPassword.length > 0 && !confirmValidation.isValid && styles.inputError,
          ]}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={colors.placeholder}
          value={confirmPassword}
          onChangeText={clearOnChange(setConfirmPassword)}
          secureTextEntry
          textContentType="newPassword"
          editable={!loading}
        />
        {confirmPassword.length > 0 && !confirmValidation.isValid && (
          <Text style={styles.fieldError}>{confirmValidation.error}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            dateOfBirth.length > 0 && !dobValidation.isValid && styles.inputError,
          ]}
          placeholder="Date de naissance (JJ/MM/AAAA)"
          placeholderTextColor={colors.placeholder}
          value={dateOfBirth}
          onChangeText={handleDateChange}
          keyboardType="number-pad"
          maxLength={10}
          editable={!loading}
        />
        {dateOfBirth.length > 0 && !dobValidation.isValid && (
          <Text style={styles.fieldError}>{dobValidation.error}</Text>
        )}
        {dateOfBirth.length === 0 && (
          <Text style={styles.ageHint}>Vous devez avoir 18 ans minimum</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!formValid || loading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!formValid || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>{"S'inscrire"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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
        inputError: {
          borderColor: colors.danger,
        },
        fieldError: {
          color: colors.danger,
          fontSize: 12,
          marginBottom: 8,
          marginLeft: 4,
        },
        ageHint: {
          color: colors.textSecondary,
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
      }),
    [colors]
  );

export default RegisterScreen;

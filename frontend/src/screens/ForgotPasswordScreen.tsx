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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../theme';
import type { AuthStackParamList } from '../types';
import { authApi } from '../api/auth.api';
import { validateEmail, validatePassword, isFormValid } from '../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'emailSent' | 'newPassword';

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(newPassword);

  const handleSendEmail = async () => {
    if (!emailValidation.isValid) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setStep('emailSent');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithToken = () => {
    if (token.trim().length < 10) {
      setError('Token invalide');
      return;
    }
    setError(null);
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Mot de passe invalide');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.resetPassword(token.trim(), newPassword);
      if (data.success) {
        Alert.alert('Succès', data.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        setError(data.message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.instruction}>
        Entrez votre adresse email pour recevoir un lien de réinitialisation.
      </Text>

      <TextInput
        style={[
          styles.input,
          email.length > 0 && !emailValidation.isValid && styles.inputError,
        ]}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={(val) => {
          setError(null);
          setEmail(val);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        editable={!loading}
      />
      {email.length > 0 && !emailValidation.isValid && (
        <Text style={styles.fieldError}>{emailValidation.error}</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          (!emailValidation.isValid || loading) && styles.buttonDisabled,
        ]}
        onPress={handleSendEmail}
        disabled={!emailValidation.isValid || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>Envoyer le lien</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderEmailSentStep = () => (
    <>
      <View style={styles.successBox}>
        <Ionicons name="mail-outline" size={48} color={colors.success} />
        <Text style={styles.successTitle}>Email envoyé !</Text>
        <Text style={styles.successText}>
          Un lien de réinitialisation a été envoyé à {email}.
          Cliquez sur le lien dans l'email pour continuer.
        </Text>
      </View>

      <Text style={styles.orText}>— ou —</Text>

      <Text style={styles.instruction}>
        Copiez le token depuis l'email et collez-le ci-dessous :
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Coller le token ici"
        placeholderTextColor={colors.placeholder}
        value={token}
        onChangeText={(val) => {
          setError(null);
          setToken(val);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, token.trim().length < 10 && styles.buttonDisabled]}
        onPress={handleContinueWithToken}
        disabled={token.trim().length < 10}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Continuer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setStep('email');
          setToken('');
          setError(null);
        }}
      >
        <Text style={styles.link}>Renvoyer l'email</Text>
      </TouchableOpacity>
    </>
  );

  const renderNewPasswordStep = () => {
    const formReady =
      passwordValidation.isValid && newPassword === confirmPassword;

    return (
      <>
        <Text style={styles.instruction}>
          Créez votre nouveau mot de passe (minimum 8 caractères).
        </Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              newPassword.length > 0 &&
                !passwordValidation.isValid &&
                styles.inputError,
            ]}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={colors.placeholder}
            value={newPassword}
            onChangeText={(val) => {
              setError(null);
              setNewPassword(val);
            }}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            autoComplete="password-new"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {newPassword.length > 0 && !passwordValidation.isValid && (
          <Text style={styles.fieldError}>{passwordValidation.error}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            confirmPassword.length > 0 &&
              newPassword !== confirmPassword &&
              styles.inputError,
          ]}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={colors.placeholder}
          value={confirmPassword}
          onChangeText={(val) => {
            setError(null);
            setConfirmPassword(val);
          }}
          secureTextEntry={!showPassword}
          textContentType="newPassword"
          autoComplete="password-new"
          editable={!loading}
        />
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.fieldError}>
            Les mots de passe ne correspondent pas
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!formReady || loading) && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={!formReady || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
          )}
        </TouchableOpacity>
      </>
    );
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 'email' && renderEmailStep()}
        {step === 'emailSent' && renderEmailSentStep()}
        {step === 'newPassword' && renderNewPasswordStep()}

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Retour à la connexion</Text>
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
        backButton: {
          position: 'absolute',
          top: 50,
          left: 16,
          zIndex: 10,
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
        },
        instruction: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
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
        successBox: {
          backgroundColor: colors.successLight,
          borderWidth: 1,
          borderColor: colors.success,
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
          alignItems: 'center',
        },
        successTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.success,
          marginTop: 12,
          marginBottom: 8,
        },
        successText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        orText: {
          fontSize: 14,
          color: colors.textTertiary,
          textAlign: 'center',
          marginVertical: 16,
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
          marginTop: 8,
        },
      }),
    [colors]
  );

export default ForgotPasswordScreen;

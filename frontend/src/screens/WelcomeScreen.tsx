import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../theme';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useStyles(colors);

  const logo = isDark
    ? require('../../assets/logos/logo_wbg.png')
    : require('../../assets/logos/logo_bbg.png');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          testID="login-button"
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Connexion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="register-button"
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Inscription</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'space-between',
          paddingHorizontal: 24,
        },
        topSection: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        logo: {
          width: 220,
          height: 80,
          marginBottom: 12,
        },
        slogan: {
          fontSize: 16,
          fontStyle: 'italic',
          color: colors.textSecondary,
          letterSpacing: 0.3,
        },
        bottomSection: {
          paddingBottom: 32,
          gap: 12,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
        },
        primaryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 17,
          fontWeight: '700',
        },
        secondaryButton: {
          backgroundColor: 'transparent',
          paddingVertical: 16,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: colors.primary,
          alignItems: 'center',
        },
        secondaryButtonText: {
          color: colors.primary,
          fontSize: 17,
          fontWeight: '700',
        },
      }),
    [colors]
  );

export default WelcomeScreen;

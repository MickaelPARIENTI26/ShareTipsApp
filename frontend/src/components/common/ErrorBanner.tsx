import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { ErrorType, type AppError } from '../../utils/errors';

interface ErrorBannerProps {
  error: string | AppError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  style?: object;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const errorType = typeof error === 'string' ? ErrorType.UNKNOWN : error.type;
  const canRetry = typeof error === 'string' ? false : error.retryable;

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'cloud-offline-outline';
      case ErrorType.AUTH:
        return 'lock-closed-outline';
      case ErrorType.FORBIDDEN:
        return 'ban-outline';
      case ErrorType.NOT_FOUND:
        return 'search-outline';
      case ErrorType.SERVER:
        return 'server-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={20} color={colors.danger} style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <View style={styles.actions}>
        {canRetry && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.dangerLight,
          borderWidth: 1,
          borderColor: colors.dangerBorder,
          borderRadius: 8,
          padding: 12,
          marginHorizontal: 16,
          marginVertical: 8,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        icon: {
          marginRight: 10,
          marginTop: 1,
        },
        message: {
          flex: 1,
          fontSize: 14,
          color: colors.danger,
          lineHeight: 20,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 8,
          gap: 12,
        },
        retryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 8,
        },
        retryText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
        dismissButton: {
          padding: 4,
        },
      }),
    [colors]
  );

export default ErrorBanner;

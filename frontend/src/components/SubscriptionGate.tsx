import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

interface SubscriptionGateProps {
  /** Whether the user has an active subscription */
  isSubscribed: boolean;
  /** Whether the subscription status is loading */
  isLoading?: boolean;
  /** Whether the current user is the creator (bypass the gate) */
  isCreator?: boolean;
  /** Callback when the subscribe button is pressed */
  onSubscribe: () => void;
  /** Custom title for the locked state */
  lockedTitle?: string;
  /** Custom message for the locked state */
  lockedMessage?: string;
  /** Custom button text */
  buttonText?: string;
  /** Number of remaining days (shown if wasSubscribed) */
  remainingDays?: number;
  /** Whether the user was previously subscribed */
  wasSubscribed?: boolean;
  /** Children to render when access is granted */
  children: React.ReactNode;
}

/**
 * SubscriptionGate - A reusable component that gates content behind subscription.
 * Shows a locked state with CTA when the user doesn't have an active subscription.
 * This component is designed to be extended for Stripe integration.
 */
export function SubscriptionGate({
  isSubscribed,
  isLoading = false,
  isCreator = false,
  onSubscribe,
  lockedTitle = 'Contenu réservé aux abonnés',
  lockedMessage = 'Abonnez-vous pour accéder aux tickets privés de ce tipster.',
  buttonText = "S'abonner",
  remainingDays,
  wasSubscribed = false,
  children,
}: SubscriptionGateProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Creators always have access to their own content
  if (isCreator) {
    return <>{children}</>;
  }

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Vérification de l'abonnement...</Text>
      </View>
    );
  }

  // Show content if subscribed
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Show locked state with CTA
  return (
    <View style={styles.lockedContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
      </View>

      <Text style={styles.lockedTitle}>{lockedTitle}</Text>
      <Text style={styles.lockedMessage}>{lockedMessage}</Text>

      {wasSubscribed && (
        <View style={styles.expiredBadge}>
          <Ionicons name="time-outline" size={16} color={colors.warning} />
          <Text style={styles.expiredText}>
            Votre abonnement a expiré
            {remainingDays !== undefined && remainingDays < 0
              ? ` il y a ${Math.abs(remainingDays)} jours`
              : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={onSubscribe}
        activeOpacity={0.8}
      >
        <Ionicons
          name="star"
          size={20}
          color={colors.textOnPrimary}
          style={styles.buttonIcon}
        />
        <Text style={styles.subscribeButtonText}>{buttonText}</Text>
      </TouchableOpacity>

      <Text style={styles.benefitsTitle}>Avantages de l'abonnement :</Text>
      <View style={styles.benefitsList}>
        <BenefitItem
          icon="ticket-outline"
          text="Accès à tous les tickets privés"
          colors={colors}
        />
        <BenefitItem
          icon="notifications-outline"
          text="Notifications en temps réel"
          colors={colors}
        />
        <BenefitItem
          icon="analytics-outline"
          text="Statistiques détaillées"
          colors={colors}
        />
      </View>
    </View>
  );
}

interface BenefitItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: ThemeColors;
}

function BenefitItem({ icon, text, colors }: BenefitItemProps) {
  return (
    <View style={benefitStyles.container}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[benefitStyles.text, { color: colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}

const benefitStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginLeft: 10,
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    lockedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    lockedTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    lockedMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    expiredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warningLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 20,
    },
    expiredText: {
      fontSize: 13,
      color: colors.warningDark,
      marginLeft: 6,
    },
    subscribeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      marginBottom: 24,
    },
    buttonIcon: {
      marginRight: 8,
    },
    subscribeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    benefitsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    benefitsList: {
      alignItems: 'flex-start',
    },
  });

export default SubscriptionGate;

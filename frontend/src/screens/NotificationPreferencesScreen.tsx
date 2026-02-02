import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  notificationPreferencesApi,
  type NotificationPreferencesDto,
} from '../api/notificationPreferences.api';
import { useTheme, type ThemeColors } from '../theme';

interface PreferenceRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}

const PreferenceRow: React.FC<PreferenceRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  colors,
  styles,
}) => (
  <View style={styles.preferenceRow}>
    <View style={styles.preferenceIconContainer}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.preferenceContent}>
      <Text style={styles.preferenceTitle}>{title}</Text>
      <Text style={styles.preferenceDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary + '80' }}
      thumbColor={value ? colors.primary : colors.textTertiary}
    />
  </View>
);

const NotificationPreferencesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesDto>({
    newTicket: true,
    matchStart: true,
    ticketResult: true,
    subscriptionExpire: true,
  });

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await notificationPreferencesApi.getMyPreferences();
      setPreferences(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les préférences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferencesDto, value: boolean) => {
      const previousPreferences = { ...preferences };
      const newPreferences = { ...preferences, [key]: value };

      // Optimistic update
      setPreferences(newPreferences);
      setSaving(true);

      try {
        await notificationPreferencesApi.updateMyPreferences(newPreferences);
      } catch {
        // Rollback on error
        setPreferences(previousPreferences);
        Alert.alert('Erreur', 'Impossible de sauvegarder les préférences');
      } finally {
        setSaving(false);
      }
    },
    [preferences]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <Text style={styles.sectionSubtitle}>
        Choisissez les notifications que vous souhaitez recevoir
      </Text>

      <View style={styles.card}>
        <PreferenceRow
          icon="receipt-outline"
          title="Nouveaux tickets"
          description="Quand un tipster que vous suivez publie un nouveau ticket"
          value={preferences.newTicket}
          onValueChange={(value) => updatePreference('newTicket', value)}
          colors={colors}
          styles={styles}
        />

        <View style={styles.separator} />

        <PreferenceRow
          icon="football-outline"
          title="Début de match"
          description="Quand un match de votre ticket va commencer"
          value={preferences.matchStart}
          onValueChange={(value) => updatePreference('matchStart', value)}
          colors={colors}
          styles={styles}
        />

        <View style={styles.separator} />

        <PreferenceRow
          icon="trophy-outline"
          title="Résultat ticket"
          description="Quand un de vos tickets est gagné ou perdu"
          value={preferences.ticketResult}
          onValueChange={(value) => updatePreference('ticketResult', value)}
          colors={colors}
          styles={styles}
        />

        <View style={styles.separator} />

        <PreferenceRow
          icon="time-outline"
          title="Expiration abonnement"
          description="Rappels avant l'expiration de vos abonnements"
          value={preferences.subscriptionExpire}
          onValueChange={(value) => updatePreference('subscriptionExpire', value)}
          colors={colors}
          styles={styles}
        />
      </View>

      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Sauvegarde...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        contentContainer: {
          padding: 16,
        },
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        sectionTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 8,
        },
        sectionSubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          marginBottom: 20,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          overflow: 'hidden',
        },
        preferenceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
        },
        preferenceIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        preferenceContent: {
          flex: 1,
          marginRight: 12,
        },
        preferenceTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 2,
        },
        preferenceDescription: {
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
          marginLeft: 68,
        },
        savingIndicator: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
          gap: 8,
        },
        savingText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

export default NotificationPreferencesScreen;

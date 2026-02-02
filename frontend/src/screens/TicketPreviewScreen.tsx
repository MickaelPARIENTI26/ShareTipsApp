import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ticketApi } from '../api/ticket.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import type { RootStackParamList, TicketSelection } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Selection card (read-only) ---
const SelectionCard: React.FC<{
  item: TicketSelection;
  index: number;
  styles: ReturnType<typeof useStyles>;
}> = ({ item, index, styles }) => (
  <View style={styles.selCard}>
    <View style={styles.selCardHeader}>
      <Text style={styles.selIndex}>{index + 1}</Text>
      <View style={styles.sportBadge}>
        <Text style={styles.sportBadgeText}>
          {SPORT_LABELS[item.sportCode] ?? item.sportCode}
        </Text>
      </View>
    </View>

    <View style={styles.selRow}>
      <Text style={styles.selLabel}>Compétition</Text>
      <Text style={styles.selValue}>{item.leagueName}</Text>
    </View>
    <View style={styles.selRow}>
      <Text style={styles.selLabel}>Match</Text>
      <Text style={styles.selValue}>{item.matchLabel}</Text>
    </View>
    <View style={styles.selRow}>
      <Text style={styles.selLabel}>Marché</Text>
      <Text style={styles.selValue}>
        {item.marketLabel} — {item.selectionLabel}
      </Text>
    </View>
    <View style={styles.selRow}>
      <Text style={styles.selLabel}>Heure</Text>
      <Text style={styles.selValue}>{formatDateTime(item.startTime)}</Text>
    </View>
    <View style={[styles.selRow, styles.selRowLast]}>
      <Text style={styles.selLabel}>Cote</Text>
      <Text style={styles.oddsValue}>{item.odds.toFixed(2)}</Text>
    </View>
  </View>
);

// --- Summary row helper ---
const Row: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  styles: ReturnType<typeof useStyles>;
  colors: ThemeColors;
}> = ({ label, value, highlight, icon, iconColor, styles, colors }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={styles.summaryRight}>
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={iconColor ?? colors.text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.summaryValue,
          highlight && styles.summaryValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

// --- Main screen ---
const TicketPreviewScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const route = useRoute();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { draft } = route.params as RootStackParamList['TicketPreview'];
  const clear = useTicketBuilderStore((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);

  const handleModify = () => {
    navigation.goBack();
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // Build title from match labels
      const title = draft.selections
        .map((s) => s.matchLabel)
        .join(' + ');

      const payload = {
        title,
        isPublic: draft.visibility === 'PUBLIC',
        priceCredits:
          draft.visibility === 'PRIVATE' && draft.priceCredits != null
            ? draft.priceCredits
            : 0,
        confidenceIndex: draft.confidenceIndex,
        selections: draft.selections.map((s) => ({
          matchId: s.matchId,
          sport: s.sportCode,
          marketType: s.marketType,
          selectionCode: s.selectionLabel,
          odds: s.odds,
          matchLabel: s.matchLabel,
          leagueName: s.leagueName,
        })),
      };

      await ticketApi.create(payload);

      // Clear betslip
      clear();

      // Navigate back to Matches tab
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                index: 2, // Matches tab index
                routes: [
                  { name: 'Home' },
                  { name: 'Marketplace' },
                  { name: 'Matches' },
                  { name: 'Profile' },
                ],
              },
            },
          ],
        })
      );
    } catch (err: unknown) {
      const message =
        err != null &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error
          ? (err as { response: { data: { error: string } } }).response.data
              .error
          : 'Une erreur est survenue lors de la création du ticket';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Selections */}
        <Text style={styles.sectionTitle}>
          Sélections ({draft.selections.length})
        </Text>
        {draft.selections.map((sel, i) => (
          <SelectionCard key={sel.selectionId} item={sel} index={i} styles={styles} />
        ))}

        {/* Summary */}
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
          Récapitulatif
        </Text>
        <View style={styles.summaryCard}>
          <Row label="Sélections" value={String(draft.selections.length)} styles={styles} colors={colors} />
          <Row
            label="Cote totale"
            value={draft.totalOdds.toFixed(2)}
            highlight
            styles={styles}
            colors={colors}
          />
          <Row
            label="Indice de confiance"
            value={`${draft.confidenceIndex}/10`}
            styles={styles}
            colors={colors}
          />
          <Row
            label="Visibilité"
            value={draft.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
            icon={draft.visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
            iconColor={
              draft.visibility === 'PUBLIC' ? colors.primary : colors.warning
            }
            styles={styles}
            colors={colors}
          />
          {draft.visibility === 'PRIVATE' && draft.priceCredits != null && (
            <Row label="Prix" value={`${draft.priceCredits} crédits`} styles={styles} colors={colors} />
          )}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons
            name="warning"
            size={20}
            color={colors.warning}
            style={styles.warningIcon}
          />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Une fois le ticket créé :</Text>
            <Text style={styles.warningText}>
              • Il ne pourra plus être modifié
            </Text>
            <Text style={styles.warningText}>
              {"• Il ne pourra plus être supprimé s'il est public"}
            </Text>
            <Text style={styles.warningText}>• Les cotes sont figées</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.modifyBtn}
          onPress={handleModify}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.modifyText}>Modifier le ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />
          )}
          <Text style={styles.confirmText}>
            {submitting ? 'Création en cours…' : 'Confirmer et créer le ticket'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
        scroll: {
          padding: 16,
          paddingBottom: 24,
        },
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        sectionTitleSpaced: {
          marginTop: 20,
        },

        // Selection card
        selCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        selCardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
          gap: 8,
        },
        selIndex: {
          fontSize: 12,
          fontWeight: '800',
          color: colors.textOnPrimary,
          backgroundColor: colors.primary,
          width: 22,
          height: 22,
          borderRadius: 11,
          textAlign: 'center',
          lineHeight: 22,
          overflow: 'hidden',
        },
        sportBadge: {
          backgroundColor: colors.background,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        sportBadgeText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        selRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 4,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        selRowLast: {
          borderBottomWidth: 0,
        },
        selLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        selValue: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
          flexShrink: 1,
          textAlign: 'right',
          maxWidth: '60%',
        },
        oddsValue: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.primary,
        },

        // Summary card
        summaryCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 5,
        },
        summaryLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        summaryRight: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        summaryValue: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
        summaryValueHighlight: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.primary,
        },

        // Warning
        warningCard: {
          flexDirection: 'row',
          backgroundColor: '#FFF8EE',
          borderRadius: 12,
          padding: 14,
          marginTop: 16,
          borderWidth: 1,
          borderColor: '#FFD6A0',
        },
        warningIcon: {
          marginRight: 10,
          marginTop: 1,
        },
        warningContent: {
          flex: 1,
        },
        warningTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 6,
        },
        warningText: {
          fontSize: 13,
          color: '#6B6B6B',
          lineHeight: 20,
        },

        // Actions
        actions: {
          padding: 16,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 8,
        },
        confirmBtn: {
          backgroundColor: colors.success,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 15,
          borderRadius: 12,
        },
        confirmBtnDisabled: {
          backgroundColor: '#A8D5BA',
        },
        confirmText: {
          color: colors.textOnPrimary,
          fontWeight: '700',
          fontSize: 16,
        },
        modifyBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        modifyText: {
          color: colors.primary,
          fontWeight: '600',
          fontSize: 15,
        },
      }),
    [colors]
  );

export default TicketPreviewScreen;

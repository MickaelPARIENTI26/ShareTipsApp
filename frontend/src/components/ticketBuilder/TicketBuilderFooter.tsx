import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TicketVisibility } from '../../store/ticketBuilder.store';
import { useTheme, type ThemeColors } from '../../theme';

interface TicketBuilderFooterProps {
  totalOdds: number;
  count: number;
  confidenceIndex: number | null;
  visibility: TicketVisibility;
  priceCredits: number | null;
  onClear: () => void;
  onSubmit: () => void;
}

function isValid(
  count: number,
  confidenceIndex: number | null,
  visibility: TicketVisibility,
  priceCredits: number | null
): boolean {
  if (count === 0) return false;
  if (confidenceIndex == null || confidenceIndex < 1 || confidenceIndex > 10)
    return false;
  if (visibility === 'PRIVATE' && (priceCredits == null || priceCredits < 1))
    return false;
  return true;
}

const TicketBuilderFooter: React.FC<TicketBuilderFooterProps> = ({
  totalOdds,
  count,
  confidenceIndex,
  visibility,
  priceCredits,
  onClear,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const valid = isValid(count, confidenceIndex, visibility, priceCredits);

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sélections</Text>
          <Text style={styles.summaryValue}>{count}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cote totale</Text>
          <Text style={styles.totalValue}>{totalOdds.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Confiance</Text>
          <Text style={styles.summaryValue}>
            {confidenceIndex != null ? `${confidenceIndex}/10` : '–'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Visibilité</Text>
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
              size={12}
              color={visibility === 'PUBLIC' ? colors.primary : colors.warning}
            />
            <Text
              style={[
                styles.visibilityText,
                { color: visibility === 'PUBLIC' ? colors.primary : colors.warning },
              ]}
            >
              {visibility === 'PUBLIC' ? 'Public' : 'Privé'}
            </Text>
          </View>
        </View>
        {visibility === 'PRIVATE' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Prix</Text>
            <Text style={styles.summaryValue}>
              {priceCredits != null ? `${priceCredits} cr.` : '–'}
            </Text>
          </View>
        )}
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        En créant ce ticket, vous partagez un pronostic. Aucun résultat n'est garanti.
      </Text>

      {/* Actions */}
      <TouchableOpacity
        style={[styles.submitBtn, !valid && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={!valid}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />
        <Text style={styles.submitText}>Créer le ticket</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
        <Text style={styles.clearText}>Vider le coupon</Text>
      </TouchableOpacity>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        summarySection: {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
        },
        disclaimer: {
          fontSize: 11,
          color: colors.textTertiary,
          textAlign: 'center',
          marginBottom: 10,
          lineHeight: 15,
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 3,
        },
        summaryLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        summaryValue: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.text,
        },
        totalValue: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.primary,
        },
        visibilityBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        visibilityText: {
          fontSize: 13,
          fontWeight: '700',
        },
        submitBtn: {
          backgroundColor: colors.success,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 14,
          borderRadius: 10,
          marginBottom: 8,
        },
        submitBtnDisabled: {
          backgroundColor: colors.success + '60',
        },
        submitText: {
          color: colors.textOnPrimary,
          fontWeight: '700',
          fontSize: 16,
        },
        clearBtn: {
          alignItems: 'center',
          padding: 8,
        },
        clearText: {
          color: colors.danger,
          fontWeight: '600',
          fontSize: 14,
        },
      }),
    [colors]
  );

export default TicketBuilderFooter;

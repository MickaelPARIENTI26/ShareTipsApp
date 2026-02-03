import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { MarketplaceFilters } from '../../api/marketplace.api';
import type { TicketFilterMetaDto } from '../../types';
import { useTheme, type ThemeColors } from '../../theme';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

// --- Predefined range definitions ---
interface Range {
  label: string;
  min?: number;
  max?: number;
}

const ODDS_RANGES: Range[] = [
  { label: '< 2', max: 2 },
  { label: '2 – 5', min: 2, max: 5 },
  { label: '5 – 10', min: 5, max: 10 },
  { label: '10+', min: 10 },
];

const CONFIDENCE_RANGES: Range[] = [
  { label: 'Faible (1-3)', min: 1, max: 3 },
  { label: 'Moyen (4-6)', min: 4, max: 6 },
  { label: 'Élevé (7-10)', min: 7, max: 10 },
];

const SELECTIONS_RANGES: Range[] = [
  { label: '1', min: 1, max: 1 },
  { label: '2 – 3', min: 2, max: 3 },
  { label: '4 – 5', min: 4, max: 5 },
  { label: '6+', min: 6 },
];

function rangeMatches(
  range: Range,
  currentMin?: number,
  currentMax?: number
): boolean {
  return currentMin === range.min && currentMax === range.max;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: MarketplaceFilters;
  onApply: (filters: MarketplaceFilters) => void;
  meta: TicketFilterMetaDto | null;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  meta,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [draft, setDraft] = useState<MarketplaceFilters>(filters);

  // Reset draft when modal opens
  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const availableSports = meta?.availableSports ?? [];

  const toggleSport = (sport: string) => {
    const current = draft.sports ?? [];
    const next = current.includes(sport)
      ? current.filter((s) => s !== sport)
      : [...current, sport];
    setDraft({ ...draft, sports: next.length > 0 ? next : undefined });
  };

  const toggleOddsRange = (range: Range) => {
    if (rangeMatches(range, draft.minOdds, draft.maxOdds)) {
      setDraft({ ...draft, minOdds: undefined, maxOdds: undefined });
    } else {
      setDraft({ ...draft, minOdds: range.min, maxOdds: range.max });
    }
  };

  const toggleConfidenceRange = (range: Range) => {
    if (rangeMatches(range, draft.minConfidence, draft.maxConfidence)) {
      setDraft({
        ...draft,
        minConfidence: undefined,
        maxConfidence: undefined,
      });
    } else {
      setDraft({
        ...draft,
        minConfidence: range.min,
        maxConfidence: range.max,
      });
    }
  };

  const toggleSelectionsRange = (range: Range) => {
    if (rangeMatches(range, draft.minSelections, draft.maxSelections)) {
      setDraft({
        ...draft,
        minSelections: undefined,
        maxSelections: undefined,
      });
    } else {
      setDraft({
        ...draft,
        minSelections: range.min,
        maxSelections: range.max,
      });
    }
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft({});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtres</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Sports multi-select */}
          {availableSports.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sports</Text>
              <View style={styles.chipRow}>
                {availableSports.map((sport) => {
                  const isSelected = draft.sports?.includes(sport) ?? false;
                  return (
                    <TouchableOpacity
                      key={sport}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleSport(sport)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {SPORT_LABELS[sport] ?? sport}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Ticket type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.chipRow}>
              {(['public', 'private'] as const).map((type) => {
                const isSelected = draft.ticketType === type;
                const label = type === 'public' ? 'Public' : 'Privé';
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        ticketType: isSelected ? undefined : type,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Odds range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cote moyenne</Text>
            <View style={styles.chipRow}>
              {ODDS_RANGES.map((range) => {
                const isSelected = rangeMatches(
                  range,
                  draft.minOdds,
                  draft.maxOdds
                );
                return (
                  <TouchableOpacity
                    key={range.label}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleOddsRange(range)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Confidence range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indice de confiance</Text>
            <View style={styles.chipRow}>
              {CONFIDENCE_RANGES.map((range) => {
                const isSelected = rangeMatches(
                  range,
                  draft.minConfidence,
                  draft.maxConfidence
                );
                return (
                  <TouchableOpacity
                    key={range.label}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleConfidenceRange(range)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Match count range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nombre de matchs</Text>
            <View style={styles.chipRow}>
              {SELECTIONS_RANGES.map((range) => {
                const isSelected = rangeMatches(
                  range,
                  draft.minSelections,
                  draft.maxSelections
                );
                return (
                  <TouchableOpacity
                    key={range.label}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleSelectionsRange(range)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <Text style={styles.applyBtnText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        modal: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        resetText: {
          fontSize: 15,
          color: colors.danger,
          fontWeight: '600',
        },
        content: {
          padding: 16,
          paddingBottom: 32,
        },
        section: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 12,
        },
        chipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          backgroundColor: colors.background,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chipTextActive: {
          color: colors.textOnPrimary,
        },
        footer: {
          padding: 16,
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        applyBtn: {
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
        },
        applyBtnText: {
          color: colors.textOnPrimary,
          fontSize: 17,
          fontWeight: '700',
        },
      }),
    [colors]
  );

export default FilterModal;

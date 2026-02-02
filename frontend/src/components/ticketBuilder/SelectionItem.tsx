import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TicketSelection } from '../../types';
import { useTheme, type ThemeColors } from '../../theme';

interface SelectionItemProps {
  item: TicketSelection;
  onRemove: (matchId: string) => void;
}

const SelectionItem: React.FC<SelectionItemProps> = ({ item, onRemove }) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.matchLabel} numberOfLines={1}>
          {item.matchLabel}
        </Text>
        <Text style={styles.league} numberOfLines={1}>
          {item.leagueName}
        </Text>
        <View style={styles.selectionRow}>
          <Text style={styles.marketLabel}>{item.marketLabel}</Text>
          <View style={styles.selBadge}>
            <Text style={styles.selBadgeText}>{item.selectionLabel}</Text>
          </View>
          <Text style={styles.odds}>{item.odds.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(item.matchId)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 10,
          padding: 12,
          marginBottom: 6,
        },
        info: {
          flex: 1,
        },
        matchLabel: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
        league: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 1,
          marginBottom: 6,
        },
        selectionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        marketLabel: {
          fontSize: 11,
          color: colors.textSecondary,
        },
        selBadge: {
          backgroundColor: colors.primary,
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        selBadgeText: {
          color: colors.textOnPrimary,
          fontSize: 11,
          fontWeight: '600',
        },
        odds: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
      }),
    [colors]
  );

export default SelectionItem;

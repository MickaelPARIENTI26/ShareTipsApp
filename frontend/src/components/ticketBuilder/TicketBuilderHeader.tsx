import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';

interface TicketBuilderHeaderProps {
  count: number;
  isOpen: boolean;
  totalOdds: number;
  onToggle: () => void;
}

const TicketBuilderHeader: React.FC<TicketBuilderHeaderProps> = ({
  count,
  isOpen,
  totalOdds,
  onToggle,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <Ionicons name="receipt" size={18} color={colors.textOnPrimary} />
        <Text style={styles.title}>Coupon</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>

      {/* Collapsed mini-bar: show total odds + prompt */}
      {!isOpen && count > 0 ? (
        <View style={styles.right}>
          <Text style={styles.oddsLabel}>Cote</Text>
          <Text style={styles.oddsValue}>{totalOdds.toFixed(2)}</Text>
          <Ionicons name="chevron-up" size={18} color={colors.textOnPrimary} />
        </View>
      ) : (
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.textOnPrimary}
        />
      )}
    </TouchableOpacity>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        left: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        title: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
        badge: {
          backgroundColor: colors.surface,
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        },
        badgeText: {
          color: colors.primary,
          fontSize: 12,
          fontWeight: '800',
        },
        right: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        oddsLabel: {
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          fontWeight: '500',
        },
        oddsValue: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '800',
        },
      }),
    [colors]
  );

export default TicketBuilderHeader;

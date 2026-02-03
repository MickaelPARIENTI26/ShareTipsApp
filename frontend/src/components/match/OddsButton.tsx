import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../../theme';

interface OddsButtonProps {
  label: string;
  odds: number;
  isSelected: boolean;
  disabled: boolean;
  onPress: () => void;
}

const OddsButton: React.FC<OddsButtonProps> = ({
  label,
  odds,
  isSelected,
  disabled,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.selected,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.label, isSelected && styles.selectedText]}>
        {label}
      </Text>
      <Text
        style={[
          styles.odds,
          isSelected && styles.selectedText,
          disabled && styles.disabledText,
        ]}
      >
        {odds.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        button: {
          flex: 1,
          alignItems: 'center',
          backgroundColor: colors.surfaceSecondary,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 4,
          marginHorizontal: 3,
        },
        selected: {
          backgroundColor: colors.primary,
        },
        disabled: {
          opacity: 0.5,
        },
        label: {
          fontSize: 11,
          color: colors.text,
          fontWeight: '500',
          marginBottom: 2,
          opacity: 0.7,
        },
        odds: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
        },
        selectedText: {
          color: colors.textOnPrimary,
        },
        disabledText: {
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

export default OddsButton;

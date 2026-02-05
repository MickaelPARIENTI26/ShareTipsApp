import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme, type ThemeColors } from '../../theme';

interface ConfidenceSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

const ConfidenceSelector: React.FC<ConfidenceSelectorProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const displayValue = value ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Indice de confiance (0–10)</Text>
        <View
          style={[
            styles.valueBadge,
            value == null && styles.valueBadgePlaceholder,
          ]}
        >
          <Text
            style={[
              styles.valueText,
              value == null && styles.valueTextPlaceholder,
            ]}
          >
            {value ?? '–'}
          </Text>
        </View>
      </View>
      <Slider
        testID="confidence-slider"
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={displayValue}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>5</Text>
        <Text style={styles.scaleText}>10</Text>
      </View>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 8,
        },
        labelRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
        },
        valueBadge: {
          backgroundColor: colors.primary,
          borderRadius: 6,
          minWidth: 28,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        },
        valueBadgePlaceholder: {
          backgroundColor: colors.border,
        },
        valueText: {
          color: colors.textOnPrimary,
          fontSize: 13,
          fontWeight: '800',
        },
        valueTextPlaceholder: {
          color: colors.textSecondary,
        },
        slider: {
          width: '100%',
          height: 32,
        },
        scaleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
        },
        scaleText: {
          fontSize: 10,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

export default ConfidenceSelector;

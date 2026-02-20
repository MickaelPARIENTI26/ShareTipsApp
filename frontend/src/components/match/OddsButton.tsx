import React, { useMemo, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          isSelected && styles.selected,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
      >
        <Text style={[styles.label, isSelected && styles.selectedLabel]}>
          {label}
        </Text>
        <Text
          style={[
            styles.odds,
            isSelected && styles.selectedOdds,
            disabled && styles.disabledText,
          ]}
        >
          {odds.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        buttonWrapper: {
          flex: 1,
        },
        button: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          // Pill shape with subtle primary tint
          backgroundColor: `${colors.primary}0D`, // ~5% opacity
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 8,
          // Subtle inner glow effect
          borderWidth: 1,
          borderColor: `${colors.primary}15`,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            },
            android: {
              elevation: 0,
            },
          }),
        },
        selected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        disabled: {
          opacity: 0.5,
          backgroundColor: `${colors.textTertiary}10`,
          borderColor: 'transparent',
        },
        label: {
          fontSize: 11,
          color: colors.textSecondary,
          fontWeight: '600',
          marginBottom: 3,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        selectedLabel: {
          color: `${colors.textOnPrimary}CC`,
        },
        odds: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.primary,
          letterSpacing: 0.3,
        },
        selectedOdds: {
          color: colors.textOnPrimary,
        },
        disabledText: {
          color: colors.textTertiary,
        },
      }),
    [colors]
  );

export default OddsButton;

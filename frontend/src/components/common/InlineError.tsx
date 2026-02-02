import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';

interface InlineErrorProps {
  message: string | null | undefined;
  style?: object;
  showIcon?: boolean;
}

const InlineError: React.FC<InlineErrorProps> = ({
  message,
  style,
  showIcon = false,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  if (!message) return null;

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name="alert-circle"
          size={14}
          color={colors.danger}
          style={styles.icon}
        />
      )}
      <Text style={styles.text}>{message}</Text>
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
          marginTop: 4,
          marginLeft: 4,
        },
        icon: {
          marginRight: 4,
        },
        text: {
          fontSize: 12,
          color: colors.danger,
        },
      }),
    [colors]
  );

export default InlineError;

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';

interface SportyInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  inputRef?: React.RefObject<TextInputType | null>;
}

const SportyInput: React.FC<SportyInputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  inputRef,
  value,
  onFocus,
  onBlur,
  editable = true,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return 'rgba(255, 255, 255, 0.15)';
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            isPassword && styles.inputWithPassword,
          ]}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          secureTextEntry={isPassword && !showPassword}
          selectionColor={colors.primary}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Focus glow effect */}
        {isFocused && (
          <View style={[styles.glowEffect, { backgroundColor: colors.primary }]} />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 16,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
          borderWidth: 1.5,
        },
        inputContainerFocused: {
          borderWidth: 2,
        },
        inputContainerError: {
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
        },
        inputContainerDisabled: {
          opacity: 0.5,
        },
        icon: {
          marginLeft: 16,
        },
        input: {
          flex: 1,
          paddingVertical: 16,
          paddingHorizontal: 16,
          fontSize: 16,
          color: '#FFFFFF',
        },
        inputWithIcon: {
          paddingLeft: 12,
        },
        inputWithPassword: {
          paddingRight: 50,
        },
        eyeButton: {
          position: 'absolute',
          right: 16,
          height: '100%',
          justifyContent: 'center',
        },
        glowEffect: {
          position: 'absolute',
          bottom: 0,
          left: 16,
          right: 16,
          height: 2,
          opacity: 0.5,
          borderRadius: 1,
        },
        errorContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 6,
          paddingLeft: 4,
          gap: 6,
        },
        errorText: {
          fontSize: 12,
          color: colors.danger,
        },
      }),
    [colors]
  );

export default SportyInput;

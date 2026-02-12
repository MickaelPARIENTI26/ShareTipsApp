import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
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

  // Animation values
  const focusAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Focus animation
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Animated border color
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.danger : 'rgba(255, 255, 255, 0.15)',
      error ? colors.danger : colors.primary,
    ],
  });

  // Animated border width for glow effect
  const borderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2],
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderWidth,
            transform: [{ translateX: shakeAnim }],
          },
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
          placeholderTextColor={colors.placeholder}
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
      </Animated.View>

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
          color: colors.text,
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

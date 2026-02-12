import React, { useMemo, useRef } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';

interface SportyButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const SportyButton: React.FC<SportyButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, size);

  // Animation for press effect
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const isDisabled = disabled || loading;

  const getGradientColors = (): [string, string] => {
    if (variant === 'primary') {
      return ['#2ECC71', '#27AE60'];
    }
    if (variant === 'secondary') {
      return ['#F39C12', '#D68910'];
    }
    return ['transparent', 'transparent'];
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textOnPrimary}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : size === 'medium' ? 18 : 20}
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textOnPrimary}
              style={styles.iconLeft}
            />
          )}
          <Text style={styles.text}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : size === 'medium' ? 18 : 20}
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textOnPrimary}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, isDisabled && styles.disabled]}>
        <TouchableOpacity
          testID={testID}
          style={[styles.button, styles.outlineButton, variant === 'ghost' && styles.ghostButton]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={0.8}
          accessibilityLabel={accessibilityLabel || title}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled }}
          accessibilityHint={accessibilityHint}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, isDisabled && styles.disabled]}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        accessibilityHint={accessibilityHint}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {renderContent()}
          {/* Shine effect */}
          <View style={styles.shineEffect} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const useStyles = (colors: ThemeColors, variant: string, size: string) =>
  useMemo(
    () =>
      StyleSheet.create({
        button: {
          borderRadius: 16,
          paddingVertical: size === 'small' ? 10 : size === 'medium' ? 14 : 18,
          paddingHorizontal: size === 'small' ? 16 : size === 'medium' ? 24 : 32,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        },
        outlineButton: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        },
        ghostButton: {
          borderWidth: 0,
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
        },
        disabled: {
          opacity: 0.5,
        },
        contentContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        text: {
          fontSize: size === 'small' ? 14 : size === 'medium' ? 15 : 17,
          fontWeight: '700',
          color: variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textOnPrimary,
          letterSpacing: 0.5,
        },
        iconLeft: {
          marginRight: 8,
        },
        iconRight: {
          marginLeft: 8,
        },
        shineEffect: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
      }),
    [colors, variant, size]
  );

export default SportyButton;

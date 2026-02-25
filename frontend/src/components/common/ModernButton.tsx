/**
 * ModernButton — Premium Button Component
 *
 * A versatile button component with multiple visual styles:
 * - primary: Green gradient with glow
 * - accent: Orange gradient with glow
 * - secondary: Surface background with border
 * - ghost: Transparent with text
 * - danger: Red gradient
 *
 * Supports loading state, icons, and press animations.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  effectShadows,
  effectGradients,
  springConfigs,
  platformShadow,
  createGlow,
  radius,
  spacing,
  size as sizeTokens,
  typography,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconPosition = 'left' | 'right';

export interface ModernButtonProps {
  /** Button text */
  children: string;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon component */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: IconPosition;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Additional button styles */
  style?: StyleProp<ViewStyle>;
  /** Additional text styles */
  textStyle?: StyleProp<TextStyle>;
  /** Test ID */
  testID?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const VARIANT_GRADIENTS: Record<ButtonVariant, readonly string[] | null> = {
  primary: effectGradients.primary.colors,
  accent: effectGradients.accent.colors,
  secondary: null,
  ghost: null,
  danger: effectGradients.danger.colors,
};

const VARIANT_TEXT_COLORS: Record<ButtonVariant, 'dark' | 'light' | 'primary' | 'danger'> = {
  primary: 'dark',
  accent: 'dark',
  secondary: 'primary',
  ghost: 'primary',
  danger: 'light',
};

const SIZE_CONFIG: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }> = {
  sm: {
    height: sizeTokens.button.sm.height,
    paddingHorizontal: sizeTokens.button.sm.paddingHorizontal,
    fontSize: 14,
    iconSize: 16,
  },
  md: {
    height: sizeTokens.button.md.height,
    paddingHorizontal: sizeTokens.button.md.paddingHorizontal,
    fontSize: 16,
    iconSize: 20,
  },
  lg: {
    height: sizeTokens.button.lg.height,
    paddingHorizontal: sizeTokens.button.lg.paddingHorizontal,
    fontSize: 18,
    iconSize: 24,
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
  onLongPress,
  style,
  textStyle,
  testID,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;
  const sizeConfig = SIZE_CONFIG[size];
  const gradientColors = VARIANT_GRADIENTS[variant];
  const textColorType = VARIANT_TEXT_COLORS[variant];

  // ── Press Handlers ─────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        ...springConfigs.button,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDisabled, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...springConfigs.snappy,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDisabled, scaleAnim, opacityAnim]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    onPress?.();
  }, [isDisabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (isDisabled) return;
    onLongPress?.();
  }, [isDisabled, onLongPress]);

  // ── Style Calculations ─────────────────────────────────────────
  const getTextColor = (): string => {
    if (isDisabled) return colors.textMuted;
    switch (textColorType) {
      case 'dark':
        return '#000000';
      case 'light':
        return '#FFFFFF';
      case 'primary':
        return colors.primary;
      case 'danger':
        return '#FFFFFF';
      default:
        return colors.text;
    }
  };

  const getShadowStyle = () => {
    if (isDisabled) return {};
    switch (variant) {
      case 'primary':
        return platformShadow(effectShadows.glowPrimarySubtle);
      case 'accent':
        return platformShadow(effectShadows.glowAccentSubtle);
      case 'danger':
        return platformShadow(effectShadows.glowDangerSubtle);
      case 'secondary':
        return platformShadow(effectShadows.button);
      default:
        return {};
    }
  };

  const getBackgroundStyle = (): ViewStyle => {
    if (variant === 'secondary') {
      return {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: isDisabled ? colors.border : colors.primary,
      };
    }
    if (variant === 'ghost') {
      return {
        backgroundColor: 'transparent',
      };
    }
    // Gradient variants use LinearGradient
    return {
      backgroundColor: 'transparent',
    };
  };

  const getLoaderColor = (): string => {
    switch (textColorType) {
      case 'dark':
        return '#000000';
      case 'light':
      case 'danger':
        return '#FFFFFF';
      case 'primary':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  // ── Render Content ─────────────────────────────────────────────
  const renderContent = () => {
    const textColor = getTextColor();
    const iconGap = spacing.sm;

    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getLoaderColor()}
        />
      );
    }

    const textElement = (
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: textColor,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    const iconElement = (
      <View
        style={[
          styles.iconContainer,
          {
            marginRight: iconPosition === 'left' ? iconGap : 0,
            marginLeft: iconPosition === 'right' ? iconGap : 0,
          },
        ]}
      >
        {icon}
      </View>
    );

    return (
      <View style={styles.contentRow}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  // ── Button Inner (with or without gradient) ────────────────────
  const renderButtonInner = () => {
    const innerStyle: ViewStyle = {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: radius.base,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    if (gradientColors) {
      return (
        <LinearGradient
          colors={gradientColors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContainer, innerStyle]}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.innerContainer, innerStyle, getBackgroundStyle()]}>
        {renderContent()}
      </View>
    );
  };

  // ── Main Button Container ──────────────────────────────────────
  const buttonContent = (
    <Animated.View
      style={[
        styles.container,
        { borderRadius: radius.base },
        getShadowStyle(),
        fullWidth && styles.fullWidth,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        isDisabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {renderButtonInner()}
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {buttonContent}
    </TouchableWithoutFeedback>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  innerContainer: {
    overflow: 'hidden',
  },
  gradientContainer: {
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

// ═══════════════════════════════════════════════════════════════
// PRESET VARIANTS (for convenience)
// ═══════════════════════════════════════════════════════════════

/** Primary gradient button */
export const PrimaryButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="primary" {...props} />
);

/** Accent gradient button */
export const AccentButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="accent" {...props} />
);

/** Secondary outlined button */
export const SecondaryButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="secondary" {...props} />
);

/** Ghost transparent button */
export const GhostButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="ghost" {...props} />
);

/** Danger red button */
export const DangerButton: React.FC<Omit<ModernButtonProps, 'variant'>> = (props) => (
  <ModernButton variant="danger" {...props} />
);

export default ModernButton;

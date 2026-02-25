/**
 * ModernCard — Premium Card Component
 *
 * A versatile card component with multiple visual styles:
 * - default: Simple card with subtle shadow
 * - elevated: Elevated card with stronger shadow
 * - glass: Glassmorphism effect
 * - gradient: Gradient background
 *
 * Supports press animations, gradients, and glassmorphism.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  effectShadows,
  effectGlass,
  effectGradients,
  springConfigs,
  platformShadow,
  type GlassStyle,
  radius,
  spacing,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient';

export type GradientName = keyof typeof effectGradients;

export type GlassName = keyof typeof effectGlass;

export interface ModernCardProps {
  /** Visual style variant */
  variant?: CardVariant;
  /** Gradient preset name (for gradient variant or as overlay) */
  gradient?: GradientName;
  /** Glass effect preset name */
  glass?: GlassName;
  /** Enable press animation */
  pressable?: boolean;
  /** Press callback */
  onPress?: () => void;
  /** Long press callback */
  onLongPress?: () => void;
  /** Card content */
  children: React.ReactNode;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Content container styles */
  contentStyle?: StyleProp<ViewStyle>;
  /** Border radius override */
  borderRadius?: number;
  /** Padding override */
  padding?: number;
  /** Disable shadow */
  noShadow?: boolean;
  /** Active opacity when pressed (default: 1 - uses scale) */
  activeOpacity?: number;
  /** Scale when pressed (default: 0.98) */
  pressScale?: number;
  /** Disabled state */
  disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const ModernCard: React.FC<ModernCardProps> = ({
  variant = 'default',
  gradient,
  glass,
  pressable = false,
  onPress,
  onLongPress,
  children,
  style,
  contentStyle,
  borderRadius: customRadius,
  padding: customPadding,
  noShadow = false,
  activeOpacity = 1,
  pressScale = 0.98,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Press Handlers ─────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (!pressable || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      ...springConfigs.button,
    }).start();
  }, [pressable, disabled, scaleAnim, pressScale]);

  const handlePressOut = useCallback(() => {
    if (!pressable || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.snappy,
    }).start();
  }, [pressable, disabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled) return;
    onLongPress?.();
  }, [disabled, onLongPress]);

  // ── Style Calculations ─────────────────────────────────────────
  const cardRadius = customRadius ?? radius.lg;
  const cardPadding = customPadding ?? spacing.lg;

  // Get shadow based on variant
  const getShadowStyle = () => {
    if (noShadow) return {};
    switch (variant) {
      case 'elevated':
        return platformShadow(effectShadows.cardElevated);
      case 'glass':
        return platformShadow(effectShadows.card);
      case 'gradient':
        return platformShadow(effectShadows.cardElevated);
      default:
        return platformShadow(effectShadows.cardSubtle);
    }
  };

  // Get background style based on variant and glass prop
  const getBackgroundStyle = (): ViewStyle => {
    // If glass prop is specified, use it
    if (glass && effectGlass[glass]) {
      const glassStyle = effectGlass[glass] as GlassStyle;
      return {
        backgroundColor: glassStyle.backgroundColor,
        borderColor: glassStyle.borderColor,
        borderWidth: glassStyle.borderWidth,
      };
    }

    // Otherwise, use variant defaults
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: effectGlass.card.backgroundColor,
          borderColor: effectGlass.card.borderColor,
          borderWidth: effectGlass.card.borderWidth,
        };
      case 'elevated':
        return {
          backgroundColor: colors.cardBg,
          borderColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
        };
      case 'gradient':
        // Gradient uses LinearGradient, so transparent base
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.cardBg,
        };
    }
  };

  // Get gradient config
  const getGradientConfig = () => {
    if (gradient && effectGradients[gradient]) {
      return effectGradients[gradient];
    }
    if (variant === 'gradient') {
      return effectGradients.card;
    }
    return null;
  };

  const gradientConfig = getGradientConfig();
  const backgroundStyle = getBackgroundStyle();
  const shadowStyle = getShadowStyle();

  // ── Render Content ─────────────────────────────────────────────
  const renderContent = () => (
    <View style={[styles.content, { padding: cardPadding }, contentStyle]}>
      {children}
    </View>
  );

  // ── Card Inner (with or without gradient) ──────────────────────
  const renderCardInner = () => {
    if (gradientConfig) {
      return (
        <LinearGradient
          colors={gradientConfig.colors as unknown as string[]}
          start={gradientConfig.start}
          end={gradientConfig.end}
          style={[
            styles.gradientContainer,
            { borderRadius: cardRadius },
            // Add glass border if using glass variant with gradient
            glass && effectGlass[glass]
              ? {
                  borderColor: (effectGlass[glass] as GlassStyle).borderColor,
                  borderWidth: (effectGlass[glass] as GlassStyle).borderWidth,
                }
              : null,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.innerContainer,
          { borderRadius: cardRadius },
          backgroundStyle,
        ]}
      >
        {renderContent()}
      </View>
    );
  };

  // ── Main Card Container ────────────────────────────────────────
  const cardContent = (
    <Animated.View
      style={[
        styles.container,
        { borderRadius: cardRadius },
        shadowStyle,
        // Only apply background if no gradient
        !gradientConfig && backgroundStyle,
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderCardInner()}
    </Animated.View>
  );

  // ── Wrap with Touchable if Pressable ───────────────────────────
  if (pressable || onPress || onLongPress) {
    return (
      <TouchableWithoutFeedback
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {cardContent}
      </TouchableWithoutFeedback>
    );
  }

  return cardContent;
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  innerContainer: {
    overflow: 'hidden',
  },
  gradientContainer: {
    overflow: 'hidden',
  },
  content: {
    // Content receives padding from props
  },
  disabled: {
    opacity: 0.5,
  },
});

// ═══════════════════════════════════════════════════════════════
// PRESET VARIANTS (for convenience)
// ═══════════════════════════════════════════════════════════════

/** Elevated card with primary glow on press */
export const ElevatedCard: React.FC<Omit<ModernCardProps, 'variant'>> = (props) => (
  <ModernCard variant="elevated" {...props} />
);

/** Glass card with subtle blur effect */
export const GlassCard: React.FC<Omit<ModernCardProps, 'variant'>> = (props) => (
  <ModernCard variant="glass" {...props} />
);

/** Gradient card with customizable gradient */
export const GradientCard: React.FC<Omit<ModernCardProps, 'variant'>> = (props) => (
  <ModernCard variant="gradient" {...props} />
);

/** Primary gradient card */
export const PrimaryCard: React.FC<Omit<ModernCardProps, 'variant' | 'gradient'>> = (props) => (
  <ModernCard variant="gradient" gradient="primarySubtle" {...props} />
);

/** Accent gradient card */
export const AccentCard: React.FC<Omit<ModernCardProps, 'variant' | 'gradient'>> = (props) => (
  <ModernCard variant="gradient" gradient="accentSubtle" {...props} />
);

/** Premium/VIP gradient card */
export const PremiumCard: React.FC<Omit<ModernCardProps, 'variant' | 'gradient'>> = (props) => (
  <ModernCard variant="gradient" gradient="premiumSubtle" {...props} />
);

export default ModernCard;

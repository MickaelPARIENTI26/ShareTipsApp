/**
 * PremiumRefreshControl — Composant de rafraichissement premium
 *
 * RefreshControl personnalise avec animation de rotation,
 * gradient et haptic feedback.
 *
 * @example
 * // Usage dans une FlatList
 * <FlatList
 *   refreshControl={
 *     <PremiumRefreshControl
 *       refreshing={refreshing}
 *       onRefresh={handleRefresh}
 *     />
 *   }
 * />
 *
 * @example
 * // Variante avec icone personnalisee
 * <PremiumRefreshControl
 *   refreshing={refreshing}
 *   onRefresh={handleRefresh}
 *   icon="football"
 *   variant="accent"
 * />
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  RefreshControl,
  View,
  Animated,
  StyleSheet,
  Platform,
  type RefreshControlProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  effectGradients,
  effectShadows,
} from '../../theme';
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes de couleur */
export type RefreshVariant = 'primary' | 'accent' | 'success' | 'glass';

/** Props du composant */
export interface PremiumRefreshControlProps
  extends Omit<RefreshControlProps, 'colors' | 'tintColor' | 'title' | 'titleColor'> {
  /** Variante de couleur */
  variant?: RefreshVariant;
  /** Icone personnalisee */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Taille de l'icone */
  iconSize?: number;
  /** Afficher le glow */
  showGlow?: boolean;
  /** Haptic feedback au debut du refresh */
  hapticOnRefresh?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const GRADIENT_CONFIG: Record<RefreshVariant, { colors: readonly string[] }> = {
  primary: { colors: effectGradients.primary.colors },
  accent: { colors: effectGradients.accent.colors },
  success: { colors: effectGradients.success.colors },
  glass: { colors: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'] },
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const PremiumRefreshControl: React.FC<PremiumRefreshControlProps> = ({
  refreshing,
  onRefresh,
  variant = 'primary',
  icon = 'sync',
  iconSize = 20,
  showGlow = true,
  hapticOnRefresh = true,
  ...restProps
}) => {
  const { colors } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevRefreshing = useRef(refreshing);

  // Animation de rotation continue pendant le refresh
  useEffect(() => {
    if (refreshing) {
      // Scale up animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Rotation continue
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();

      // Glow pulse
      if (showGlow) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      return () => {
        rotateLoop.stop();
      };
    } else {
      // Reset animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      rotateAnim.setValue(0);
    }
  }, [refreshing, rotateAnim, scaleAnim, glowAnim, showGlow]);

  // Haptic feedback au debut du refresh
  useEffect(() => {
    if (refreshing && !prevRefreshing.current && hapticOnRefresh) {
      haptics.light();
    }
    prevRefreshing.current = refreshing;
  }, [refreshing, hapticOnRefresh]);

  // Interpolation de rotation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Styles
  const styles = useStyles(colors, variant, showGlow);
  const gradientColors = GRADIENT_CONFIG[variant].colors;

  // Sur Android, on utilise le RefreshControl natif avec les couleurs du theme
  // Sur iOS, on peut personnaliser davantage
  if (Platform.OS === 'android') {
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[colors.primary, colors.accent, colors.success]}
        progressBackgroundColor={colors.surface}
        {...restProps}
      />
    );
  }

  // iOS - RefreshControl personnalise
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      {...restProps}
    >
      <View style={styles.container}>
        {/* Glow effect */}
        {showGlow && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowAnim,
                backgroundColor: colors.primary,
              },
            ]}
          />
        )}

        {/* Animated icon container */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ rotate: spin }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Ionicons
              name={icon}
              size={iconSize}
              color={variant === 'glass' ? colors.text : colors.textOnPrimary}
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </RefreshControl>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: RefreshVariant,
  showGlow: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
        },
        glow: {
          position: 'absolute',
          width: 60,
          height: 60,
          borderRadius: 30,
          opacity: 0.3,
        },
        iconWrapper: {
          ...(showGlow
            ? Platform.select({
                ios: {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                },
                android: {},
              })
            : {}),
          ...(Platform.OS === 'android' && showGlow ? { elevation: 6 } : {}),
        },
        gradient: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'glass' ? 1 : 0,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
      }),
    [colors, variant, showGlow]
  );

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * RefreshControl primaire (defaut)
 */
export const PrimaryRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant'>
> = (props) => <PremiumRefreshControl {...props} variant="primary" />;

/**
 * RefreshControl accent
 */
export const AccentRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant'>
> = (props) => <PremiumRefreshControl {...props} variant="accent" />;

/**
 * RefreshControl success
 */
export const SuccessRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant'>
> = (props) => <PremiumRefreshControl {...props} variant="success" />;

/**
 * RefreshControl glass
 */
export const GlassRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant'>
> = (props) => <PremiumRefreshControl {...props} variant="glass" />;

/**
 * RefreshControl pour les matchs (avec icone football)
 */
export const MatchRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant' | 'icon'>
> = (props) => (
  <PremiumRefreshControl {...props} variant="primary" icon="football" />
);

/**
 * RefreshControl pour le wallet
 */
export const WalletRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant' | 'icon'>
> = (props) => (
  <PremiumRefreshControl {...props} variant="success" icon="wallet" />
);

/**
 * RefreshControl pour les tickets
 */
export const TicketRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant' | 'icon'>
> = (props) => (
  <PremiumRefreshControl {...props} variant="accent" icon="receipt" />
);

/**
 * RefreshControl pour le marketplace
 */
export const MarketRefreshControl: React.FC<
  Omit<PremiumRefreshControlProps, 'variant' | 'icon'>
> = (props) => (
  <PremiumRefreshControl {...props} variant="primary" icon="storefront" />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(PremiumRefreshControl);

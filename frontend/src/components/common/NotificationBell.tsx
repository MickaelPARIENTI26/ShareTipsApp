/**
 * NotificationBell — Icône Notification Premium
 *
 * Bouton de notification avec badge compteur et animations.
 * Design premium avec effets visuels et animations fluides.
 *
 * Fonctionnalités :
 * - Badge compteur avec animation pulse
 * - Variantes : default, filled, outline, glass
 * - Tailles : sm, md, lg
 * - Animation de pression (scale)
 * - Animation shake quand nouvelles notifs
 * - Effet glassmorphism optionnel
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  springConfigs,
} from '../../theme';
import { useNotificationStore } from '../../store/notification.store';
import type { RootStackParamList } from '../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du bouton */
export type NotificationBellVariant = 'default' | 'filled' | 'outline' | 'glass';

/** Tailles disponibles */
export type NotificationBellSize = 'sm' | 'md' | 'lg';

/** Position du badge */
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface NotificationBellProps {
  /** Taille de l'icône (défaut: 24, compatibilité) */
  size?: number;
  /** Couleur personnalisée de l'icône */
  color?: string;
  /** Variante visuelle (défaut: 'default') */
  variant?: NotificationBellVariant;
  /** Taille prédéfinie (remplace size si fourni) */
  presetSize?: NotificationBellSize;
  /** Position du badge (défaut: 'top-right') */
  badgePosition?: BadgePosition;
  /** Afficher le badge même si count = 0 (défaut: false) */
  showBadgeAlways?: boolean;
  /** Activer l'animation pulse du badge (défaut: true) */
  pulseBadge?: boolean;
  /** Activer l'animation shake quand count change (défaut: true) */
  shakeOnUpdate?: boolean;
  /** Afficher animation de pression (défaut: true) */
  animated?: boolean;
  /** Effet glassmorphism (défaut: false, auto si variant='glass') */
  glassBorder?: boolean;
  /** Désactivé (défaut: false) */
  disabled?: boolean;
  /** Callback personnalisé au press (remplace navigation) */
  onPress?: () => void;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
  /** Label d'accessibilité */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SIZE_CONFIG: Record<NotificationBellSize, { iconSize: number; containerSize: number; badgeSize: number; badgeFontSize: number }> = {
  sm: { iconSize: 20, containerSize: 36, badgeSize: 16, badgeFontSize: 9 },
  md: { iconSize: 24, containerSize: 44, badgeSize: 18, badgeFontSize: 10 },
  lg: { iconSize: 28, containerSize: 52, badgeSize: 22, badgeFontSize: 11 },
};

const BADGE_POSITION_MAP: Record<BadgePosition, { top?: number; right?: number; bottom?: number; left?: number }> = {
  'top-right': { top: -4, right: -4 },
  'top-left': { top: -4, left: -4 },
  'bottom-right': { bottom: -4, right: -4 },
  'bottom-left': { bottom: -4, left: -4 },
};

const VARIANT_CONFIG: Record<NotificationBellVariant, {
  iconName: keyof typeof Ionicons.glyphMap;
  hasBg: boolean;
  isGlass: boolean;
}> = {
  default: { iconName: 'notifications-outline', hasBg: false, isGlass: false },
  filled: { iconName: 'notifications', hasBg: true, isGlass: false },
  outline: { iconName: 'notifications-outline', hasBg: true, isGlass: false },
  glass: { iconName: 'notifications-outline', hasBg: true, isGlass: true },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  color,
  variant = 'default',
  presetSize,
  badgePosition = 'top-right',
  showBadgeAlways = false,
  pulseBadge = true,
  shakeOnUpdate = true,
  animated = true,
  glassBorder: customGlassBorder,
  disabled = false,
  onPress: customOnPress,
  style,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // ── Animations ─────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const badgePulseAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(unreadCount);

  // ── Configuration ──────────────────────────────────────────────
  const variantConfig = VARIANT_CONFIG[variant];
  const sizeConfig = presetSize ? SIZE_CONFIG[presetSize] : null;
  const iconSize = sizeConfig?.iconSize ?? size;
  const containerSize = sizeConfig?.containerSize ?? size + 20;
  const badgeSize = sizeConfig?.badgeSize ?? 18;
  const badgeFontSize = sizeConfig?.badgeFontSize ?? 10;
  const glassBorder = customGlassBorder ?? variantConfig.isGlass;

  const iconColor = color ?? (variant === 'filled' ? colors.textInverse : colors.text);

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(
    colors,
    variant,
    containerSize,
    badgeSize,
    badgeFontSize,
    badgePosition,
    glassBorder,
    disabled
  );

  // ── Fetch notifications ────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  // ── Shake animation quand count change ─────────────────────────
  useEffect(() => {
    if (shakeOnUpdate && unreadCount > prevCountRef.current && unreadCount > 0) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, shakeOnUpdate, shakeAnim]);

  // ── Badge pulse animation ──────────────────────────────────────
  useEffect(() => {
    if (pulseBadge && unreadCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(badgePulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      badgePulseAnim.setValue(1);
    }
  }, [pulseBadge, unreadCount, badgePulseAnim]);

  // ── Handlers ───────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (!animated || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      ...springConfigs.button,
    }).start();
  }, [animated, disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!animated || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.snappy,
    }).start();
  }, [animated, disabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (customOnPress) {
      customOnPress();
    } else {
      navigation.navigate('Notifications');
    }
  }, [disabled, customOnPress, navigation]);

  // ── Badge text ─────────────────────────────────────────────────
  const badgeText = useMemo(() => {
    if (unreadCount > 99) return '99+';
    return unreadCount.toString();
  }, [unreadCount]);

  // ── Show badge ─────────────────────────────────────────────────
  const showBadge = showBadgeAlways || unreadCount > 0;

  // ── Accessibility label ────────────────────────────────────────
  const a11yLabel = useMemo(() => {
    if (accessibilityLabel) return accessibilityLabel;
    if (unreadCount === 0) return 'Notifications';
    if (unreadCount === 1) return '1 notification non lue';
    return `${unreadCount} notifications non lues`;
  }, [accessibilityLabel, unreadCount]);

  // ── Render content ─────────────────────────────────────────────
  const renderContent = () => (
    <>
      {/* Icon */}
      <Ionicons name={variantConfig.iconName} size={iconSize} color={iconColor} />

      {/* Badge */}
      {showBadge && (
        <Animated.View
          style={[
            styles.badge,
            { transform: [{ scale: badgePulseAnim }] },
          ]}
        >
          <Text style={styles.badgeText} numberOfLines={1}>
            {badgeText}
          </Text>
        </Animated.View>
      )}

      {/* Glass border overlay */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled }}
      >
        {variantConfig.isGlass ? (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          renderContent()
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: NotificationBellVariant,
  containerSize: number,
  badgeSize: number,
  badgeFontSize: number,
  badgePosition: BadgePosition,
  glassBorder: boolean,
  disabled: boolean
) =>
  useMemo(() => {
    const positionStyles = BADGE_POSITION_MAP[badgePosition];
    const hasBg = VARIANT_CONFIG[variant].hasBg;
    const isGlass = VARIANT_CONFIG[variant].isGlass;

    return StyleSheet.create({
      container: {
        width: containerSize,
        height: containerSize,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        // Background based on variant
        backgroundColor: hasBg
          ? isGlass
            ? 'transparent'
            : variant === 'filled'
              ? colors.primary
              : colors.surfaceElevated
          : 'transparent',
        // Border for outline variant
        ...(variant === 'outline' && {
          borderWidth: 1.5,
          borderColor: colors.border,
        }),
        // Opacity for disabled
        opacity: disabled ? 0.5 : 1,
      },
      gradientContainer: {
        width: '100%',
        height: '100%',
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
      },
      badge: {
        position: 'absolute',
        ...positionStyles,
        minWidth: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        backgroundColor: colors.accent,
        borderWidth: 2,
        borderColor: colors.background,
        paddingHorizontal: spacing.xxs,
        alignItems: 'center',
        justifyContent: 'center',
        // Glow effect
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
      },
      badgeText: {
        fontSize: badgeFontSize,
        fontWeight: '700',
        fontFamily: typography.badge?.fontFamily ?? typography.caption.fontFamily,
        color: '#FFFFFF',
        textAlign: 'center',
        includeFontPadding: false,
      },
      glassBorderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: radius.xl,
        borderWidth: effectGlass.light.borderWidth,
        borderColor: effectGlass.light.borderColor,
      },
    });
  }, [colors, variant, containerSize, badgeSize, badgeFontSize, badgePosition, glassBorder, disabled]);

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Cloche par défaut (outline icon) */
export const DefaultBell: React.FC<Omit<NotificationBellProps, 'variant'>> = (props) => (
  <NotificationBell variant="default" {...props} />
);

/** Cloche avec fond rempli */
export const FilledBell: React.FC<Omit<NotificationBellProps, 'variant'>> = (props) => (
  <NotificationBell variant="filled" {...props} />
);

/** Cloche avec bordure */
export const OutlineBell: React.FC<Omit<NotificationBellProps, 'variant'>> = (props) => (
  <NotificationBell variant="outline" {...props} />
);

/** Cloche glassmorphism */
export const GlassBell: React.FC<Omit<NotificationBellProps, 'variant'>> = (props) => (
  <NotificationBell variant="glass" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(NotificationBell);

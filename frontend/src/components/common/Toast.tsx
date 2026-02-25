/**
 * Toast — Systeme de notifications toast premium
 *
 * Notifications toast avec glassmorphism, animations et haptics.
 * Utilise Zustand pour la gestion d'etat globale.
 *
 * @example
 * // Dans App.tsx
 * <ToastProvider />
 *
 * @example
 * // Usage avec hook
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Action reussie !' });
 *
 * @example
 * // Usage direct avec store
 * import { toastStore } from './Toast';
 * toastStore.getState().show({ type: 'error', message: 'Erreur' });
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { create } from 'zustand';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  effectGradients,
  effectShadows,
  springConfigs,
} from '../../theme';
import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Types de toast */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Position du toast */
export type ToastPosition = 'top' | 'bottom';

/** Configuration d'un toast */
export interface ToastConfig {
  /** Identifiant unique */
  id: string;
  /** Type de toast */
  type: ToastType;
  /** Message principal */
  message: string;
  /** Titre optionnel */
  title?: string;
  /** Duree d'affichage en ms (defaut: 3000) */
  duration?: number;
  /** Action optionnelle */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Icone personnalisee */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Callback a la fermeture */
  onClose?: () => void;
}

/** Props pour afficher un toast */
export type ShowToastConfig = Omit<ToastConfig, 'id'>;

/** Store Zustand */
interface ToastStore {
  toasts: ToastConfig[];
  position: ToastPosition;
  show: (config: ShowToastConfig) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  setPosition: (position: ToastPosition) => void;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const DEFAULT_DURATION = 3000;

const TYPE_CONFIG: Record<
  ToastType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    colorKey: keyof ThemeColors;
    gradientColors: readonly string[];
  }
> = {
  success: {
    icon: 'checkmark-circle',
    colorKey: 'success',
    gradientColors: effectGradients.success.colors,
  },
  error: {
    icon: 'alert-circle',
    colorKey: 'danger',
    gradientColors: effectGradients.danger.colors,
  },
  warning: {
    icon: 'warning',
    colorKey: 'warning',
    gradientColors: effectGradients.warning.colors,
  },
  info: {
    icon: 'information-circle',
    colorKey: 'info',
    gradientColors: effectGradients.info.colors,
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE ZUSTAND
// ═══════════════════════════════════════════════════════════════

let toastIdCounter = 0;

export const toastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  position: 'top',

  show: (config) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastConfig = {
      ...config,
      id,
      duration: config.duration ?? DEFAULT_DURATION,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Haptic feedback selon le type
    switch (config.type) {
      case 'success':
        haptics.success();
        break;
      case 'error':
        haptics.error();
        break;
      case 'warning':
        haptics.warning();
        break;
      case 'info':
        haptics.light();
        break;
    }

    return id;
  },

  hide: (id) => {
    const toast = get().toasts.find((t) => t.id === id);
    toast?.onClose?.();

    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  hideAll: () => {
    get().toasts.forEach((toast) => toast.onClose?.());
    set({ toasts: [] });
  },

  setPosition: (position) => {
    set({ position });
  },
}));

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export const useToast = () => {
  const { show, hide, hideAll, setPosition } = toastStore.getState();

  return {
    showToast: show,
    hideToast: hide,
    hideAllToasts: hideAll,
    setToastPosition: setPosition,
    // Shortcuts
    success: (message: string, options?: Partial<ShowToastConfig>) =>
      show({ type: 'success', message, ...options }),
    error: (message: string, options?: Partial<ShowToastConfig>) =>
      show({ type: 'error', message, ...options }),
    warning: (message: string, options?: Partial<ShowToastConfig>) =>
      show({ type: 'warning', message, ...options }),
    info: (message: string, options?: Partial<ShowToastConfig>) =>
      show({ type: 'info', message, ...options }),
  };
};

// ═══════════════════════════════════════════════════════════════
// TOAST ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ToastItemProps {
  toast: ToastConfig;
  index: number;
  position: ToastPosition;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = React.memo(
  ({ toast, index, position, onHide }) => {
    const { colors, isDark } = useTheme();
    const styles = useToastStyles(colors, position);
    const config = TYPE_CONFIG[toast.type];
    const iconName = toast.icon ?? config.icon;
    const accentColor = colors[config.colorKey] as string;

    // Animations
    const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    // Auto-dismiss timer
    useEffect(() => {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          ...springConfigs.snappy,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...springConfigs.bouncy,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);

      return () => clearTimeout(timer);
    }, []);

    const handleDismiss = useCallback(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === 'top' ? -100 : 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide(toast.id);
      });
    }, [toast.id, onHide, translateY, opacity, scale, position]);

    const handleAction = useCallback(() => {
      toast.action?.onPress();
      handleDismiss();
    }, [toast.action, handleDismiss]);

    const animatedStyle = {
      transform: [{ translateY }, { scale }],
      opacity,
      marginTop: index > 0 ? spacing.sm : 0,
    };

    const renderContent = () => (
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name={iconName} size={20} color={accentColor} />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          {toast.title && <Text style={styles.title}>{toast.title}</Text>}
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {/* Action button or close */}
        {toast.action ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${accentColor}20` }]}
            onPress={handleAction}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: accentColor }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Accent line */}
        <LinearGradient
          colors={config.gradientColors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      </View>
    );

    return (
      <Animated.View style={[styles.toastContainer, animatedStyle]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurView}>
            {renderContent()}
          </BlurView>
        ) : (
          <View style={[styles.androidContainer, { backgroundColor: colors.surface }]}>
            {renderContent()}
          </View>
        )}
      </Animated.View>
    );
  }
);

ToastItem.displayName = 'ToastItem';

// ═══════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════

export const ToastProvider: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toasts = toastStore((state) => state.toasts);
  const position = toastStore((state) => state.position);
  const hide = toastStore((state) => state.hide);

  const containerStyle: StyleProp<ViewStyle> = useMemo(
    () => [
      styles.container,
      position === 'top'
        ? { top: insets.top + spacing.sm }
        : { bottom: insets.bottom + spacing.sm },
    ],
    [position, insets]
  );

  if (toasts.length === 0) return null;

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          position={position}
          onHide={hide}
        />
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
});

const useToastStyles = (colors: ThemeColors, position: ToastPosition) =>
  useMemo(
    () =>
      StyleSheet.create({
        toastContainer: {
          width: TOAST_WIDTH,
          maxWidth: 400,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        blurView: {
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.light.borderColor,
        },
        androidContainer: {
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          paddingLeft: spacing.md + 4, // Account for accent line
          gap: spacing.sm,
        },
        iconWrapper: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textContainer: {
          flex: 1,
          gap: 2,
        },
        title: {
          ...typography.label,
          color: colors.text,
          fontWeight: '700',
        },
        message: {
          ...typography.body,
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        actionButton: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.md,
        },
        actionText: {
          ...typography.label,
          fontWeight: '600',
        },
        closeButton: {
          padding: spacing.xs,
        },
        accentLine: {
          position: 'absolute',
          left: 0,
          top: spacing.sm,
          bottom: spacing.sm,
          width: 4,
          borderRadius: 2,
        },
      }),
    [colors, position]
  );

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Affiche un toast de succes
 */
export const showSuccessToast = (message: string, options?: Partial<ShowToastConfig>) =>
  toastStore.getState().show({ type: 'success', message, ...options });

/**
 * Affiche un toast d'erreur
 */
export const showErrorToast = (message: string, options?: Partial<ShowToastConfig>) =>
  toastStore.getState().show({ type: 'error', message, ...options });

/**
 * Affiche un toast d'avertissement
 */
export const showWarningToast = (message: string, options?: Partial<ShowToastConfig>) =>
  toastStore.getState().show({ type: 'warning', message, ...options });

/**
 * Affiche un toast d'info
 */
export const showInfoToast = (message: string, options?: Partial<ShowToastConfig>) =>
  toastStore.getState().show({ type: 'info', message, ...options });

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default ToastProvider;

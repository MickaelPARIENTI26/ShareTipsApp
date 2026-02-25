/**
 * ShareTips Design System — Visual Effects
 *
 * Reusable effects for premium betting app UI.
 * Includes gradients, shadows, glassmorphism, and animations.
 */

import { Easing, Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// GRADIENTS — LinearGradient Compatible
// ═══════════════════════════════════════════════════════════════

export const effectGradients = {
  // ── Brand Gradients ─────────────────────────────────────────
  primary: {
    colors: ['#1ED760', '#15803D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  primaryVertical: {
    colors: ['#1ED760', '#15803D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  primarySubtle: {
    colors: ['rgba(30, 215, 96, 0.25)', 'rgba(21, 128, 61, 0.10)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  accent: {
    colors: ['#FF9F1C', '#E68A00'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  accentVertical: {
    colors: ['#FF9F1C', '#E68A00'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  accentSubtle: {
    colors: ['rgba(255, 159, 28, 0.25)', 'rgba(230, 138, 0, 0.10)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // ── Card Gradients ──────────────────────────────────────────
  card: {
    colors: ['rgba(30, 30, 30, 0.95)', 'rgba(38, 38, 38, 0.98)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  cardElevated: {
    colors: ['rgba(42, 42, 42, 1)', 'rgba(48, 48, 48, 1)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  cardPremium: {
    colors: ['rgba(50, 50, 55, 1)', 'rgba(35, 35, 40, 1)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  cardGlass: {
    colors: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // ── Semantic Gradients ──────────────────────────────────────
  success: {
    colors: ['#34D399', '#1ED760'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  successSubtle: {
    colors: ['rgba(52, 211, 153, 0.20)', 'rgba(30, 215, 96, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  danger: {
    colors: ['#F87171', '#EF4444', '#DC2626'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dangerSubtle: {
    colors: ['rgba(248, 113, 113, 0.20)', 'rgba(239, 68, 68, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  warning: {
    colors: ['#FBBF24', '#F59E0B', '#D97706'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warningSubtle: {
    colors: ['rgba(251, 191, 36, 0.20)', 'rgba(245, 158, 11, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  info: {
    colors: ['#60A5FA', '#3B82F6', '#2563EB'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  infoSubtle: {
    colors: ['rgba(96, 165, 250, 0.20)', 'rgba(59, 130, 246, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // ── Premium/VIP Gradients ───────────────────────────────────
  premium: {
    colors: ['#C084FC', '#A855F7', '#7E22CE'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  premiumSubtle: {
    colors: ['rgba(192, 132, 252, 0.20)', 'rgba(168, 85, 247, 0.08)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: ['#FFD700', '#F59E0B', '#D97706'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // ── Special Gradients ───────────────────────────────────────
  live: {
    colors: ['#EF4444', '#DC2626'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  hot: {
    colors: ['#FF9F1C', '#EF4444'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // ── Background Gradients ────────────────────────────────────
  backgroundDark: {
    colors: ['#0D0D0D', '#1A1A1A'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  backgroundRadial: {
    colors: ['#1A1A1A', '#0D0D0D'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },

  // ── Shimmer/Skeleton ────────────────────────────────────────
  shimmer: {
    colors: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
} as const;

export type EffectGradients = typeof effectGradients;

// ═══════════════════════════════════════════════════════════════
// SHADOWS — React Native Shadow System
// ═══════════════════════════════════════════════════════════════

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Create a shadow style object for React Native
 * @param color - Shadow color (hex or rgba)
 * @param opacity - Shadow opacity (0-1)
 * @param radius - Shadow blur radius
 * @param offsetY - Vertical offset (default: radius / 4)
 * @param elevation - Android elevation (default: auto-calculated)
 */
export function createShadow(
  color: string,
  opacity: number,
  radius: number,
  offsetY?: number,
  elevation?: number
): ShadowStyle {
  const calculatedOffset = offsetY ?? Math.round(radius / 4);
  const calculatedElevation = elevation ?? Math.round(radius / 2);

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: calculatedOffset },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: calculatedElevation,
  };
}

/**
 * Create a glow effect (shadow with no offset)
 */
export function createGlow(
  color: string,
  opacity: number,
  radius: number,
  elevation?: number
): ShadowStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation ?? Math.round(radius / 2),
  };
}

// ── Shadow Presets ────────────────────────────────────────────

export const effectShadows = {
  // ── Card Shadows ────────────────────────────────────────────
  card: createShadow('#000000', 0.25, 8),
  cardElevated: createShadow('#000000', 0.35, 16, 6),
  cardHover: createShadow('#000000', 0.45, 24, 10),
  cardSubtle: createShadow('#000000', 0.15, 4),

  // ── Button Shadows ──────────────────────────────────────────
  button: createShadow('#000000', 0.25, 6),
  buttonPressed: createShadow('#000000', 0.15, 2, 1),
  buttonElevated: createShadow('#000000', 0.35, 12),

  // ── Header/Navigation Shadows ───────────────────────────────
  header: createShadow('#000000', 0.20, 8, 4),
  tabBar: createShadow('#000000', 0.30, 16, -4),
  bottomSheet: createShadow('#000000', 0.40, 24, -8),

  // ── Glow Effects ────────────────────────────────────────────
  glowPrimary: createGlow('#1ED760', 0.50, 16, 8),
  glowPrimarySubtle: createGlow('#1ED760', 0.30, 10, 4),
  glowPrimaryIntense: createGlow('#1ED760', 0.70, 24, 12),

  glowAccent: createGlow('#FF9F1C', 0.50, 16, 8),
  glowAccentSubtle: createGlow('#FF9F1C', 0.30, 10, 4),
  glowAccentIntense: createGlow('#FF9F1C', 0.70, 24, 12),

  glowDanger: createGlow('#EF4444', 0.50, 16, 8),
  glowDangerSubtle: createGlow('#EF4444', 0.30, 10, 4),

  glowPremium: createGlow('#A855F7', 0.50, 16, 8),
  glowPremiumSubtle: createGlow('#A855F7', 0.30, 10, 4),

  glowWhite: createGlow('#FFFFFF', 0.15, 12, 4),

  // ── Floating/Modal Shadows ──────────────────────────────────
  floating: createShadow('#000000', 0.45, 32, 12, 20),
  modal: createShadow('#000000', 0.50, 40, 16, 24),
  fab: createShadow('#1ED760', 0.45, 16, 6, 10),

  // ── Input/Focus Shadows ─────────────────────────────────────
  inputFocus: createGlow('#1ED760', 0.25, 8, 2),
  inputError: createGlow('#EF4444', 0.25, 8, 2),

  // ── None ────────────────────────────────────────────────────
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type EffectShadows = typeof effectShadows;

// ═══════════════════════════════════════════════════════════════
// GLASSMORPHISM — Frosted Glass Effects
// ═══════════════════════════════════════════════════════════════

export interface GlassStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;
}

/**
 * Create a glassmorphism style
 * @param blurIntensity - Controls background opacity ('light' | 'medium' | 'dark')
 * @param bgOpacity - Background opacity (0-1)
 * @param borderOpacity - Border opacity (0-1)
 * @param borderRadius - Optional border radius
 */
export function createGlassStyle(
  blurIntensity: 'light' | 'medium' | 'dark',
  bgOpacity?: number,
  borderOpacity?: number,
  borderRadius?: number
): GlassStyle {
  const intensityMap = {
    light: { bg: 0.05, border: 0.08 },
    medium: { bg: 0.10, border: 0.15 },
    dark: { bg: 0.40, border: 0.08 },
  };

  const defaults = intensityMap[blurIntensity];
  const finalBgOpacity = bgOpacity ?? defaults.bg;
  const finalBorderOpacity = borderOpacity ?? defaults.border;

  const bgColor = blurIntensity === 'dark'
    ? `rgba(0, 0, 0, ${finalBgOpacity})`
    : `rgba(255, 255, 255, ${finalBgOpacity})`;

  return {
    backgroundColor: bgColor,
    borderColor: `rgba(255, 255, 255, ${finalBorderOpacity})`,
    borderWidth: 1,
    ...(borderRadius !== undefined && { borderRadius }),
  };
}

/**
 * Create a colored glass effect
 */
export function createColoredGlass(
  color: string,
  bgOpacity: number = 0.10,
  borderOpacity: number = 0.20,
  borderRadius?: number
): GlassStyle {
  // Extract RGB from hex
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  const rgb = hexToRgb(color);

  return {
    backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
    borderColor: `rgba(${rgb}, ${borderOpacity})`,
    borderWidth: 1,
    ...(borderRadius !== undefined && { borderRadius }),
  };
}

// ── Glassmorphism Presets ─────────────────────────────────────

export const effectGlass = {
  // ── Base Glass Styles ───────────────────────────────────────
  light: createGlassStyle('light'),
  lightBlur: createGlassStyle('light', 0.08, 0.12),

  medium: createGlassStyle('medium'),
  mediumBlur: createGlassStyle('medium', 0.15, 0.20),

  dark: createGlassStyle('dark'),
  darkBlur: createGlassStyle('dark', 0.60, 0.12),

  // ── Colored Glass ───────────────────────────────────────────
  primary: createColoredGlass('#1ED760'),
  primaryStrong: createColoredGlass('#1ED760', 0.15, 0.30),

  accent: createColoredGlass('#FF9F1C'),
  accentStrong: createColoredGlass('#FF9F1C', 0.15, 0.30),

  danger: createColoredGlass('#EF4444'),
  dangerStrong: createColoredGlass('#EF4444', 0.15, 0.30),

  premium: createColoredGlass('#A855F7'),
  premiumStrong: createColoredGlass('#A855F7', 0.15, 0.30),

  // ── Component-Specific Glass ────────────────────────────────
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  cardElevated: {
    backgroundColor: 'rgba(38, 38, 38, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },

  tabBar: {
    backgroundColor: 'rgba(13, 13, 13, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0,
  },

  modal: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
  },
  inputFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(30, 215, 96, 0.50)',
    borderWidth: 1,
  },

  // ── Overlay Glass ───────────────────────────────────────────
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  overlayLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    borderColor: 'transparent',
    borderWidth: 0,
  },
} as const;

export type EffectGlass = typeof effectGlass;

// ═══════════════════════════════════════════════════════════════
// ANIMATIONS — Timing & Easing
// ═══════════════════════════════════════════════════════════════

// ── Durations (in ms) ─────────────────────────────────────────

export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 700,
  lazy: 1000,
} as const;

export type Durations = typeof durations;

// ── Easing Presets ────────────────────────────────────────────

export const easings = {
  // ── Standard Easings ────────────────────────────────────────
  linear: Easing.linear,

  // ── Ease In (Start slow) ────────────────────────────────────
  easeIn: Easing.ease,
  easeInQuad: Easing.in(Easing.quad),
  easeInCubic: Easing.in(Easing.cubic),
  easeInQuart: Easing.in(Easing.poly(4)),
  easeInExpo: Easing.in(Easing.exp),
  easeInCirc: Easing.in(Easing.circle),
  easeInBack: Easing.in(Easing.back(1.7)),

  // ── Ease Out (End slow) ─────────────────────────────────────
  easeOut: Easing.out(Easing.ease),
  easeOutQuad: Easing.out(Easing.quad),
  easeOutCubic: Easing.out(Easing.cubic),
  easeOutQuart: Easing.out(Easing.poly(4)),
  easeOutExpo: Easing.out(Easing.exp),
  easeOutCirc: Easing.out(Easing.circle),
  easeOutBack: Easing.out(Easing.back(1.7)),

  // ── Ease In-Out (Slow both ends) ────────────────────────────
  easeInOut: Easing.inOut(Easing.ease),
  easeInOutQuad: Easing.inOut(Easing.quad),
  easeInOutCubic: Easing.inOut(Easing.cubic),
  easeInOutQuart: Easing.inOut(Easing.poly(4)),
  easeInOutExpo: Easing.inOut(Easing.exp),
  easeInOutCirc: Easing.inOut(Easing.circle),
  easeInOutBack: Easing.inOut(Easing.back(1.7)),

  // ── Bounce ──────────────────────────────────────────────────
  bounce: Easing.bounce,
  bounceIn: Easing.in(Easing.bounce),
  bounceOut: Easing.out(Easing.bounce),

  // ── Elastic ─────────────────────────────────────────────────
  elastic: Easing.elastic(1),
  elasticIn: Easing.in(Easing.elastic(1)),
  elasticOut: Easing.out(Easing.elastic(1)),

  // ── Bezier Curves (CSS-like) ────────────────────────────────
  /** iOS default animation curve */
  ios: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** Material Design standard curve */
  material: Easing.bezier(0.4, 0, 0.2, 1),
  /** Material Design decelerate curve */
  materialDecelerate: Easing.bezier(0, 0, 0.2, 1),
  /** Material Design accelerate curve */
  materialAccelerate: Easing.bezier(0.4, 0, 1, 1),
  /** Smooth snap feeling */
  snap: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  /** Overshoot and settle */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export type Easings = typeof easings;

// ── Animation Config Presets ──────────────────────────────────

export const animationConfigs = {
  /** Quick response feedback */
  instant: {
    duration: durations.instant,
    easing: easings.easeOut,
    useNativeDriver: true,
  },

  /** Button press, tap feedback */
  press: {
    duration: durations.fast,
    easing: easings.easeOutCubic,
    useNativeDriver: true,
  },

  /** Standard UI transitions */
  default: {
    duration: durations.normal,
    easing: easings.easeInOutCubic,
    useNativeDriver: true,
  },

  /** Modal/overlay appear */
  modal: {
    duration: durations.normal,
    easing: easings.easeOutCubic,
    useNativeDriver: true,
  },

  /** Page transitions */
  page: {
    duration: durations.normal,
    easing: easings.material,
    useNativeDriver: true,
  },

  /** Smooth, luxurious feel */
  smooth: {
    duration: durations.slow,
    easing: easings.easeInOutQuart,
    useNativeDriver: true,
  },

  /** Spring-like bounce */
  spring: {
    duration: durations.normal,
    easing: easings.overshoot,
    useNativeDriver: true,
  },

  /** Collapse/expand */
  collapse: {
    duration: durations.fast,
    easing: easings.easeInOutCubic,
    useNativeDriver: false, // Height animations can't use native driver
  },
} as const;

export type AnimationConfigs = typeof animationConfigs;

// ── Spring Configs (for Animated.spring) ──────────────────────

export const springConfigs = {
  /** Subtle response */
  gentle: {
    tension: 100,
    friction: 10,
    useNativeDriver: true,
  },

  /** Standard bouncy */
  default: {
    tension: 150,
    friction: 8,
    useNativeDriver: true,
  },

  /** Snappy response */
  snappy: {
    tension: 200,
    friction: 10,
    useNativeDriver: true,
  },

  /** Button press */
  button: {
    tension: 300,
    friction: 12,
    useNativeDriver: true,
  },

  /** Bouncy */
  bouncy: {
    tension: 180,
    friction: 6,
    useNativeDriver: true,
  },

  /** Stiff, precise */
  stiff: {
    tension: 400,
    friction: 20,
    useNativeDriver: true,
  },
} as const;

export type SpringConfigs = typeof springConfigs;

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply platform-specific shadow (iOS uses shadow*, Android uses elevation)
 */
export function platformShadow(shadow: ShadowStyle) {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: shadow.shadowColor,
      shadowOffset: shadow.shadowOffset,
      shadowOpacity: shadow.shadowOpacity,
      shadowRadius: shadow.shadowRadius,
    };
  }
  if (Platform.OS === 'android') {
    return {
      elevation: shadow.elevation,
    };
  }
  return shadow;
}

/**
 * Combine glass style with shadow for elevated glass effect
 */
export function elevatedGlass(
  glassStyle: GlassStyle,
  shadowStyle: ShadowStyle = effectShadows.card
) {
  return {
    ...glassStyle,
    ...platformShadow(shadowStyle),
  };
}

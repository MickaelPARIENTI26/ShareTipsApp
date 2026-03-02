/**
 * ShareTips Design System — Typography
 *
 * Consistent text styles across the app.
 * Use these presets instead of inline font styles.
 */

import { Platform, TextStyle } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// FONT FAMILY
// ═══════════════════════════════════════════════════════════════

export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// ═══════════════════════════════════════════════════════════════
// FONT WEIGHTS
// ═══════════════════════════════════════════════════════════════

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ═══════════════════════════════════════════════════════════════
// FONT SIZES (based on 4pt scale)
// ═══════════════════════════════════════════════════════════════

export const fontSize = {
  /** 10px - Tiny labels, badges */
  xs: 10,
  /** 11px - Mini labels, disclaimers */
  'xs+': 11,
  /** 12px - Captions, small labels */
  sm: 12,
  /** 14px - Body small, secondary text */
  md: 14,
  /** 16px - Body default */
  base: 16,
  /** 18px - Body large, emphasized text */
  lg: 18,
  /** 20px - Heading 4 */
  xl: 20,
  /** 24px - Heading 3 */
  '2xl': 24,
  /** 28px - Heading 2 */
  '3xl': 28,
  /** 32px - Heading 1 */
  '4xl': 32,
  /** 40px - Display */
  '5xl': 40,
  /** 48px - Hero */
  '6xl': 48,
} as const;

// ═══════════════════════════════════════════════════════════════
// LINE HEIGHTS
// ═══════════════════════════════════════════════════════════════

export const lineHeight = {
  /** 1.0 - Compact (icons, numbers) */
  none: 1,
  /** 1.2 - Tight (headings) */
  tight: 1.2,
  /** 1.4 - Snug */
  snug: 1.4,
  /** 1.5 - Normal (body text) */
  normal: 1.5,
  /** 1.6 - Relaxed (paragraphs) */
  relaxed: 1.6,
  /** 2.0 - Loose */
  loose: 2,
} as const;

// ═══════════════════════════════════════════════════════════════
// LETTER SPACING
// ═══════════════════════════════════════════════════════════════

export const letterSpacing = {
  /** -0.5px - Tight (large headings) */
  tighter: -0.5,
  /** -0.25px */
  tight: -0.25,
  /** 0px - Normal */
  normal: 0,
  /** 0.25px */
  wide: 0.25,
  /** 0.5px - Wide (labels) */
  wider: 0.5,
  /** 1px - Widest (uppercase labels) */
  widest: 1,
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY PRESETS
// ═══════════════════════════════════════════════════════════════

export const typography = {
  // ── Display & Hero ───────────────────────────────────────────
  hero: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize['6xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  } as TextStyle,

  display: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  } as TextStyle,

  // ── Headings ─────────────────────────────────────────────────
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.snug,
  } as TextStyle,

  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.snug,
  } as TextStyle,

  h5: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.snug,
  } as TextStyle,

  // ── Body Text ────────────────────────────────────────────────
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.relaxed,
  } as TextStyle,

  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  } as TextStyle,

  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.normal,
  } as TextStyle,

  // ── UI Elements ──────────────────────────────────────────────
  buttonLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  buttonSmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  // ── Labels & Captions ────────────────────────────────────────
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
  } as TextStyle,

  labelSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  } as TextStyle,

  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  captionSmall: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
  } as TextStyle,

  /** 11px - Mini text for disclaimers, legal text */
  mini: {
    fontSize: fontSize['xs+'],
    fontWeight: fontWeight.regular,
    lineHeight: fontSize['xs+'] * lineHeight.normal,
  } as TextStyle,

  // ── Special (Sports/Betting) ─────────────────────────────────
  odds: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  oddsLarge: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  score: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  teamName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.md * lineHeight.snug,
  } as TextStyle,

  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  } as TextStyle,

  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  // ── Numeric ──────────────────────────────────────────────────
  amount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  amountSmall: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  currency: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
  } as TextStyle,

  // ── Monospace ─────────────────────────────────────────────────
  mono: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.mono,
  } as TextStyle,

  monoSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.mono,
  } as TextStyle,
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type Typography = typeof typography;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type LetterSpacing = keyof typeof letterSpacing;

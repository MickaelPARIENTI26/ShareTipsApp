/**
 * ShareTips Design System — Spacing & Layout
 *
 * Generous spacing scale for a premium, airy feel.
 * Based on 4px grid system with intermediate variants.
 */

// ═══════════════════════════════════════════════════════════════
// SPACING SCALE (4px base, generous for premium feel)
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  /** 0px */
  none: 0,
  /** 2px - Minimal spacing */
  xxs: 2,
  /** 4px - Tight spacing */
  xs: 4,
  /** 6px - Small gap (icons, badges) */
  '2xs': 6,
  /** 8px - Compact spacing */
  sm: 8,
  /** 10px - Between sm and md */
  'sm+': 10,
  /** 12px - Default small */
  md: 12,
  /** 14px - Between md and base */
  'md+': 14,
  /** 16px - Default base */
  base: 16,
  /** 18px - Between base and lg */
  'base+': 18,
  /** 20px - Comfortable */
  lg: 20,
  /** 22px - Between lg and xl */
  'lg+': 22,
  /** 24px - Spacious */
  xl: 24,
  /** 28px - Between xl and 2xl */
  'xl+': 28,
  /** 32px - Large sections */
  '2xl': 32,
  /** 32px - Alias for 2xl */
  xxl: 32,
  /** 36px - Between 2xl and 3xl */
  '2xl+': 36,
  /** 40px - Extra large */
  '3xl': 40,
  /** 44px - Between 3xl and 4xl */
  '3xl+': 44,
  /** 48px - Huge */
  '4xl': 48,
  /** 56px - Between 4xl and 5xl */
  '4xl+': 56,
  /** 64px - Massive */
  '5xl': 64,
  /** 72px - Between 5xl and 6xl */
  '5xl+': 72,
  /** 80px - Screen sections */
  '6xl': 80,
  /** 88px - Between 6xl and 7xl */
  '6xl+': 88,
  /** 96px - Hero sections */
  '7xl': 96,
  /** 112px - Extra hero */
  '8xl': 112,
  /** 128px - Maximum */
  '9xl': 128,
} as const;

// ═══════════════════════════════════════════════════════════════
// BORDER RADIUS (Premium rounded corners)
// ═══════════════════════════════════════════════════════════════

export const radius = {
  /** 0px - Sharp corners */
  none: 0,
  /** 4px - Subtle rounding */
  xs: 4,
  /** 6px - Small rounding */
  sm: 6,
  /** 8px - Default rounding */
  md: 8,
  /** 10px - Medium rounding */
  'md+': 10,
  /** 12px - Card rounding */
  base: 12,
  /** 14px - Between base and lg */
  'base+': 14,
  /** 16px - Large rounding */
  lg: 16,
  /** 18px - Between lg and xl */
  'lg+': 18,
  /** 20px - Extra large */
  xl: 20,
  /** 22px - Between xl and xxl */
  'xl+': 22,
  /** 24px - Double extra large */
  xxl: 24,
  /** 24px - Alias for xxl (backwards compatibility) */
  '2xl': 24,
  /** 28px - Between xxl and 3xl */
  'xxl+': 28,
  /** 32px - Very rounded */
  '3xl': 32,
  /** 40px - Super rounded */
  '4xl': 40,
  /** 48px - Ultra rounded */
  '5xl': 48,
  /** 9999px - Full circle/pill */
  full: 9999,
} as const;

// ═══════════════════════════════════════════════════════════════
// ICON SIZES (Dedicated export for convenience)
// ═══════════════════════════════════════════════════════════════

export const iconSizes = {
  /** 12px - Micro icons */
  '2xs': 12,
  /** 14px - Tiny icons */
  xs: 14,
  /** 16px - Small icons */
  sm: 16,
  /** 20px - Default icons */
  md: 20,
  /** 24px - Medium icons */
  lg: 24,
  /** 28px - Large icons */
  xl: 28,
  /** 32px - Extra large */
  '2xl': 32,
  /** 40px - Huge icons */
  '3xl': 40,
  /** 48px - Display icons */
  '4xl': 48,
  /** 56px - Hero icons */
  '5xl': 56,
  /** 64px - Maximum icons */
  '6xl': 64,
} as const;

// ═══════════════════════════════════════════════════════════════
// SHADOWS (iOS & Android)
// ═══════════════════════════════════════════════════════════════

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },

  // Colored shadows for primary elements
  primary: {
    shadowColor: '#1ED760',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  accent: {
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Glow effects
  primaryGlow: {
    shadowColor: '#1ED760',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  accentGlow: {
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENT SIZES
// ═══════════════════════════════════════════════════════════════

export const size = {
  // ── Buttons ────────────────────────────────────────────────
  button: {
    xs: { height: 32, paddingHorizontal: spacing.sm },
    sm: { height: 40, paddingHorizontal: spacing.md },
    md: { height: 48, paddingHorizontal: spacing.base },
    lg: { height: 56, paddingHorizontal: spacing.lg },
    xl: { height: 64, paddingHorizontal: spacing.xl },
  },

  // ── Inputs ─────────────────────────────────────────────────
  input: {
    sm: { height: 44, paddingHorizontal: spacing.md },
    md: { height: 52, paddingHorizontal: spacing.base },
    lg: { height: 60, paddingHorizontal: spacing.lg },
  },

  // ── Icons (also available as iconSizes export) ──────────────
  icon: {
    '2xs': 12,
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 56,
    '6xl': 64,
  },

  // ── Avatars ────────────────────────────────────────────────
  avatar: {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 52,
    xl: 68,
    '2xl': 88,
    '3xl': 104,
  },

  // ── Tab Bar ────────────────────────────────────────────────
  tabBar: {
    height: 70,
    fabSize: 60,
    notchWidth: 40,
    notchDepth: 24,
  },

  // ── Cards ──────────────────────────────────────────────────
  card: {
    padding: spacing.lg,
    paddingCompact: spacing.base,
    paddingLarge: spacing.xl,
    radius: radius.lg,
    radiusLarge: radius.xl,
    gap: spacing.md,
    gapLarge: spacing.lg,
  },

  // ── Match Card ─────────────────────────────────────────────
  matchCard: {
    teamAvatar: 52,
    oddsButtonHeight: 60,
    padding: spacing.lg,
  },

  // ── Touch targets ──────────────────────────────────────────
  touchTarget: {
    min: 44, // iOS HIG minimum
    comfortable: 48,
    large: 56,
  },

  // ── List padding (to account for tab bar) ─────────────────
  listPaddingBottom: {
    sm: 88,   // Standard lists
    md: 108,  // Lists with FAB
    lg: 128,  // Lists with larger FAB
  },

  // ── Badges (Gamification) ─────────────────────────────────
  badge: {
    iconXs: 40,    // Badge icon small
    iconSm: 60,    // Badge icon in grid
    iconMd: 80,    // Badge icon medium
    iconLg: 104,   // Badge icon in modal
    rank: 36,      // Rank circle in leaderboard
  },

  // ── Profile elements ──────────────────────────────────────
  profile: {
    avatarXs: 36,
    avatarSm: 44,
    avatarMd: 68,
    avatarLg: 88,
    avatarXl: 108,
    avatarHero: 128,
  },

  // ── Auth screens ────────────────────────────────────────────
  auth: {
    paddingTop: 56,
    backButtonSize: 44,
    logoWidth: 180,
    logoHeight: 60,
    logoWidthSm: 150,
    logoHeightSm: 52,
    checkboxSize: 26,
  },

  // ── Modal elements ──────────────────────────────────────────
  modal: {
    padding: spacing.xl,
    paddingCompact: spacing.lg,
    radius: radius.xxl,
    handleWidth: 40,
    handleHeight: 4,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// LAYOUT (Premium airy design)
// ═══════════════════════════════════════════════════════════════

export const layout = {
  // ── Screen padding ─────────────────────────────────────────
  screen: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },

  // ── Content widths ─────────────────────────────────────────
  maxWidth: {
    xs: 280,
    sm: 340,
    md: 500,
    lg: 680,
    xl: 800,
  },

  // ── Gaps (generous spacing) ──────────────────────────────
  gap: {
    items: spacing.md,        // Between list items
    itemsLarge: spacing.lg,   // Between larger items
    sections: spacing['3xl'], // Between sections
    cards: spacing.base,      // Between cards
    cardsLarge: spacing.lg,   // Between larger cards
    inputs: spacing.lg,       // Between form inputs
    buttons: spacing.md,      // Between buttons
  },

  // ── Section spacing ──────────────────────────────────────
  section: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
    titleGap: spacing.base,
  },

  // ── Z-index ────────────────────────────────────────────────
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ANIMATION DURATIONS
// ═══════════════════════════════════════════════════════════════

export const duration = {
  /** 80ms - Instant feedback */
  instant: 80,
  /** 120ms - Very quick */
  faster: 120,
  /** 150ms - Quick transitions */
  fast: 150,
  /** 200ms - Default */
  normal: 200,
  /** 250ms - Comfortable */
  comfortable: 250,
  /** 300ms - Smooth */
  slow: 300,
  /** 400ms - Relaxed */
  relaxed: 400,
  /** 500ms - Emphasis */
  slower: 500,
  /** 700ms - Dramatic */
  dramatic: 700,
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadow;
export type Duration = keyof typeof duration;
export type IconSize = keyof typeof iconSizes;

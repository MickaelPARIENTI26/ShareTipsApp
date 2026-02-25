/**
 * ShareTips Design System — Colors
 *
 * Modern sporty theme with dark premium aesthetic.
 * All components MUST use theme colors via useTheme() — no hardcoded hex.
 */

// ═══════════════════════════════════════════════════════════════
// RAW PALETTE
// ═══════════════════════════════════════════════════════════════

export const palette = {
  // ── Base Colors ─────────────────────────────────────────────
  black: '#000000',
  white: '#FFFFFF',

  // ── Medal Colors (Leaderboard) ──────────────────────────────
  medal: {
    gold: '#FFD700',
    goldBg: 'rgba(255, 215, 0, 0.15)',
    silver: '#C0C0C0',
    silverBg: 'rgba(192, 192, 192, 0.15)',
    bronze: '#CD7F32',
    bronzeBg: 'rgba(205, 127, 50, 0.15)',
  },

  // ── XP Category Colors (Gamification) ─────────────────────────
  category: {
    tipster: '#FF9500',
    buyer: '#5856D6',
    engagement: '#34C759',
    bonus: '#FFD700',
  },

  // ── Brand Colors ─────────────────────────────────────────────
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#1ED760',    // PRIMARY - Vibrant green
    600: '#1AB954',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#FF9F1C',    // ACCENT - Energy orange
    600: '#E68A00',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // ── Neutral Colors ───────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',    // Off-white (main text dark mode)
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#1E1E1E',    // Card background
    950: '#0D0D0D',    // Main background
  },

  // ── Semantic Colors ──────────────────────────────────────────
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',    // Danger
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',    // Info
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',    // Premium/Subscription
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },

  // ── Opacity Presets (for shadows, overlays) ─────────────────
  opacity: {
    /** 5% - Very subtle */
    5: 0.05,
    /** 8% - Subtle shadow */
    8: 0.08,
    /** 10% - Light shadow */
    10: 0.1,
    /** 12% - Medium shadow */
    12: 0.12,
    /** 15% - Strong shadow */
    15: 0.15,
    /** 30% - Colored glow */
    30: 0.3,
    /** 50% - Half transparent */
    50: 0.5,
    /** 70% - Overlay dark */
    70: 0.7,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// THEME COLORS INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ThemeColors {
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBg: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  accentBg: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  surfacePressed: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textOnPrimary: string;

  // Borders
  border: string;
  borderLight: string;
  divider: string;
  separator: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  placeholder: string;

  // States
  success: string;
  successBg: string;
  successLight: string;
  successDark: string;
  danger: string;
  dangerBg: string;
  warning: string;
  warningBg: string;
  warningLight: string;
  warningDark: string;
  info: string;
  infoBg: string;

  // Components
  tabActive: string;
  tabInactive: string;
  tabBarBg: string;
  tabBarBackground: string;
  cardBg: string;
  badgeBg: string;
  overlay: string;
  skeleton: string;

  // Special
  premium: string;
  live: string;
  odds: string;
  oddsSelected: string;
}

// ═══════════════════════════════════════════════════════════════
// LIGHT THEME
// ═══════════════════════════════════════════════════════════════

export const lightColors: ThemeColors = {
  // Brand
  primary: palette.green[500],
  primaryDark: palette.green[600],
  primaryLight: palette.green[400],
  primaryBg: palette.green[50],
  accent: palette.orange[500],
  accentDark: palette.orange[600],
  accentLight: palette.orange[400],
  accentBg: palette.orange[50],

  // Backgrounds
  background: palette.neutral[100],
  surface: palette.neutral[0],
  surfaceSecondary: palette.neutral[50],
  surfaceElevated: palette.neutral[0],
  surfacePressed: palette.neutral[200],

  // Text
  text: palette.neutral[900],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[500],
  textInverse: palette.neutral[0],
  textOnPrimary: palette.neutral[0],

  // Borders
  border: palette.neutral[300],
  borderLight: palette.neutral[200],
  divider: palette.neutral[200],
  separator: palette.neutral[200],

  // Inputs
  inputBg: palette.neutral[50],
  inputBorder: palette.neutral[300],
  inputBorderFocus: palette.green[500],
  placeholder: palette.neutral[400],

  // States
  success: palette.green[500],
  successBg: palette.green[50],
  successLight: palette.green[100],
  successDark: palette.green[700],
  danger: palette.red[500],
  dangerBg: palette.red[50],
  warning: palette.orange[500],
  warningBg: palette.orange[50],
  warningLight: palette.orange[100],
  warningDark: palette.orange[700],
  info: palette.blue[500],
  infoBg: palette.blue[50],

  // Components
  tabActive: palette.green[500],
  tabInactive: palette.neutral[400],
  tabBarBg: palette.neutral[0],
  tabBarBackground: palette.neutral[0],
  cardBg: palette.neutral[0],
  badgeBg: palette.neutral[100],
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: palette.neutral[200],

  // Special
  premium: palette.purple[500],
  live: palette.red[500],
  odds: palette.green[500],
  oddsSelected: palette.green[500],
};

// ═══════════════════════════════════════════════════════════════
// DARK THEME (Premium Sporty - Synced with DS)
// ═══════════════════════════════════════════════════════════════

export const darkColors: ThemeColors = {
  // Brand — Using DS green palette
  primary: '#2D8C4E',                    // DS.colors.green
  primaryDark: '#1E6B3A',
  primaryLight: '#4ADE80',               // DS.colors.greenLight
  primaryBg: 'rgba(45, 140, 78, 0.15)',  // DS.colors.greenBgSubtle
  accent: palette.orange[500],           // #FF9F1C
  accentDark: palette.orange[600],
  accentLight: palette.orange[400],
  accentBg: 'rgba(255, 159, 28, 0.12)',

  // Backgrounds — DS colors with green tint
  background: '#0A0F0C',                 // DS.colors.background
  surface: '#131916',                    // DS.colors.cardBg
  surfaceSecondary: '#121815',           // DS.colors.buttonBg
  surfaceElevated: '#1A2420',
  surfacePressed: '#0F1611',

  // Text — DS text colors
  text: '#FFFFFF',                       // DS.colors.white
  textSecondary: '#8A9A8F',              // DS.colors.textSecondary
  textTertiary: '#5A6A5E',               // DS.colors.tabInactive
  textInverse: '#0A0F0C',
  textOnPrimary: '#FFFFFF',              // White text on green

  // Borders — DS border colors
  border: '#1E2A22',                     // DS.colors.cardBorder
  borderLight: '#1C2B21',                // DS.colors.buttonBorder
  divider: '#1A2420',                    // DS.colors.tabBarBorder
  separator: '#1E2A22',

  // Inputs
  inputBg: '#121815',                    // DS.colors.buttonBg
  inputBorder: '#1C2B21',                // DS.colors.buttonBorder
  inputBorderFocus: '#2D8C4E',           // DS.colors.green
  placeholder: '#5A6A5E',                // DS.colors.tabInactive

  // States
  success: '#2D8C4E',                    // DS.colors.green
  successBg: 'rgba(45, 140, 78, 0.15)',  // DS.colors.greenBgSubtle
  successLight: 'rgba(45, 140, 78, 0.20)',
  successDark: '#1E6B3A',
  danger: palette.red[500],
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  warning: palette.orange[500],
  warningBg: 'rgba(255, 159, 28, 0.15)',
  warningLight: 'rgba(255, 159, 28, 0.20)',
  warningDark: palette.orange[600],
  info: palette.blue[500],
  infoBg: 'rgba(59, 130, 246, 0.15)',

  // Components — DS tab colors
  tabActive: '#2D8C4E',                  // DS.colors.green
  tabInactive: '#5A6A5E',                // DS.colors.tabInactive
  tabBarBg: '#0A0F0C',                   // DS.colors.tabBarBg
  tabBarBackground: '#0A0F0C',           // DS.colors.tabBarBg
  cardBg: '#131916',                     // DS.colors.cardBg
  badgeBg: '#1A2420',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#1A2420',

  // Special
  premium: palette.purple[500],
  live: palette.red[500],
  odds: '#2D8C4E',                       // DS.colors.green
  oddsSelected: '#2D8C4E',               // DS.colors.green
};

// ═══════════════════════════════════════════════════════════════
// EXTENDED DARK COLORS (Premium Betting App Style)
// ═══════════════════════════════════════════════════════════════

export const darkColorsExtended = {
  ...darkColors,

  // ── Additional Surface Variants (DS-synced) ─────────────────
  surfaceTertiary: '#121815',           // DS.colors.buttonBg
  surfaceQuaternary: '#1A2420',         // Slightly elevated with green tint
  surfaceHover: 'rgba(45, 140, 78, 0.05)',  // Green tinted hover
  surfaceActive: 'rgba(45, 140, 78, 0.10)', // Green tinted active

  // ── Alpha Overlays ──────────────────────────────────────────
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayMedium: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  overlayBlack: 'rgba(0, 0, 0, 0.85)',

  // ── White Alpha (for overlays on dark) ──────────────────────
  whiteAlpha: {
    5: 'rgba(255, 255, 255, 0.05)',
    10: 'rgba(255, 255, 255, 0.10)',
    15: 'rgba(255, 255, 255, 0.15)',
    20: 'rgba(255, 255, 255, 0.20)',
    30: 'rgba(255, 255, 255, 0.30)',
    50: 'rgba(255, 255, 255, 0.50)',
    70: 'rgba(255, 255, 255, 0.70)',
  },

  // ── Black Alpha (for shadows) ───────────────────────────────
  blackAlpha: {
    10: 'rgba(0, 0, 0, 0.10)',
    20: 'rgba(0, 0, 0, 0.20)',
    30: 'rgba(0, 0, 0, 0.30)',
    40: 'rgba(0, 0, 0, 0.40)',
    50: 'rgba(0, 0, 0, 0.50)',
    60: 'rgba(0, 0, 0, 0.60)',
    80: 'rgba(0, 0, 0, 0.80)',
  },

  // ── Primary Alpha — DS green ────────────────────────────────
  primaryAlpha: {
    10: 'rgba(45, 140, 78, 0.10)',
    15: 'rgba(45, 140, 78, 0.15)',   // DS.colors.greenBgSubtle
    20: 'rgba(45, 140, 78, 0.20)',
    30: 'rgba(45, 140, 78, 0.30)',   // DS.colors.greenGlow
    50: 'rgba(45, 140, 78, 0.50)',
  },

  // ── Accent Alpha ────────────────────────────────────────────
  accentAlpha: {
    10: 'rgba(255, 159, 28, 0.10)',
    15: 'rgba(255, 159, 28, 0.15)',
    20: 'rgba(255, 159, 28, 0.20)',
    30: 'rgba(255, 159, 28, 0.30)',
    50: 'rgba(255, 159, 28, 0.50)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// GRADIENTS — Premium Betting App Style
// ═══════════════════════════════════════════════════════════════

export const gradients = {
  // ── Primary Gradients (Green) — DS synced ───────────────────
  primary: ['#4ADE80', '#2D8C4E'] as const,  // DS.colors.greenLight to green
  primarySubtle: ['rgba(45, 140, 78, 0.20)', 'rgba(45, 140, 78, 0.10)'] as const,
  primaryVibrant: ['#4ADE80', '#2D8C4E', '#1E6B3A'] as const,

  // ── Accent Gradients (Orange) ───────────────────────────────
  accent: ['#FF9F1C', '#E68A00'] as const,
  accentSubtle: ['rgba(255, 159, 28, 0.20)', 'rgba(230, 138, 0, 0.10)'] as const,
  accentVibrant: ['#FDBA74', '#FF9F1C', '#C2410C'] as const,

  // ── Card Gradients — DS synced ──────────────────────────────
  card: ['#131916', '#0F1611'] as const,  // DS.colors.cardBg variants
  cardElevated: ['#1A2420', '#131916'] as const,
  cardPremium: ['#1E2A22', '#131916'] as const,

  // ── Background Gradients — DS synced ────────────────────────
  background: ['#0A0F0C', '#131916'] as const,  // DS colors
  backgroundRadial: ['#131916', '#0A0F0C'] as const,
  backgroundDark: ['#050805', '#0A0F0C'] as const,

  // ── Success Gradients — DS synced ───────────────────────────
  success: ['#4ADE80', '#2D8C4E'] as const,  // DS.colors.greenLight to green
  successSubtle: ['rgba(45, 140, 78, 0.20)', 'rgba(45, 140, 78, 0.10)'] as const,

  // ── Danger Gradients ────────────────────────────────────────
  danger: ['#F87171', '#EF4444', '#DC2626'] as const,
  dangerSubtle: ['rgba(248, 113, 113, 0.20)', 'rgba(239, 68, 68, 0.10)'] as const,

  // ── Premium/VIP Gradients ───────────────────────────────────
  premium: ['#C084FC', '#A855F7', '#7E22CE'] as const,
  premiumSubtle: ['rgba(192, 132, 252, 0.20)', 'rgba(168, 85, 247, 0.10)'] as const,
  gold: ['#FFD700', '#F59E0B', '#D97706'] as const,

  // ── Live/Hot Gradients ──────────────────────────────────────
  live: ['#EF4444', '#DC2626'] as const,
  hot: ['#FF9F1C', '#EF4444'] as const,

  // ── Odds Button Gradients — DS synced ───────────────────────
  oddsDefault: ['#121815', '#0F1611'] as const,  // DS.colors.buttonBg variants
  oddsSelected: ['rgba(45, 140, 78, 0.30)', 'rgba(45, 140, 78, 0.20)'] as const,
  oddsHot: ['rgba(255, 159, 28, 0.25)', 'rgba(255, 159, 28, 0.15)'] as const,

  // ── Shimmer/Skeleton ────────────────────────────────────────
  shimmer: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0)'] as const,
} as const;

export type Gradients = typeof gradients;

// ═══════════════════════════════════════════════════════════════
// SHADOWS — Premium Depth System
// ═══════════════════════════════════════════════════════════════

export const shadows = {
  // ── Card Shadows ────────────────────────────────────────────
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  // ── Button Shadows ──────────────────────────────────────────
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },

  // ── Glow Effects (Colored Shadows) — DS green ───────────────
  glowPrimary: {
    shadowColor: '#2D8C4E',              // DS.colors.green
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  glowPrimarySubtle: {
    shadowColor: '#2D8C4E',              // DS.colors.green
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glowAccent: {
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glowAccentSubtle: {
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glowDanger: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glowPremium: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // ── Inner Shadow (Inset effect) ─────────────────────────────
  inner: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 0,
  },
  innerDeep: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 0,
  },

  // ── Floating Elements ───────────────────────────────────────
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  fab: {
    shadowColor: '#2D8C4E',              // DS.colors.green
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },

  // ── Modal/Overlay Shadows ───────────────────────────────────
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },

  // ── None ────────────────────────────────────────────────────
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type Shadows = typeof shadows;

// ═══════════════════════════════════════════════════════════════
// GLASSMORPHISM — Frosted Glass Effects
// ═══════════════════════════════════════════════════════════════

export const glass = {
  // ── Light Glass (Subtle) ────────────────────────────────────
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  lightBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },

  // ── Medium Glass ────────────────────────────────────────────
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  mediumBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
  },

  // ── Dark Glass ──────────────────────────────────────────────
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  darkBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
  },

  // ── Colored Glass — DS synced ───────────────────────────────
  primary: {
    backgroundColor: 'rgba(45, 140, 78, 0.15)',  // DS.colors.greenBgSubtle
    borderColor: 'rgba(45, 140, 78, 0.30)',      // DS.colors.greenGlow
    borderWidth: 1,
  },
  accent: {
    backgroundColor: 'rgba(255, 159, 28, 0.10)',
    borderColor: 'rgba(255, 159, 28, 0.20)',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(239, 68, 68, 0.20)',
    borderWidth: 1,
  },
  premium: {
    backgroundColor: 'rgba(168, 85, 247, 0.10)',
    borderColor: 'rgba(168, 85, 247, 0.20)',
    borderWidth: 1,
  },

  // ── Card Glass (for floating cards) — DS synced ─────────────
  card: {
    backgroundColor: 'rgba(19, 25, 22, 0.95)',  // DS.colors.cardBg with alpha
    borderColor: '#1E2A22',                      // DS.colors.cardBorder
    borderWidth: 1,
  },
  cardElevated: {
    backgroundColor: 'rgba(26, 36, 32, 0.98)',
    borderColor: '#1E2A22',
    borderWidth: 1,
  },

  // ── Tab Bar Glass — DS synced ───────────────────────────────
  tabBar: {
    backgroundColor: '#0A0F0C',                  // DS.colors.tabBarBg
    borderColor: '#1A2420',                      // DS.colors.tabBarBorder
    borderWidth: 1,
  },

  // ── Modal Glass ─────────────────────────────────────────────
  modal: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
  },

  // ── Border Only (No background) — DS synced ─────────────────
  borderOnly: {
    backgroundColor: 'transparent',
    borderColor: '#1E2A22',                      // DS.colors.cardBorder
    borderWidth: 1,
  },
  borderPrimary: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(45, 140, 78, 0.30)',      // DS.colors.greenGlow
    borderWidth: 1,
  },
  borderAccent: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 159, 28, 0.30)',
    borderWidth: 1,
  },
} as const;

export type Glass = typeof glass;

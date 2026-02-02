/**
 * ShareTips Design System — Color Palette
 *
 * Primary brand color is teal (from the "BET" part of the logo).
 * All components MUST use theme colors via useTheme() — no hardcoded hex.
 */

// ── Raw palette ──────────────────────────────────────────────
export const palette = {
  // Brand
  teal: '#00B4AA',
  tealDark: '#008C84',
  tealLight: '#33C3BB',

  // Grays (iOS-style scale)
  white: '#FFFFFF',
  gray50: '#F9F9FB',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#C7C7CC',
  gray400: '#8E8E93',
  gray500: '#636B73',
  gray600: '#48484A',
  gray700: '#3A3A3C',
  gray800: '#2C2C2E',
  gray850: '#1C1C1E',
  gray900: '#000000',

  // Semantic
  green: '#34C759',
  greenDark: '#248A3D',
  greenLight: '#E8F8EC',
  red: '#FF3B30',
  redDark: '#C0392B',
  redLight: '#FEE2E2',
  redBorder: '#FECACA',
  orange: '#FF9500',
  orangeDark: '#E65100',
  orangeLight: '#FFF3E0',
  blue: '#007AFF',
} as const;

// ── Theme color type ─────────────────────────────────────────
export interface ThemeColors {
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  separator: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  // Semantic
  success: string;
  successDark: string;
  successLight: string;
  danger: string;
  dangerDark: string;
  dangerLight: string;
  dangerBorder: string;
  warning: string;
  warningDark: string;
  warningLight: string;

  // Tab bar
  tabActive: string;
  tabInactive: string;
  tabBarBackground: string;

  // Cards & Badges
  cardBackground: string;
  badgeBackground: string;
}

// ── Light theme ──────────────────────────────────────────────
export const lightColors: ThemeColors = {
  primary: palette.teal,
  primaryDark: palette.tealDark,
  primaryLight: palette.tealLight,

  background: palette.gray100,
  surface: palette.white,
  surfaceSecondary: palette.gray50,

  text: palette.gray850,
  textSecondary: palette.gray400,
  textTertiary: palette.gray300,
  textOnPrimary: palette.white,

  border: palette.gray200,
  borderLight: palette.gray200,
  separator: palette.gray200,

  inputBackground: palette.gray50,
  inputBorder: '#ddd',
  placeholder: '#999',

  success: palette.green,
  successDark: palette.greenDark,
  successLight: palette.greenLight,
  danger: palette.red,
  dangerDark: palette.redDark,
  dangerLight: palette.redLight,
  dangerBorder: palette.redBorder,
  warning: palette.orange,
  warningDark: palette.orangeDark,
  warningLight: palette.orangeLight,

  tabActive: palette.teal,
  tabInactive: palette.gray400,
  tabBarBackground: palette.white,

  cardBackground: palette.white,
  badgeBackground: palette.gray100,
};

// ── Dark theme ───────────────────────────────────────────────
export const darkColors: ThemeColors = {
  primary: palette.teal,
  primaryDark: palette.tealDark,
  primaryLight: palette.tealLight,

  background: palette.gray900,
  surface: palette.gray850,
  surfaceSecondary: palette.gray800,

  text: palette.white,
  textSecondary: palette.gray400,
  textTertiary: palette.gray600,
  textOnPrimary: palette.white,

  border: palette.gray700,
  borderLight: palette.gray600,
  separator: palette.gray700,

  inputBackground: palette.gray800,
  inputBorder: palette.gray600,
  placeholder: palette.gray400,

  success: palette.green,
  successDark: palette.greenDark,
  successLight: '#1B3D26',
  danger: palette.red,
  dangerDark: palette.redDark,
  dangerLight: '#3D1B1B',
  dangerBorder: '#5C2626',
  warning: palette.orange,
  warningDark: palette.orangeDark,
  warningLight: '#3D2E1B',

  tabActive: palette.teal,
  tabInactive: palette.gray400,
  tabBarBackground: palette.gray850,

  cardBackground: palette.gray850,
  badgeBackground: palette.gray800,
};

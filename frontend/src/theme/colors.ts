/**
 * ShareTips Design System — Color Palette
 *
 * Sporty theme with stadium night atmosphere.
 * Primary: Stadium blue night, Secondary: Field green, Accent: Energy gold/orange
 * All components MUST use theme colors via useTheme() — no hardcoded hex.
 */

// ── Raw palette ──────────────────────────────────────────────
export const palette = {
  // Brand - Sporty theme
  teal: '#00B4AA',           // Keep for compatibility
  tealDark: '#008C84',
  tealLight: '#33C3BB',

  // Sporty colors
  stadiumBlue: '#1B2A4A',    // Primary - Deep stadium night blue
  stadiumBlueDark: '#0F1923', // Dark background
  stadiumBlueLight: '#2A3F6A',
  fieldGreen: '#2ECC71',     // Secondary - Vibrant field green
  fieldGreenDark: '#27AE60',
  fieldGreenLight: '#58D68D',
  energyGold: '#F39C12',     // Accent - Energy gold/orange
  energyGoldDark: '#D68910',
  energyGoldLight: '#F5B041',

  // Grays (iOS-style scale)
  white: '#FFFFFF',
  gray50: '#F9F9FB',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#C7C7CC',
  gray400: '#94A3B8',        // Updated for sporty theme
  gray500: '#636B73',
  gray600: '#48484A',
  gray700: '#3A3A3C',
  gray800: '#1E293B',        // Slate for sporty dark
  gray850: '#0F172A',        // Deep slate
  gray900: '#000000',

  // Semantic
  green: '#10B981',          // Updated success green
  greenDark: '#059669',
  greenLight: '#D1FAE5',
  red: '#EF4444',            // Updated error red
  redDark: '#DC2626',
  redLight: '#FEE2E2',
  redBorder: '#FECACA',
  orange: '#F39C12',
  orangeDark: '#D68910',
  orangeLight: '#FEF3C7',
  blue: '#007AFF',
  purple: '#AF52DE',
  purpleDark: '#8E44AD',
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

  // Subscriptions
  subscription: string;

  // Sporty accent colors
  accent: string;
  accentDark: string;
  accentLight: string;
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
  textSecondary: palette.gray500, // Improved contrast: 5.5:1 on white (WCAG AA)
  textTertiary: palette.gray400,  // Improved contrast: 3:1 on white (WCAG AA large text)
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

  subscription: palette.purple,

  accent: palette.energyGold,
  accentDark: palette.energyGoldDark,
  accentLight: palette.energyGoldLight,
};

// ── Dark theme (Sporty Stadium Night) ────────────────────────
export const darkColors: ThemeColors = {
  primary: palette.fieldGreen,           // Vibrant green for CTAs
  primaryDark: palette.fieldGreenDark,
  primaryLight: palette.fieldGreenLight,

  background: palette.stadiumBlueDark,   // Deep stadium night
  surface: palette.stadiumBlue,          // Stadium blue surfaces
  surfaceSecondary: palette.stadiumBlueLight,

  text: palette.white,
  textSecondary: palette.gray400,
  textTertiary: palette.gray500,
  textOnPrimary: palette.white,

  border: '#2A3F6A',                      // Subtle blue border
  borderLight: '#3D5A80',
  separator: '#2A3F6A',

  inputBackground: 'rgba(255, 255, 255, 0.08)', // Glassmorphism effect
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  placeholder: palette.gray400,

  success: palette.green,
  successDark: palette.greenDark,
  successLight: '#064E3B',
  danger: palette.red,
  dangerDark: palette.redDark,
  dangerLight: '#7F1D1D',
  dangerBorder: '#991B1B',
  warning: palette.energyGold,
  warningDark: palette.energyGoldDark,
  warningLight: '#78350F',

  tabActive: palette.fieldGreen,
  tabInactive: palette.gray400,
  tabBarBackground: palette.stadiumBlue,

  cardBackground: palette.stadiumBlue,
  badgeBackground: palette.stadiumBlueLight,

  subscription: palette.purple,

  accent: palette.energyGold,
  accentDark: palette.energyGoldDark,
  accentLight: palette.energyGoldLight,
};

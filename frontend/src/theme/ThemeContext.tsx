/**
 * ShareTips Design System — Theme Context
 *
 * Provides theme values to all components via useTheme() hook.
 * Includes colors, typography, spacing, and layout utilities.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { lightColors, darkColors, palette, type ThemeColors } from './colors';
import { typography, fontSize, fontWeight, lineHeight, letterSpacing } from './typography';
import { spacing, radius, shadow, size, layout, duration } from './spacing';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  // Mode
  mode: ThemeMode;
  isDark: boolean;

  // Colors
  colors: ThemeColors;
  palette: typeof palette;

  // Typography
  typography: typeof typography;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  letterSpacing: typeof letterSpacing;

  // Spacing & Layout
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  size: typeof size;
  layout: typeof layout;
  duration: typeof duration;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT VALUE
// ═══════════════════════════════════════════════════════════════

const defaultValue: ThemeContextValue = {
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  palette,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  shadow,
  size,
  layout,
  duration,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedMode?: ThemeMode; // Optional: force a specific mode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  forcedMode,
}) => {
  const systemColorScheme = useColorScheme();

  // Use forced mode if provided, otherwise follow system
  const mode: ThemeMode = forcedMode ?? (systemColorScheme === 'dark' ? 'dark' : 'dark');
  // Note: Default to dark for this sporty app theme

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? darkColors : lightColors,
      palette,
      typography,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      spacing,
      radius,
      shadow,
      size,
      layout,
      duration,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Access the theme values in any component.
 *
 * @example
 * const { colors, spacing, typography } = useTheme();
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: colors.background,
 *     padding: spacing.base,
 *   },
 *   title: {
 *     ...typography.h2,
 *     color: colors.text,
 *   },
 * });
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  // Return default value if context is somehow undefined (shouldn't happen with default value)
  if (!context) {
    console.warn('useTheme: context is undefined, using default value');
    return defaultValue;
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export type { ThemeContextValue, ThemeMode };

/**
 * ShareTips Design System — Main Export
 *
 * Import everything from here:
 * import { useTheme, colors, spacing, typography } from '@/theme';
 */

// ═══════════════════════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════════════════════

export { ThemeProvider, useTheme } from './ThemeContext';
export type { ThemeContextValue, ThemeMode } from './ThemeContext';

// ═══════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════

export {
  lightColors,
  darkColors,
  darkColorsExtended,
  palette,
  gradients,
  shadows,
  glass,
} from './colors';

export type {
  ThemeColors,
  Gradients,
  Shadows,
  Glass,
} from './colors';

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export {
  typography,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  letterSpacing,
} from './typography';

export type {
  Typography,
  FontSize,
  FontWeight,
  LineHeight,
  LetterSpacing,
} from './typography';

// ═══════════════════════════════════════════════════════════════
// SPACING & LAYOUT
// ═══════════════════════════════════════════════════════════════

export {
  spacing,
  radius,
  shadow,
  size,
  layout,
  duration,
  iconSizes,
} from './spacing';

export type {
  Spacing,
  Radius,
  Shadow,
  Duration,
  IconSize,
} from './spacing';

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENT STYLES
// ═══════════════════════════════════════════════════════════════

export {
  // Cards
  cardStyle,
  cardCompactStyle,
  cardElevatedStyle,
  // Icon wrappers
  iconWrapperLarge,
  iconWrapperMedium,
  iconWrapperSmall,
  // Badges
  badgePrimary,
  badgePrimaryText,
  badgeAccent,
  badgeSubtle,
  sectionBadge,
  sportBadge,
  sportBadgeText,
  premiumBadge,
  premiumBadgeText,
  // Layout helpers
  rowCenter,
  rowCenterGap,
  rowBetween,
  centered,
  centeredFull,
  // Empty states
  emptyContainer,
  emptyTitle,
  emptyHint,
  // Loading states
  loadingContainer,
  loadingText,
  // Error states
  errorContainer,
  errorIconWrapper,
  errorTitle,
  errorText,
  retryButton,
  // Lists
  listContent,
  listItem,
  // Buttons
  buttonPrimary,
  buttonPrimaryText,
  buttonSecondary,
  buttonSecondaryText,
  // Chips
  chip,
  chipActive,
  chipText,
  chipTextActive,
  // Tabs
  tabBar,
  tab,
  tabActive,
  tabText,
  tabTextActive,
  // Stats
  statsCard,
  statItem,
  statValue,
  statLabel,
  // Dividers
  divider,
  dividerVertical,
  // Modals
  modalOverlay,
  modalContent,
  modalBottomSheet,
  modalHeader,
  // Inputs
  inputContainer,
  inputFocused,
  inputError,
  inputLabel,
  inputHelper,
  // Avatars
  avatarBase,
  avatarSm,
  avatarMd,
  avatarLg,
  avatarText,
} from './components';

// ═══════════════════════════════════════════════════════════════
// EFFECTS (Gradients, Shadows, Glass, Animations)
// ═══════════════════════════════════════════════════════════════

export {
  // Gradients
  effectGradients,
  // Shadows
  effectShadows,
  createShadow,
  createGlow,
  platformShadow,
  // Glassmorphism
  effectGlass,
  createGlassStyle,
  createColoredGlass,
  elevatedGlass,
  // Animations
  durations,
  easings,
  animationConfigs,
  springConfigs,
} from './effects';

export type {
  ShadowStyle,
  GlassStyle,
  EffectGradients,
  EffectShadows,
  EffectGlass,
  Durations,
  Easings,
  AnimationConfigs,
  SpringConfigs,
} from './effects';

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM (Centralized reference)
// ═══════════════════════════════════════════════════════════════

export { DS } from './designSystem';
export type { DSColors, DSTypography, DSSpacing } from './designSystem';

/**
 * ShareTips Design System — Shared Component Styles
 *
 * Reusable style patterns extracted from duplicated inline styles.
 * Use these with StyleSheet.flatten() or spread operators.
 */

import { Platform, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { palette, type ThemeColors } from './colors';
import { spacing, radius, shadow, size } from './spacing';
import { typography } from './typography';

// ═══════════════════════════════════════════════════════════════
// CARD STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Standard card container with surface background, border, and subtle shadow.
 * Used across: TicketDetail, TipsterProfile, MatchDetails, Marketplace, etc.
 */
export const cardStyle = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: spacing.base,
  borderWidth: 1,
  borderColor: colors.border,
  ...Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),
});

/**
 * Compact card variant with smaller padding.
 */
export const cardCompactStyle = (colors: ThemeColors): ViewStyle => ({
  ...cardStyle(colors),
  padding: spacing.md,
});

/**
 * Elevated card with stronger shadow for emphasis.
 */
export const cardElevatedStyle = (colors: ThemeColors): ViewStyle => ({
  ...cardStyle(colors),
  ...Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),
});

// ═══════════════════════════════════════════════════════════════
// ICON WRAPPER STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Large circular icon wrapper (80x80) - empty states, profile avatars.
 * Used across: Matches, MyTickets, Notifications, Wallet, Marketplace, etc.
 */
export const iconWrapperLarge = (colors: ThemeColors): ViewStyle => ({
  width: size.avatar['2xl'],
  height: size.avatar['2xl'],
  borderRadius: radius.full,
  backgroundColor: colors.primaryBg,
  alignItems: 'center',
  justifyContent: 'center',
  ...Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),
});

/**
 * Medium circular icon wrapper (44x44) - list items, notifications.
 */
export const iconWrapperMedium = (colors: ThemeColors): ViewStyle => ({
  width: 44,
  height: 44,
  borderRadius: radius.full,
  backgroundColor: colors.primaryBg,
  alignItems: 'center',
  justifyContent: 'center',
});

/**
 * Small circular icon wrapper (32x32) - compact indicators.
 */
export const iconWrapperSmall = (colors: ThemeColors): ViewStyle => ({
  width: size.avatar.sm,
  height: size.avatar.sm,
  borderRadius: radius.full,
  backgroundColor: colors.primaryBg,
  alignItems: 'center',
  justifyContent: 'center',
});

// ═══════════════════════════════════════════════════════════════
// BADGE STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Primary badge with green background.
 */
export const badgePrimary = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.primary,
  borderRadius: radius.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
});

/**
 * Primary badge text styling.
 */
export const badgePrimaryText = (colors: ThemeColors): TextStyle => ({
  ...typography.badge,
  color: colors.textOnPrimary,
  fontWeight: '700',
});

/**
 * Section badge with icon - used for section headers.
 */
export const sectionBadge = (colors: ThemeColors): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.full,
  ...Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
});

/**
 * Accent badge with orange background.
 */
export const badgeAccent = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.accentBg,
  borderRadius: radius.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
});

/**
 * Subtle badge with transparent background.
 */
export const badgeSubtle = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.surfaceSecondary,
  borderRadius: radius.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
});

// ═══════════════════════════════════════════════════════════════
// LAYOUT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Flex row with center alignment - most common layout pattern.
 */
export const rowCenter: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

/**
 * Flex row with center alignment and gap.
 */
export const rowCenterGap = (gap: number = spacing.md): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap,
});

/**
 * Flex row with space-between and center alignment.
 */
export const rowBetween: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

/**
 * Centered container (both axes).
 */
export const centered: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Full-screen centered container - loading states, empty states.
 */
export const centeredFull = (colors: ThemeColors): ViewStyle => ({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.background,
});

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Empty state container.
 */
export const emptyContainer: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: spacing.lg,
};

/**
 * Empty state title text.
 */
export const emptyTitle = (colors: ThemeColors): TextStyle => ({
  ...typography.h4,
  color: colors.text,
  marginBottom: spacing.xs,
  textAlign: 'center',
});

/**
 * Empty state hint/description text.
 */
export const emptyHint = (colors: ThemeColors): TextStyle => ({
  ...typography.body,
  color: colors.textSecondary,
  textAlign: 'center',
  maxWidth: 280,
});

// ═══════════════════════════════════════════════════════════════
// LOADING STATE STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Loading container with centered spinner.
 */
export const loadingContainer = (colors: ThemeColors): ViewStyle => ({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.background,
  gap: spacing.md,
});

/**
 * Loading text styling.
 */
export const loadingText = (colors: ThemeColors): TextStyle => ({
  ...typography.body,
  color: colors.textSecondary,
});

// ═══════════════════════════════════════════════════════════════
// LIST STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Standard list content container padding.
 */
export const listContent: ViewStyle = {
  padding: spacing.md,
  paddingBottom: spacing.xl,
};

/**
 * List item with bottom margin.
 */
export const listItem: ViewStyle = {
  marginBottom: spacing.sm,
};

// ═══════════════════════════════════════════════════════════════
// BUTTON PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * Primary button base style.
 */
export const buttonPrimary = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.primary,
  borderRadius: radius.lg,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
  ...Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
});

/**
 * Primary button text.
 */
export const buttonPrimaryText = (colors: ThemeColors): TextStyle => ({
  ...typography.button,
  color: colors.textOnPrimary,
});

/**
 * Secondary/outline button style.
 */
export const buttonSecondary = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.primaryBg,
  borderRadius: radius.lg,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: `${colors.primary}30`,
});

/**
 * Secondary button text.
 */
export const buttonSecondaryText = (colors: ThemeColors): TextStyle => ({
  ...typography.button,
  color: colors.primary,
});

// ═══════════════════════════════════════════════════════════════
// CHIP STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Filter chip - inactive state.
 */
export const chip = (colors: ThemeColors): ViewStyle => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.full,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
});

/**
 * Filter chip - active state.
 */
export const chipActive = (colors: ThemeColors): ViewStyle => ({
  ...chip(colors),
  backgroundColor: colors.primary,
  borderColor: colors.primary,
});

/**
 * Chip text - inactive.
 */
export const chipText = (colors: ThemeColors): TextStyle => ({
  ...typography.body,
  color: colors.textSecondary,
  fontWeight: '500',
});

/**
 * Chip text - active.
 */
export const chipTextActive = (colors: ThemeColors): TextStyle => ({
  ...chipText(colors),
  color: colors.textOnPrimary,
});

// ═══════════════════════════════════════════════════════════════
// DIVIDER STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Horizontal divider line.
 */
export const divider = (colors: ThemeColors): ViewStyle => ({
  height: 1,
  backgroundColor: colors.divider,
});

/**
 * Vertical divider (for row layouts).
 */
export const dividerVertical = (colors: ThemeColors): ViewStyle => ({
  width: 1,
  backgroundColor: colors.divider,
  alignSelf: 'stretch',
});

// ═══════════════════════════════════════════════════════════════
// MODAL STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Modal overlay background.
 */
export const modalOverlay = (colors: ThemeColors): ViewStyle => ({
  flex: 1,
  backgroundColor: colors.overlay,
  justifyContent: 'center',
  alignItems: 'center',
  padding: spacing.lg,
});

/**
 * Modal content container.
 */
export const modalContent = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
  padding: spacing.lg,
  width: '100%',
  maxWidth: 340,
  ...Platform.select({
    ios: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
});

/**
 * Bottom sheet modal content (slides from bottom).
 */
export const modalBottomSheet = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius['2xl'],
  borderTopRightRadius: radius['2xl'],
  maxHeight: '80%',
  minHeight: 300,
});

/**
 * Modal header with title and close button.
 */
export const modalHeader = (colors: ThemeColors): ViewStyle => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: spacing.lg,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.separator,
});

// ═══════════════════════════════════════════════════════════════
// ERROR STATE STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Error state container.
 */
export const errorContainer = (colors: ThemeColors): ViewStyle => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.background,
  padding: spacing.lg,
});

/**
 * Error icon wrapper with danger background.
 */
export const errorIconWrapper = (colors: ThemeColors): ViewStyle => ({
  width: size.avatar['2xl'],
  height: size.avatar['2xl'],
  borderRadius: radius.full,
  backgroundColor: colors.dangerBg,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.md,
  ...Platform.select({
    ios: {
      shadowColor: colors.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: palette.opacity[15],
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),
});

/**
 * Error title text.
 */
export const errorTitle = (colors: ThemeColors): TextStyle => ({
  ...typography.h4,
  color: colors.text,
  marginBottom: spacing.xs,
});

/**
 * Error description text.
 */
export const errorText = (colors: ThemeColors): TextStyle => ({
  ...typography.body,
  color: colors.textSecondary,
  textAlign: 'center',
  marginBottom: spacing.lg,
});

/**
 * Retry button in error states.
 */
export const retryButton = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  borderRadius: radius.md,
  ...Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: palette.opacity[30],
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
});

// ═══════════════════════════════════════════════════════════════
// TAB BAR STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Tab bar container.
 */
export const tabBar = (colors: ThemeColors): ViewStyle => ({
  flexDirection: 'row',
  backgroundColor: colors.surface,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: colors.border,
});

/**
 * Individual tab style.
 */
export const tab: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  paddingVertical: spacing.md,
  borderBottomWidth: spacing.xxs,
  borderBottomColor: 'transparent',
};

/**
 * Active tab style modifier.
 */
export const tabActive = (colors: ThemeColors): ViewStyle => ({
  borderBottomColor: colors.primary,
});

/**
 * Tab text - inactive.
 */
export const tabText = (colors: ThemeColors): TextStyle => ({
  ...typography.bodySmall,
  fontWeight: '600',
  color: colors.textSecondary,
});

/**
 * Tab text - active.
 */
export const tabTextActive = (colors: ThemeColors): TextStyle => ({
  ...tabText(colors),
  color: colors.primary,
});

// ═══════════════════════════════════════════════════════════════
// STATS STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Stats card container.
 */
export const statsCard = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.surface,
  borderRadius: radius.base,
  padding: spacing['md+'],
  marginBottom: spacing['sm+'],
});

/**
 * Individual stat item in a row.
 */
export const statItem: ViewStyle = {
  flex: 1,
  alignItems: 'center',
};

/**
 * Stat value text.
 */
export const statValue = (colors: ThemeColors): TextStyle => ({
  ...typography.body,
  fontWeight: '800',
  color: colors.text,
});

/**
 * Stat label text.
 */
export const statLabel = (colors: ThemeColors): TextStyle => ({
  ...typography.captionSmall,
  color: colors.textSecondary,
  marginTop: spacing.xxs,
  textAlign: 'center',
});

// ═══════════════════════════════════════════════════════════════
// SPORT BADGE STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Sport/category badge.
 */
export const sportBadge = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.background,
  borderRadius: radius.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
});

/**
 * Sport badge text.
 */
export const sportBadgeText = (colors: ThemeColors): TextStyle => ({
  ...typography.mini,
  fontWeight: '600',
  color: colors.textSecondary,
});

/**
 * Premium/paid badge.
 */
export const premiumBadge = (colors: ThemeColors): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.warningLight,
  borderRadius: radius.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  gap: spacing.xs,
});

/**
 * Premium badge text.
 */
export const premiumBadgeText = (colors: ThemeColors): TextStyle => ({
  ...typography.caption,
  fontWeight: '600',
  color: colors.warning,
});

// ═══════════════════════════════════════════════════════════════
// INPUT STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Standard text input container.
 */
export const inputContainer = (colors: ThemeColors): ViewStyle => ({
  backgroundColor: colors.inputBg,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.inputBorder,
  paddingHorizontal: spacing.base,
  paddingVertical: spacing.md,
});

/**
 * Input focused state modifier.
 */
export const inputFocused = (colors: ThemeColors): ViewStyle => ({
  borderColor: colors.inputBorderFocus,
});

/**
 * Input error state modifier.
 */
export const inputError = (colors: ThemeColors): ViewStyle => ({
  borderColor: colors.danger,
});

/**
 * Input label text.
 */
export const inputLabel = (colors: ThemeColors): TextStyle => ({
  ...typography.caption,
  fontWeight: '600',
  color: colors.text,
  marginBottom: spacing.xs,
});

/**
 * Input helper/error text.
 */
export const inputHelper = (colors: ThemeColors): TextStyle => ({
  ...typography.caption,
  color: colors.textSecondary,
  marginTop: spacing.xs,
});

// ═══════════════════════════════════════════════════════════════
// AVATAR STYLES
// ═══════════════════════════════════════════════════════════════

/**
 * Avatar container base style.
 */
export const avatarBase = (sizeValue: number, colors: ThemeColors): ViewStyle => ({
  width: sizeValue,
  height: sizeValue,
  borderRadius: radius.full,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
});

/**
 * Avatar small (40px).
 */
export const avatarSm = (colors: ThemeColors): ViewStyle =>
  avatarBase(size.profile.avatarSm, colors);

/**
 * Avatar medium (64px).
 */
export const avatarMd = (colors: ThemeColors): ViewStyle =>
  avatarBase(size.profile.avatarMd, colors);

/**
 * Avatar large (80px).
 */
export const avatarLg = (colors: ThemeColors): ViewStyle =>
  avatarBase(size.profile.avatarLg, colors);

/**
 * Avatar text/initials.
 */
export const avatarText = (colors: ThemeColors): TextStyle => ({
  color: colors.textOnPrimary,
  fontWeight: '800',
});

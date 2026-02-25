/**
 * ShareTips Design System — Référence visuelle centralisée
 *
 * Ce fichier contient TOUTES les constantes de design utilisées
 * dans l'app pour garantir une cohérence visuelle parfaite.
 *
 * Basé sur le design de MatchesScreen et de la bottom tab bar.
 */

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════

export const DS = {
  // ── Couleurs ─────────────────────────────────────────────────
  colors: {
    // Backgrounds
    background: '#0A0F0C',
    cardBg: '#131916',
    buttonBg: '#121815',

    // Borders
    cardBorder: '#1E2A22',
    buttonBorder: '#1C2B21',
    tabBarBorder: '#1A2420',

    // Green palette
    green: '#2D8C4E',
    greenLight: '#4ADE80',
    greenGlow: 'rgba(45, 140, 78, 0.3)',
    greenBgSubtle: 'rgba(45, 140, 78, 0.15)',

    // Text
    white: '#FFFFFF',
    textSecondary: '#8A9A8F',
    textVs: '#4A5A4E',

    // Tab bar
    tabInactive: '#5A6A5E',
    tabBarBg: '#0A0F0C',
  },

  // ── Card styles ──────────────────────────────────────────────
  card: {
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#2D8C4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Odds button styles ───────────────────────────────────────
  oddsButton: {
    backgroundColor: '#121815',
    borderWidth: 1,
    borderColor: '#1C2B21',
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#2D8C4E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Team logo styles ─────────────────────────────────────────
  teamLogo: {
    size: 48,
    borderRadius: 24,
    backgroundColor: '#0F1611',
    borderWidth: 1.5,
    borderColor: '#2D8C4E',
  },

  // ── Filter chip styles ───────────────────────────────────────
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3830',
  },

  // ── Date badge styles ────────────────────────────────────────
  dateBadge: {
    backgroundColor: 'rgba(45, 140, 78, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  // ── Tab bar styles ───────────────────────────────────────────
  tabBar: {
    height: 52,
    backgroundColor: '#0A0F0C',
    borderTopWidth: 1,
    borderTopColor: '#1A2420',
  },

  // ── FAB (center button) styles ───────────────────────────────
  fab: {
    outerSize: 58,
    innerSize: 50,
    iconSize: 26,
    marginTop: -18,
    glowBorderWidth: 2,
    glowBorderColor: 'rgba(45, 140, 78, 0.3)',
    shadowColor: '#2D8C4E',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },

  // ── Typography ───────────────────────────────────────────────
  typography: {
    headerTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    leagueName: {
      fontSize: 12,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
    },
    teamName: {
      fontSize: 13,
      fontWeight: '500' as const,
    },
    oddsValue: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
    oddsLabel: {
      fontSize: 10,
      fontWeight: '400' as const,
    },
    secondary: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '500' as const,
    },
    dateLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
  },

  // ── Spacing ──────────────────────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
  },

  // ── Icon sizes ───────────────────────────────────────────────
  icons: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 22,
    xl: 26,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type DSColors = typeof DS.colors;
export type DSTypography = typeof DS.typography;
export type DSSpacing = typeof DS.spacing;

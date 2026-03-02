/**
 * MatchCard — Carte de Match Premium
 *
 * Carte interactive affichant les détails d'un match avec cotes.
 * Design premium avec animations fluides et effets visuels.
 *
 * Fonctionnalités :
 * - Variantes : default, compact, featured, live, glass
 * - Animation d'entrée (fade + slide)
 * - Animation de pression (scale)
 * - Badge LIVE avec pulse
 * - Sélection de cotes intégrée
 * - Effet glassmorphism optionnel
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import OddsButton from './OddsButton';
import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  effectGradients,
  springConfigs,
} from '../../theme';
import type {
  MatchDetail,
  MarketSelection,
  TicketSelection,
  RootStackParamList,
} from '../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles de la carte */
export type MatchCardVariant = 'default' | 'compact' | 'featured' | 'live' | 'glass';

export interface MatchCardProps {
  /** Données du match */
  match: MatchDetail;
  /** Variante visuelle (défaut: 'default') */
  variant?: MatchCardVariant;
  /** Afficher les cotes (défaut: true) */
  showOdds?: boolean;
  /** Afficher le footer marchés (défaut: true) */
  showFooter?: boolean;
  /** Animation d'entrée (défaut: true) */
  animated?: boolean;
  /** Animation de pression (défaut: true) */
  pressable?: boolean;
  /** Délai d'animation d'entrée en ms (défaut: 0) */
  animationDelay?: number;
  /** Bordure glassmorphism (défaut: false, auto si variant='glass') */
  glassBorder?: boolean;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
  /** Callback press personnalisé (remplace navigation) */
  onPress?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return 'Demain';
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isMatchStarted(match: MatchDetail): boolean {
  return (
    match.status !== 'Scheduled' || new Date(match.startTime) <= new Date()
  );
}

function isMatchLive(match: MatchDetail): boolean {
  return match.status === 'InProgress' || match.status === 'Live';
}

function getTeamInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getSportIcon(sportCode: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'FOOTBALL': 'football',
    'BASKETBALL': 'basketball',
    'TENNIS': 'tennisball',
    'BASEBALL': 'baseball',
    'HOCKEY': 'snow',
    'RUGBY': 'american-football',
    'VOLLEYBALL': 'basketball-outline',
    'HANDBALL': 'hand-left',
    'GOLF': 'golf',
    'BOXING': 'fitness',
    'MMA': 'fitness',
    'ESPORTS': 'game-controller',
  };
  return iconMap[sportCode.toUpperCase()] || 'trophy';
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const VARIANT_CONFIG: Record<
  MatchCardVariant,
  {
    showAvatar: boolean;
    compactOdds: boolean;
    showDate: boolean;
    hasGradient: boolean;
    avatarSize: number;
  }
> = {
  default: { showAvatar: true, compactOdds: false, showDate: false, hasGradient: false, avatarSize: 52 },
  compact: { showAvatar: false, compactOdds: true, showDate: false, hasGradient: false, avatarSize: 0 },
  featured: { showAvatar: true, compactOdds: false, showDate: true, hasGradient: true, avatarSize: 64 },
  live: { showAvatar: true, compactOdds: false, showDate: false, hasGradient: false, avatarSize: 52 },
  glass: { showAvatar: true, compactOdds: false, showDate: false, hasGradient: true, avatarSize: 52 },
};

// ═══════════════════════════════════════════════════════════════
// LIVE BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════

const LiveBadge: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={liveBadgeStyles(colors).badge}>
      <View style={liveBadgeStyles(colors).dotContainer}>
        <Animated.View
          style={[
            liveBadgeStyles(colors).dotPulse,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <View style={liveBadgeStyles(colors).dot} />
      </View>
      <Text style={liveBadgeStyles(colors).text}>LIVE</Text>
    </View>
  );
});

LiveBadge.displayName = 'LiveBadge';

const liveBadgeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.dangerBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      zIndex: 10,
    },
    dotContainer: {
      width: 8,
      height: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotPulse: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      opacity: 0.3,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.danger,
    },
    text: {
      fontSize: 10,
      fontWeight: '800',
      fontFamily: typography.badge?.fontFamily ?? typography.caption.fontFamily,
      color: colors.danger,
      letterSpacing: 1,
    },
  });

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MatchCardComponent: React.FC<MatchCardProps> = ({
  match,
  variant = 'default',
  showOdds = true,
  showFooter = true,
  animated = true,
  pressable = true,
  animationDelay = 0,
  glassBorder: customGlassBorder,
  style,
  onPress: customOnPress,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ── Configuration ──────────────────────────────────────────────
  const variantConfig = VARIANT_CONFIG[variant];
  const glassBorder = customGlassBorder ?? variant === 'glass';
  const started = isMatchStarted(match);
  const live = isMatchLive(match);
  const effectiveVariant = live ? 'live' : variant;
  const hasNoDrawOption = match.sportCode !== 'FOOTBALL';

  // ── Store ──────────────────────────────────────────────────────
  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);
  const isSelected = useCallback(
    (selectionId: string) => selections.some((s) => s.selectionId === selectionId),
    [selections]
  );

  // ── Animations ─────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(16)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(colors, effectiveVariant, variantConfig, glassBorder);

  // ── Entrance animation ─────────────────────────────────────────
  useEffect(() => {
    if (!animated) {
      fadeAnim.setValue(1);
      translateYAnim.setValue(0);
      return;
    }

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          ...springConfigs.gentle,
        }),
      ]).start();
    }, animationDelay);

    return () => clearTimeout(timeout);
  }, [animated, animationDelay, fadeAnim, translateYAnim]);

  // ── Market / Selections ────────────────────────────────────────
  const matchResult = useMemo(
    () => match.markets.find((m) => m.type === 'MatchResult' || m.type === 'MoneyLine'),
    [match.markets]
  );

  const oddsSelections = useMemo(() => {
    if (!matchResult) return [];

    const homeTeamSel = matchResult.selections.find(
      (s) =>
        s.label === match.homeTeam.name ||
        s.label === match.homeTeam.shortName ||
        s.label === '1' ||
        s.code === 'HOME' ||
        s.code === 'HOME_WIN' ||
        s.code === 'HOME_ML'
    );
    const drawSel = !hasNoDrawOption
      ? matchResult.selections.find(
          (s) => s.label === 'Draw' || s.label === 'X' || s.code === 'X' || s.code === 'DRAW'
        )
      : null;
    const awayTeamSel = matchResult.selections.find(
      (s) =>
        s.label === match.awayTeam.name ||
        s.label === match.awayTeam.shortName ||
        s.label === '2' ||
        s.code === 'AWAY' ||
        s.code === 'AWAY_WIN' ||
        s.code === 'AWAY_ML'
    );

    return hasNoDrawOption
      ? [
          { sel: homeTeamSel, label: '1' },
          { sel: awayTeamSel, label: '2' },
        ]
      : [
          { sel: homeTeamSel, label: '1' },
          { sel: drawSel, label: 'X' },
          { sel: awayTeamSel, label: '2' },
        ];
  }, [matchResult, match.homeTeam, match.awayTeam, hasNoDrawOption]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleOddsPress = useCallback(
    (sel: MarketSelection) => {
      if (started || !matchResult) return;
      const selection: TicketSelection = {
        matchId: match.id,
        matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        leagueName: match.leagueName,
        sportCode: match.sportCode,
        startTime: match.startTime,
        selectionId: sel.id,
        marketType: matchResult.type,
        marketLabel: matchResult.label,
        selectionLabel: sel.label,
        odds: sel.odds,
      };
      toggleSelection(selection);
    },
    [started, matchResult, match, toggleSelection]
  );

  const navigateToDetails = useCallback(() => {
    if (customOnPress) {
      customOnPress();
    } else {
      navigation.navigate('MatchDetails', {
        matchId: match.id,
        title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      });
    }
  }, [customOnPress, navigation, match]);

  const handlePressIn = useCallback(() => {
    if (!pressable) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      ...springConfigs.button,
    }).start();
  }, [pressable, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!pressable) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.snappy,
    }).start();
  }, [pressable, scaleAnim]);

  // ── Render content ─────────────────────────────────────────────
  const renderContent = () => (
    <>
      {/* League badge - top left with sport icon */}
      <View style={styles.leagueBadge}>
        <Ionicons name={getSportIcon(match.sportCode)} size={14} color={colors.primary} />
        <Text style={styles.leagueText}>{match.leagueName}</Text>
      </View>

      {/* Time badge - top right */}
      <View style={styles.timeBadge}>
        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
        <Text style={styles.timeText}>{formatTime(match.startTime)}</Text>
      </View>

      {/* Live badge */}
      {live && <LiveBadge colors={colors} />}

      {/* Soon badge (not live but started) */}
      {started && !live && (
        <View style={styles.soonBadge}>
          <Ionicons name="hourglass-outline" size={10} color={colors.warning} />
          <Text style={styles.soonText}>Bientôt</Text>
        </View>
      )}

      {/* Date for featured variant */}
      {variantConfig.showDate && (
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={11} color={colors.textTertiary} />
          <Text style={styles.dateText}>{formatDate(match.startTime)}</Text>
        </View>
      )}

      {/* Teams section */}
      <View style={styles.teamsContainer}>
        {/* Home team */}
        <View style={styles.teamSection}>
          {variantConfig.showAvatar && (
            <View style={styles.teamAvatar}>
              <Text style={styles.teamInitials}>{getTeamInitials(match.homeTeam.name)}</Text>
            </View>
          )}
          <Text style={styles.teamName} numberOfLines={2}>
            {match.homeTeam.name}
          </Text>
        </View>

        {/* VS divider - circular badge */}
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Away team */}
        <View style={styles.teamSection}>
          {variantConfig.showAvatar && (
            <View style={styles.teamAvatar}>
              <Text style={styles.teamInitials}>{getTeamInitials(match.awayTeam.name)}</Text>
            </View>
          )}
          <Text style={styles.teamName} numberOfLines={2}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      {/* Odds row */}
      {showOdds && matchResult && (
        <View style={styles.oddsContainer}>
          {oddsSelections.map(({ sel, label }) =>
            sel ? (
              <OddsButton
                key={sel.id}
                label={label}
                odds={sel.odds}
                isSelected={isSelected(sel.id)}
                disabled={started}
                onPress={() => handleOddsPress(sel)}
                variant={variantConfig.compactOdds ? 'compact' : 'default'}
              />
            ) : null
          )}
        </View>
      )}

      {/* Footer - markets count */}
      {showFooter && (
        <TouchableOpacity
          style={styles.footer}
          onPress={navigateToDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.marketsText}>
            +{match.markets.length} marché{match.markets.length > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Glass border overlay */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </>
  );

  // ── Main render ────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
        style,
      ]}
    >
      <TouchableWithoutFeedback
        onPress={navigateToDetails}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Match ${match.homeTeam.name} contre ${match.awayTeam.name}`}
        accessibilityRole="button"
      >
        <View>
          {variantConfig.hasGradient ? (
            <LinearGradient
              colors={
                variant === 'featured'
                  ? ['rgba(30, 215, 96, 0.08)', 'rgba(30, 215, 96, 0.02)']
                  : ['rgba(35, 35, 40, 0.95)', 'rgba(25, 25, 30, 0.90)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {renderContent()}
            </LinearGradient>
          ) : (
            <View style={styles.card}>{renderContent()}</View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: MatchCardVariant,
  variantConfig: (typeof VARIANT_CONFIG)[MatchCardVariant],
  glassBorder: boolean
) =>
  useMemo(
    () =>
      StyleSheet.create({
        animatedWrapper: {
          marginBottom: spacing.sm,
        },
        card: {
          backgroundColor: variant === 'glass' ? 'rgba(30, 30, 35, 0.85)' : colors.surface,
          borderRadius: radius.xl,
          padding: spacing.base,
          position: 'relative',
          overflow: 'hidden',
          // Border
          borderWidth: 1,
          borderColor:
            variant === 'featured'
              ? `${colors.primary}30`
              : variant === 'live'
                ? `${colors.danger}20`
                : variant === 'glass'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : colors.border,
          // Shadow
          ...Platform.select({
            ios: {
              shadowColor: variant === 'live' ? colors.danger : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
            },
            android: {
              elevation: variant === 'featured' ? 6 : 4,
            },
          }),
        },
        leagueBadge: {
          position: 'absolute',
          top: spacing.md,
          left: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          zIndex: 10,
        },
        leagueText: {
          fontSize: 11,
          fontWeight: '700',
          fontFamily: typography.caption.fontFamily,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        timeBadge: {
          position: 'absolute',
          top: spacing.md,
          right: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          zIndex: 10,
        },
        timeText: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: typography.caption.fontFamily,
          color: colors.textSecondary,
        },
        soonBadge: {
          position: 'absolute',
          top: spacing.md + 24,
          left: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.warningBg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          zIndex: 10,
        },
        soonText: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: typography.badge?.fontFamily ?? typography.caption.fontFamily,
          color: colors.warning,
        },
        dateBadge: {
          position: 'absolute',
          top: spacing.md + 24,
          left: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: `${colors.background}E6`,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          zIndex: 10,
        },
        dateText: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: typography.caption.fontFamily,
          color: colors.textTertiary,
        },
        teamsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.xl + spacing.sm,
          marginBottom: spacing.base,
          paddingHorizontal: spacing.sm,
        },
        teamSection: {
          flex: 1,
          alignItems: 'center',
          gap: spacing.sm,
        },
        teamAvatar: {
          width: variantConfig.avatarSize,
          height: variantConfig.avatarSize,
          borderRadius: variantConfig.avatarSize / 2,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${colors.primary}30`,
        },
        teamInitials: {
          fontSize: variantConfig.avatarSize > 52 ? 16 : 14,
          fontWeight: '700',
          fontFamily: typography.bodySmall.fontFamily,
          color: colors.primary,
        },
        teamName: {
          fontSize: 13,
          fontWeight: '700',
          fontFamily: typography.bodySmall.fontFamily,
          color: colors.text,
          textAlign: 'center',
          lineHeight: 18,
        },
        vsCircle: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.primaryBg,
          borderWidth: 2,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        vsText: {
          fontSize: 12,
          fontWeight: '900',
          fontFamily: typography.caption.fontFamily,
          color: colors.primary,
          letterSpacing: 0.5,
        },
        oddsContainer: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        marketsText: {
          fontSize: 13,
          fontWeight: '600',
          fontFamily: typography.bodySmall.fontFamily,
          color: colors.primary,
        },
        glassBorderOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: radius.xl,
          borderWidth: effectGlass.light.borderWidth,
          borderColor: effectGlass.light.borderColor,
        },
      }),
    [colors, variant, variantConfig, glassBorder]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Carte de match par défaut */
export const DefaultMatchCard: React.FC<Omit<MatchCardProps, 'variant'>> = (props) => (
  <MatchCardComponent variant="default" {...props} />
);

/** Carte de match compacte (sans avatars) */
export const CompactMatchCard: React.FC<Omit<MatchCardProps, 'variant'>> = (props) => (
  <MatchCardComponent variant="compact" {...props} />
);

/** Carte de match mise en avant */
export const FeaturedMatchCard: React.FC<Omit<MatchCardProps, 'variant'>> = (props) => (
  <MatchCardComponent variant="featured" {...props} />
);

/** Carte de match en direct */
export const LiveMatchCard: React.FC<Omit<MatchCardProps, 'variant'>> = (props) => (
  <MatchCardComponent variant="live" {...props} />
);

/** Carte de match glassmorphism */
export const GlassMatchCard: React.FC<Omit<MatchCardProps, 'variant'>> = (props) => (
  <MatchCardComponent variant="glass" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

const MatchCard = React.memo(MatchCardComponent);
export default MatchCard;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import { matchApi } from '../api/match.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import type {
  MatchDetail,
  Market,
  MarketSelection,
  TicketSelection,
} from '../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  createGlow,
  springConfigs,
} from '../theme';
import { DS } from '../theme/designSystem';
import { getTeamLogo, getTennisFlag } from '../utils/teamAssets';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

/**
 * Format market label with line value when applicable
 */
function formatMarketLabel(market: Market): string {
  const { type, label, line } = market;

  // If no line, return label as-is
  if (line == null) return label;

  // Format based on market type
  const marketType = type.toLowerCase();

  // Handicap markets: show the spread
  if (marketType.includes('handicap') || marketType === 'spreads') {
    const sign = line >= 0 ? '+' : '';
    return `${label} (${sign}${line})`;
  }

  // Over/Under (totals) markets: show the line
  if (marketType.includes('overunder') || marketType.includes('total')) {
    return `${label} (${line})`;
  }

  // Corners, Cards totals
  if (marketType.includes('corner') || marketType.includes('card')) {
    return `${label} (${line})`;
  }

  // Default: show line in parentheses
  return `${label} (${line})`;
}

/**
 * Format selection label with additional context
 * Uses the selection's own point value for accurate display
 */
function formatSelectionLabel(sel: MarketSelection, market: Market): string {
  const { label, code, point } = sel;
  const { type } = market;
  const marketType = type.toLowerCase();

  // For Over/Under, show "Over 2.5" or "Under 2.5"
  if (marketType.includes('overunder') || marketType.includes('total')) {
    if (point != null) {
      if (code === 'OVER') {
        return `Over ${point}`;
      }
      if (code === 'UNDER') {
        return `Under ${point}`;
      }
    }
  }

  // For Handicap/Spreads, show team name with the point
  if (marketType.includes('handicap') || marketType === 'spreads') {
    if (point != null) {
      const sign = point >= 0 ? '+' : '';
      return `${label} (${sign}${point})`;
    }
  }

  // For Corners/Cards totals
  if (marketType.includes('corner') || marketType.includes('card')) {
    if (point != null) {
      if (code === 'OVER') {
        return `Over ${point}`;
      }
      if (code === 'UNDER') {
        return `Under ${point}`;
      }
    }
  }

  return label;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Bouton de sélection avec animation premium
 */
const SelectionButton: React.FC<{
  sel: MarketSelection;
  market: Market;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
}> = React.memo(({ sel, market, selected, disabled, onPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [selected, glowAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        selBtnStyles.wrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          selBtnStyles.container,
          {
            backgroundColor: selected ? DS.colors.green : DS.colors.buttonBg,
            borderColor: selected ? DS.colors.green : DS.colors.buttonBorder,
          },
          selected && Platform.select({
            ios: createGlow(DS.colors.green, 0.4),
            android: { elevation: 6 },
          }),
          disabled && selBtnStyles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {selected && (
          <Animated.View
            style={[
              selBtnStyles.glowOverlay,
              { opacity: glowOpacity, backgroundColor: DS.colors.white },
            ]}
          />
        )}
        <Text
          style={[
            typography.caption,
            selBtnStyles.label,
            { color: selected ? DS.colors.white : DS.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {formatSelectionLabel(sel, market)}
        </Text>
        <Text
          style={[
            typography.odds,
            selBtnStyles.odds,
            { color: selected ? DS.colors.white : DS.colors.greenLight },
          ]}
        >
          {sel.odds.toFixed(2)}
        </Text>
        {selected && (
          <View style={[selBtnStyles.checkBadge, { backgroundColor: DS.colors.white }]}>
            <Ionicons name="checkmark" size={10} color={DS.colors.green} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

SelectionButton.displayName = 'SelectionButton';

const selBtnStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: '28%',
  },
  container: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
  },
  label: {
    marginBottom: spacing.xxs,
    textAlign: 'center',
    fontWeight: '500',
  },
  odds: {
    fontWeight: '700',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Bloc de marché avec design glassmorphism
 */
const MarketBlock: React.FC<{
  market: Market;
  match: MatchDetail;
  isSelected: (selectionId: string) => boolean;
  onSelect: (market: Market, sel: MarketSelection) => void;
  started: boolean;
  colors: ThemeColors;
}> = React.memo(({ market, match, isSelected, onSelect, started, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const cardContent = (
    <>
      <View style={marketStyles.header}>
        <View style={[marketStyles.iconWrapper, { backgroundColor: DS.colors.greenBgSubtle }]}>
          <Ionicons name="analytics" size={16} color={DS.colors.green} />
        </View>
        <Text style={[typography.body, marketStyles.label, { color: DS.colors.white }]}>
          {formatMarketLabel(market)}
        </Text>
        <View style={[marketStyles.countBadge, { backgroundColor: DS.colors.greenBgSubtle }]}>
          <Text style={[typography.badge, { color: DS.colors.green }]}>
            {market.selections.length}
          </Text>
        </View>
      </View>
      <View style={marketStyles.selectionsGrid}>
        {market.selections.map((sel) => (
          <SelectionButton
            key={sel.id}
            sel={sel}
            market={market}
            selected={isSelected(sel.id)}
            disabled={started}
            onPress={() => onSelect(market, sel)}
            colors={colors}
          />
        ))}
      </View>
    </>
  );

  return (
    <Animated.View
      style={[
        marketStyles.wrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            marketStyles.card,
            {
              backgroundColor: DS.colors.cardBg,
              borderColor: DS.colors.cardBorder,
            },
          ]}
        >
          {cardContent}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

MarketBlock.displayName = 'MarketBlock';

const marketStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  selectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

/**
 * Header du match avec design premium
 */
const MatchHeader: React.FC<{
  match: MatchDetail;
  started: boolean;
  colors: ThemeColors;
}> = React.memo(({ match, started, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (started && match.status !== 'Scheduled') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [started, match.status, pulseAnim]);

  const headerContent = (
    <>
      {/* Date & Status Row */}
      <View style={headerStyles.topRow}>
        <View style={[headerStyles.dateBadge, { backgroundColor: DS.colors.buttonBg }]}>
          <Ionicons name="calendar" size={14} color={DS.colors.green} />
          <Text style={[typography.caption, { color: DS.colors.white, fontWeight: '600' }]}>
            {formatDate(match.startTime)}
          </Text>
        </View>
        {started && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={[colors.danger, `${colors.danger}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={headerStyles.liveBadge}
            >
              <View style={headerStyles.liveIndicator} />
              <Text style={[typography.badge, headerStyles.liveText]}>
                {match.status === 'Scheduled' ? 'BIENTÔT' : match.status.toUpperCase()}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* League Badge */}
      <View style={[headerStyles.leagueBadge, { backgroundColor: DS.colors.greenBgSubtle }]}>
        <Ionicons name="trophy" size={12} color={DS.colors.green} />
        <Text style={[typography.badge, headerStyles.leagueName, { color: DS.colors.green }]}>
          {match.leagueName}
        </Text>
      </View>

      {/* Teams */}
      <View style={headerStyles.teamsRow}>
        <View style={headerStyles.teamContainer}>
          <View style={[headerStyles.teamAvatar, { borderColor: DS.colors.green, backgroundColor: DS.colors.cardBg }]}>
            {(() => {
              const logoUrl = match.sportCode === 'TENNIS'
                ? getTennisFlag(match.homeTeam.name)
                : getTeamLogo(match.homeTeam.name, match.sportCode);
              return logoUrl ? (
                <Image source={{ uri: logoUrl }} style={headerStyles.teamLogoImage} />
              ) : (
                <Ionicons name="shield" size={28} color={DS.colors.green} />
              );
            })()}
          </View>
          <Text style={[typography.body, headerStyles.teamName, { color: DS.colors.white }]} numberOfLines={2}>
            {match.homeTeam.name}
          </Text>
          <Text style={[typography.caption, { color: DS.colors.textSecondary }]}>Domicile</Text>
        </View>

        <View style={headerStyles.vsContainer}>
          <View style={[headerStyles.vsBadge, { backgroundColor: DS.colors.buttonBg, borderColor: DS.colors.cardBorder }]}>
            <Text style={[typography.label, { color: DS.colors.textVs, fontWeight: '800' }]}>VS</Text>
          </View>
        </View>

        <View style={headerStyles.teamContainer}>
          <View style={[headerStyles.teamAvatar, { borderColor: DS.colors.green, backgroundColor: DS.colors.cardBg }]}>
            {(() => {
              const logoUrl = match.sportCode === 'TENNIS'
                ? getTennisFlag(match.awayTeam.name)
                : getTeamLogo(match.awayTeam.name, match.sportCode);
              return logoUrl ? (
                <Image source={{ uri: logoUrl }} style={headerStyles.teamLogoImage} />
              ) : (
                <Ionicons name="shield" size={28} color={DS.colors.green} />
              );
            })()}
          </View>
          <Text style={[typography.body, headerStyles.teamName, { color: DS.colors.white }]} numberOfLines={2}>
            {match.awayTeam.name}
          </Text>
          <Text style={[typography.caption, { color: DS.colors.textSecondary }]}>Extérieur</Text>
        </View>
      </View>

      {/* Score (if available) */}
      {match.homeScore != null && match.awayScore != null && (
        <View style={[headerStyles.scoreContainer, { backgroundColor: DS.colors.buttonBg }]}>
          <Text style={[typography.h1, { color: DS.colors.white }]}>{match.homeScore}</Text>
          <View style={[headerStyles.scoreDivider, { backgroundColor: DS.colors.cardBorder }]} />
          <Text style={[typography.h1, { color: DS.colors.white }]}>{match.awayScore}</Text>
        </View>
      )}
    </>
  );

  return (
    <View
      style={[
        headerStyles.container,
        {
          backgroundColor: DS.colors.cardBg,
          borderColor: DS.colors.cardBorder,
        },
        Platform.select({
          ios: {
            shadowColor: DS.colors.green,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: { elevation: 4 },
        }),
      ]}
    >
      {headerContent}
    </View>
  );
});

MatchHeader.displayName = 'MatchHeader';

const headerStyles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  leagueName: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  teamLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'contain',
  },
  teamName: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  vsContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  vsBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  scoreDivider: {
    width: 2,
    height: 32,
    borderRadius: 1,
  },
});

/**
 * Section header avec gradient
 */
const SectionHeader: React.FC<{
  title: string;
  count: number;
  colors: ThemeColors;
}> = React.memo(({ title, count, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={sectionStyles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View
          style={[
            sectionStyles.badge,
            { backgroundColor: DS.colors.green },
            Platform.select({
              ios: createGlow(DS.colors.green, 0.3),
              android: { elevation: 4 },
            }),
          ]}
        >
          <Ionicons name="stats-chart" size={16} color={DS.colors.white} />
          <Text style={[typography.label, sectionStyles.title]}>{title}</Text>
          <View style={sectionStyles.countBadge}>
            <Text style={[typography.badge, { color: DS.colors.green }]}>{count}</Text>
          </View>
        </View>
      </Animated.View>
      <View style={[sectionStyles.line, { backgroundColor: DS.colors.cardBorder }]} />
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  title: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  line: {
    flex: 1,
    height: 1,
  },
});

/**
 * État de chargement avec animation
 */
const LoadingState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [rotateAnim, pulseAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[loadingStyles.container, { backgroundColor: DS.colors.background }]}>
      <Animated.View
        style={[
          loadingStyles.iconWrapper,
          {
            backgroundColor: DS.colors.greenBgSubtle,
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons name="football" size={40} color={DS.colors.green} />
      </Animated.View>
      <Text style={[typography.h4, { color: DS.colors.white, marginTop: spacing.lg }]}>
        Chargement du match
      </Text>
      <Text style={[typography.body, { color: DS.colors.textSecondary, marginTop: spacing.xs }]}>
        Récupération des marchés...
      </Text>
      <View style={loadingStyles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              loadingStyles.dot,
              { backgroundColor: DS.colors.green, opacity: pulseAnim },
            ]}
          />
        ))}
      </View>
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
});

/**
 * État d'erreur avec animation
 */
const ErrorState: React.FC<{
  message: string;
  onRetry: () => void;
  colors: ThemeColors;
}> = React.memo(({ message, onRetry, colors }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(btnScale, {
      toValue: 0.95,
      ...springConfigs.responsive,
      useNativeDriver: true,
    }).start();
  }, [btnScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(btnScale, {
      toValue: 1,
      ...springConfigs.bouncy,
      useNativeDriver: true,
    }).start();
  }, [btnScale]);

  return (
    <View style={[errorStyles.container, { backgroundColor: DS.colors.background }]}>
      <Animated.View
        style={[
          errorStyles.iconWrapper,
          {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        <Ionicons name="cloud-offline" size={44} color="#EF4444" />
      </Animated.View>

      <Text style={[typography.h3, { color: DS.colors.white, marginTop: spacing.lg }]}>
        Oups !
      </Text>
      <Text
        style={[
          typography.body,
          { color: DS.colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
        ]}
      >
        {message}
      </Text>

      <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: spacing.xl }}>
        <TouchableOpacity
          onPress={onRetry}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View
            style={[
              errorStyles.retryBtn,
              { backgroundColor: DS.colors.green },
              Platform.select({
                ios: createGlow(DS.colors.green, 0.4),
                android: { elevation: 6 },
              }),
            ]}
          >
            <Ionicons name="refresh" size={20} color={DS.colors.white} />
            <Text style={[typography.button, { color: DS.colors.white }]}>Réessayer</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

ErrorState.displayName = 'ErrorState';

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});

/**
 * État vide pour les marchés
 */
const EmptyMarkets: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={[emptyStyles.container, { backgroundColor: DS.colors.cardBg, borderColor: DS.colors.cardBorder }]}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <View style={[emptyStyles.iconWrapper, { backgroundColor: DS.colors.buttonBg }]}>
          <Ionicons name="bar-chart-outline" size={36} color={DS.colors.textSecondary} />
        </View>
      </Animated.View>
      <Text style={[typography.h4, { color: DS.colors.white, marginTop: spacing.md }]}>
        Aucun marché disponible
      </Text>
      <Text style={[typography.body, { color: DS.colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
        Les marchés seront disponibles prochainement
      </Text>
    </View>
  );
});

EmptyMarkets.displayName = 'EmptyMarkets';

const emptyStyles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MatchDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  const route = useRoute();
  const { matchId } = route.params as { matchId: string };

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);
  const isSelected = (selectionId: string) =>
    selections.some((s) => s.selectionId === selectionId);

  const fetchMatch = useCallback(async () => {
    try {
      setError(null);
      const { data } = await matchApi.getById(matchId);
      setMatch(data);
    } catch {
      setError('Impossible de charger le match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatch();
  }, [fetchMatch]);

  const handleSelect = (market: Market, sel: MarketSelection) => {
    if (!match) return;
    const selection: TicketSelection = {
      matchId: match.id,
      matchLabel: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      leagueName: match.leagueName,
      sportCode: match.sportCode,
      startTime: match.startTime,
      selectionId: sel.id,
      marketType: market.type,
      marketLabel: market.label,
      selectionLabel: sel.label,
      odds: sel.odds,
    };
    toggleSelection(selection);
  };

  const started =
    match != null &&
    (match.status !== 'Scheduled' || new Date(match.startTime) <= new Date());

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingState colors={colors} />;
  }

  if (error || !match) {
    return (
      <ErrorState
        message={error ?? 'Match introuvable'}
        onRetry={fetchMatch}
        colors={colors}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DS.colors.green}
          colors={[DS.colors.green]}
        />
      }
    >
      {/* Match Header */}
      <MatchHeader match={match} started={started} colors={colors} />

      {/* Markets Section */}
      <SectionHeader
        title="Marchés"
        count={match.markets.length}
        colors={colors}
      />

      {match.markets.length === 0 ? (
        <EmptyMarkets colors={colors} />
      ) : (
        match.markets.map((market) => (
          <MarketBlock
            key={market.id}
            market={market}
            match={match}
            isSelected={isSelected}
            onSelect={handleSelect}
            started={started}
            colors={colors}
          />
        ))
      )}
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: DS.colors.background,
        },
        scroll: {
          padding: spacing.base,
          paddingBottom: 140,
        },
      }),
    []
  );

export default MatchDetailsScreen;

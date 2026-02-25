import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  marketplaceApi,
  type MarketplaceFilters,
} from '../api/marketplace.api';
import { useAuthStore } from '../store/auth.store';
import { useFavoriteStore } from '../store/favorite.store';
import { useFollowStore } from '../store/follow.store';
import FilterModal from '../components/marketplace/FilterPanel';
import { ErrorBanner } from '../components/common';
import { MarketRefreshControl } from '../components/common/PremiumRefreshControl';
import { parseError, type AppError } from '../utils/errors';
import type {
  RootStackParamList,
  TicketDto,
  TicketFilterMetaDto,
} from '../types';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  palette,
  effectGlass,
  effectShadows,
  createGlow,
  springConfigs,
} from '../theme';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateRange(firstMatchTime: string, lastMatchTime: string, selectionCount: number): string {
  const first = new Date(firstMatchTime);
  const last = new Date(lastMatchTime);

  const formatShort = (d: Date) => d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Single selection or same time - show only start
  if (selectionCount <= 1 || first.getTime() === last.getTime()) {
    return formatShort(first);
  }

  // Multiple selections with different times - show range
  return `${formatShort(first)} → ${formatShort(last)}`;
}

function countActiveFilters(filters: MarketplaceFilters): number {
  let count = 0;
  if (filters.sports?.length) count++;
  if (filters.ticketType) count++;
  if (filters.minOdds !== undefined || filters.maxOdds !== undefined) count++;
  if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined)
    count++;
  if (
    filters.minSelections !== undefined ||
    filters.maxSelections !== undefined
  )
    count++;
  return count;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Chip de filtre avec animation
 */
const FilterChip: React.FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  activeColor: string;
  onPress: () => void;
  badge?: number;
  colors: ThemeColors;
}> = React.memo(({ label, icon, isActive, activeColor, onPress, badge, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          filterChipStyles.container,
          {
            backgroundColor: isActive ? activeColor : colors.surface,
            borderColor: isActive ? activeColor : colors.border,
          },
          isActive && Platform.select({
            ios: createGlow(activeColor, 0.3),
            android: { elevation: 4 },
          }),
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View
          style={[
            filterChipStyles.iconWrapper,
            {
              backgroundColor: isActive
                ? `${colors.textOnPrimary}30`
                : colors.surfaceElevated,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={14}
            color={isActive ? colors.textOnPrimary : activeColor}
          />
        </View>
        <Text
          style={[
            typography.label,
            { color: isActive ? colors.textOnPrimary : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={[filterChipStyles.badge, { backgroundColor: colors.textOnPrimary }]}>
            <Text style={[typography.badge, { color: activeColor, fontSize: 10 }]}>
              {badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

FilterChip.displayName = 'FilterChip';

const filterChipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});

/**
 * Barre de filtres avec glassmorphism
 */
const FilterBar: React.FC<{
  filters: MarketplaceFilters;
  onFilterChange: (filters: MarketplaceFilters) => void;
  onOpenFilterModal: () => void;
  activeFilterCount: number;
  colors: ThemeColors;
}> = React.memo(({ filters, onFilterChange, onOpenFilterModal, activeFilterCount, colors }) => {
  const filterBarContent = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterBarStyles.content}
    >
      <FilterChip
        label="Suivis"
        icon="people"
        isActive={!!filters.followedOnly}
        activeColor={colors.accent}
        onPress={() =>
          onFilterChange({
            ...filters,
            followedOnly: !filters.followedOnly || undefined,
          })
        }
        colors={colors}
      />
      <FilterChip
        label="Filtres"
        icon="options"
        isActive={activeFilterCount > 0}
        activeColor={colors.primary}
        onPress={onOpenFilterModal}
        badge={activeFilterCount}
        colors={colors}
      />
    </ScrollView>
  );

  return Platform.OS === 'ios' ? (
    <BlurView
      intensity={effectGlass.light.intensity}
      tint="light"
      style={[
        filterBarStyles.container,
        {
          backgroundColor: `${colors.background}90`,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {filterBarContent}
    </BlurView>
  ) : (
    <View
      style={[
        filterBarStyles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {filterBarContent}
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const filterBarStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
  },
});

/**
 * Carte de ticket marketplace avec design premium
 */
const MarketplaceTicketCard = React.memo<{
  ticket: TicketDto;
  isFavorited: boolean;
  isFollowingCreator: boolean;
  isOwnTicket: boolean;
  onToggleFavorite: (ticketId: string) => void;
  onBuy: (ticket: TicketDto) => void;
  onTipsterPress: (creatorId: string, username: string) => void;
  onCardPress: (ticketId: string) => void;
  onFollowCreator: (creatorId: string) => void;
  colors: ThemeColors;
}>(function MarketplaceTicketCard({
  ticket,
  isFavorited,
  isFollowingCreator,
  isOwnTicket,
  onToggleFavorite,
  onBuy,
  onTipsterPress,
  onCardPress,
  onFollowCreator,
  colors,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const followAnim = useRef(new Animated.Value(1)).current;

  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const matchWord = count === 1 ? 'match' : 'matchs';
  const autoTitle = `${ticket.creatorUsername} – ${count} ${matchWord}`;
  const hasAccess = ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;
  const selWord = count === 1 ? 'sélection' : 'sélections';
  const subtitle = isPrivateLocked
    ? `Payant – ${count} ${selWord}`
    : `${count} ${selWord}`;

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

  const handleFavoritePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, ...springConfigs.bouncy, useNativeDriver: true }),
    ]).start();
    onToggleFavorite(ticket.id);
  }, [heartAnim, onToggleFavorite, ticket.id]);

  const handleFollowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(followAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(followAnim, { toValue: 1, ...springConfigs.bouncy, useNativeDriver: true }),
    ]).start();
    onFollowCreator(ticket.creatorId);
  }, [followAnim, onFollowCreator, ticket.creatorId]);

  const cardContent = (
    <>
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={cardStyles.headerLeft}>
          <TouchableOpacity
            onPress={() => onTipsterPress(ticket.creatorId, ticket.creatorUsername)}
          >
            <LinearGradient
              colors={[`${colors.primary}30`, `${colors.primary}10`]}
              style={[cardStyles.creatorAvatar, { borderColor: colors.primary }]}
            >
              <Ionicons name="person" size={16} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onTipsterPress(ticket.creatorId, ticket.creatorUsername)}
          >
            <Text style={[typography.label, { color: colors.primary }]}>
              @{ticket.creatorUsername}
            </Text>
          </TouchableOpacity>
          {!isOwnTicket && (
            <Animated.View style={{ transform: [{ scale: followAnim }] }}>
              <TouchableOpacity
                style={[
                  cardStyles.followChip,
                  {
                    backgroundColor: isFollowingCreator ? colors.primary : colors.primaryBg,
                    borderColor: isFollowingCreator ? colors.primary : `${colors.primary}30`,
                  },
                ]}
                onPress={handleFollowPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isFollowingCreator ? 'checkmark' : 'add'}
                  size={12}
                  color={isFollowingCreator ? colors.textOnPrimary : colors.primary}
                />
                <Text
                  style={[
                    typography.badge,
                    { color: isFollowingCreator ? colors.textOnPrimary : colors.primary },
                  ]}
                >
                  {isFollowingCreator ? 'Suivi' : 'Suivre'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
          <TouchableOpacity
            style={[
              cardStyles.favoriteBtn,
              {
                backgroundColor: isFavorited ? colors.dangerBg : colors.surfaceElevated,
              },
            ]}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? colors.danger : colors.textTertiary}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Title */}
      <Text style={[typography.body, cardStyles.title, { color: colors.text }]} numberOfLines={2}>
        {autoTitle}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        {subtitle}
      </Text>

      {/* Date Range */}
      <View style={[cardStyles.dateRange, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name="calendar-outline" size={14} color={colors.primary} />
        <Text style={[typography.caption, { color: colors.text, fontWeight: '500' }]}>
          {formatDateRange(ticket.firstMatchTime, ticket.lastMatchTime, count)}
        </Text>
      </View>

      {/* Meta Stats */}
      <View style={[cardStyles.metaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={cardStyles.metaItem}>
          <Text style={[typography.caption, cardStyles.metaLabel, { color: colors.textTertiary }]}>
            COTE MOY.
          </Text>
          <Text style={[typography.odds, { color: colors.accent }]}>
            {ticket.avgOdds.toFixed(2)}
          </Text>
        </View>
        <View style={[cardStyles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.metaItem}>
          <Text style={[typography.caption, cardStyles.metaLabel, { color: colors.textTertiary }]}>
            CONFIANCE
          </Text>
          <View style={cardStyles.confidenceRow}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              {ticket.confidenceIndex}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>/10</Text>
          </View>
        </View>
        <View style={[cardStyles.metaDivider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.metaItem}>
          <Text style={[typography.caption, cardStyles.metaLabel, { color: colors.textTertiary }]}>
            SÉLECTIONS
          </Text>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
            {count}
          </Text>
        </View>
      </View>

      {/* Sports Badges */}
      <View style={cardStyles.sportRow}>
        {ticket.sports.map((s) => (
          <View
            key={s}
            style={[cardStyles.sportBadge, { backgroundColor: colors.primaryBg }]}
          >
            <Ionicons
              name={SPORT_ICONS[s] || 'trophy'}
              size={12}
              color={colors.primary}
            />
            <Text style={[typography.badge, { color: colors.primary }]}>
              {SPORT_LABELS[s] ?? s}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={[cardStyles.footer, { borderTopColor: colors.border }]}>
        <View style={cardStyles.footerLeft}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatDate(ticket.createdAt)}
          </Text>
        </View>
        {renderPriceBadge(ticket, isPrivateLocked, hasAccess, onBuy, colors)}
      </View>
    </>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        testID={`ticket-card-${ticket.id}`}
        activeOpacity={0.95}
        onPress={() => onCardPress(ticket.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={effectGlass.light.intensity}
            tint="light"
            style={[
              cardStyles.container,
              {
                backgroundColor: `${colors.surface}90`,
                borderColor: colors.border,
              },
            ]}
          >
            {cardContent}
          </BlurView>
        ) : (
          <View
            style={[
              cardStyles.container,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                elevation: 3,
              },
            ]}
          >
            {cardContent}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * Render le badge de prix selon l'état du ticket
 */
function renderPriceBadge(
  ticket: TicketDto,
  isPrivateLocked: boolean,
  hasAccess: boolean,
  onBuy: (ticket: TicketDto) => void,
  colors: ThemeColors
) {
  if (isPrivateLocked) {
    return (
      <View style={[cardStyles.priceBadge, { backgroundColor: colors.accentBg }]}>
        <Ionicons name="lock-closed" size={12} color={colors.warning} />
        <Text style={[typography.badge, { color: colors.accent }]}>
          {ticket.priceEur.toFixed(2)} €
        </Text>
      </View>
    );
  }

  if (!ticket.isPublic && ticket.isSubscribedToCreator) {
    return (
      <LinearGradient
        colors={[colors.accent, `${colors.accent}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={cardStyles.subscribedBadge}
      >
        <Ionicons name="star" size={12} color="#FFFFFF" />
        <Text style={[typography.badge, { color: '#FFFFFF' }]}>Abonné</Text>
      </LinearGradient>
    );
  }

  if (!ticket.isPublic && ticket.isPurchasedByCurrentUser) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryLight || colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={cardStyles.purchasedBadge}
      >
        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
        <Text style={[typography.badge, { color: '#FFFFFF' }]}>Acheté</Text>
      </LinearGradient>
    );
  }

  if (ticket.priceEur > 0) {
    return (
      <TouchableOpacity onPress={() => onBuy(ticket)} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight || colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            cardStyles.buyBtn,
            Platform.select({
              ios: createGlow(colors.primary, 0.3),
              android: { elevation: 4 },
            }),
          ]}
        >
          <Ionicons name="cart" size={14} color="#FFFFFF" />
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            {ticket.priceEur.toFixed(2)} €
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyles.freeBadge, { backgroundColor: colors.successBg }]}>
      <Ionicons name="gift" size={12} color={colors.success} />
      <Text style={[typography.badge, { color: colors.success }]}>Gratuit</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    marginHorizontal: spacing.sm,
  },
  metaLabel: {
    fontSize: 10,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    <View style={[loadingStyles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          loadingStyles.iconWrapper,
          {
            backgroundColor: colors.primaryBg,
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons name="storefront" size={40} color={colors.primary} />
      </Animated.View>
      <Text style={[typography.h4, { color: colors.text, marginTop: spacing.lg }]}>
        Chargement du marketplace
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        Récupération des tickets...
      </Text>
      <View style={loadingStyles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              loadingStyles.dot,
              { backgroundColor: colors.primary, opacity: pulseAnim },
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
 * État vide avec animation
 */
const EmptyState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={emptyStyles.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <LinearGradient
          colors={[colors.surfaceElevated, colors.background]}
          style={[emptyStyles.iconWrapper, { borderColor: colors.border }]}
        >
          <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
        </LinearGradient>
      </Animated.View>
      <Text style={[typography.h4, { color: colors.text, marginTop: spacing.lg }]}>
        Aucun ticket disponible
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.sm,
            maxWidth: 280,
            lineHeight: 22,
          },
        ]}
      >
        Modifiez les filtres pour voir plus de résultats
      </Text>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MarketplaceScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const favoritedIds = useFavoriteStore((s) => s.favoritedIds);
  const hydrateFavorites = useFavoriteStore((s) => s.hydrate);
  const toggleFavorite = useFavoriteStore((s) => s.toggle);

  // Global follow store
  const hydrateFollows = useFollowStore((s) => s.hydrate);
  const toggleFollow = useFollowStore((s) => s.toggle);
  const followedIds = useFollowStore((s) => s.followedIds);

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMeta, setFilterMeta] = useState<TicketFilterMetaDto | null>(
    null
  );
  const [error, setError] = useState<AppError | null>(null);

  // Fetch filter metadata, user favorites, and followed creators on mount
  useEffect(() => {
    marketplaceApi
      .getFilterMeta()
      .then(({ data }) => setFilterMeta(data))
      .catch(() => {});
    hydrateFavorites();
    if (currentUserId) {
      hydrateFollows(currentUserId);
    }
  }, [currentUserId, hydrateFavorites, hydrateFollows]);

  const fetchTickets = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setError(null);
        const { data } = await marketplaceApi.getPublicTickets({
          ...filters,
          page: pageNum,
          pageSize: 15,
        });
        const newTickets = data.items;
        setTickets((prev) => (append ? [...prev, ...newTickets] : newTickets));
        setHasMore(data.hasNextPage);
        setPage(pageNum);
      } catch (err) {
        const appError = parseError(err);
        setError(appError);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setLoading(true);
    setTickets([]);
    fetchTickets(1);
  }, [fetchTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets(1);
  }, [fetchTickets]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchTickets(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchTickets]);

  const handleToggleFavorite = useCallback(
    (ticketId: string) => {
      toggleFavorite(ticketId);
    },
    [toggleFavorite]
  );

  const handleBuy = useCallback(
    (ticket: TicketDto) => {
      // Navigate to ticket detail for Stripe payment
      navigation.navigate('TicketDetail', { ticketId: ticket.id });
    },
    [navigation]
  );

  const handleTipsterPress = useCallback(
    (creatorId: string, username: string) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: creatorId,
        tipsterUsername: username,
      });
    },
    [navigation]
  );

  const handleCardPress = useCallback(
    (ticketId: string) => {
      navigation.navigate('TicketDetail', { ticketId });
    },
    [navigation]
  );

  const handleFollowCreator = useCallback(
    (creatorId: string) => {
      toggleFollow(creatorId);
    },
    [toggleFollow]
  );

  const handleApplyFilters = useCallback((newFilters: MarketplaceFilters) => {
    setFilters((prev) => ({
      ...prev,
      sports: newFilters.sports,
      minOdds: newFilters.minOdds,
      maxOdds: newFilters.maxOdds,
      minConfidence: newFilters.minConfidence,
      maxConfidence: newFilters.maxConfidence,
      minSelections: newFilters.minSelections,
      maxSelections: newFilters.maxSelections,
      ticketType: newFilters.ticketType,
    }));
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTickets(1);
  }, [fetchTickets]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  // Stable callbacks for FilterBar and FilterModal (avoid inline arrow functions)
  const handleOpenFilterModal = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingState colors={colors} />;
  }

  return (
    <View style={styles.container}>
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onOpenFilterModal={handleOpenFilterModal}
        activeFilterCount={countActiveFilters(filters)}
        colors={colors}
      />
      <FilterModal
        visible={showFilterModal}
        onClose={handleCloseFilterModal}
        filters={filters}
        onApply={handleApplyFilters}
        meta={filterMeta}
      />
      {error && (
        <ErrorBanner
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}
      <FlatList
        testID="marketplace-list"
        data={tickets}
        keyExtractor={(item) => item.id}
        extraData={[favoritedIds, followedIds]}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <MarketRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        // Performance optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <MarketplaceTicketCard
            ticket={item}
            isFavorited={favoritedIds.has(item.id)}
            isFollowingCreator={followedIds.has(item.creatorId)}
            isOwnTicket={item.creatorId === currentUserId}
            onToggleFavorite={handleToggleFavorite}
            onBuy={handleBuy}
            onTipsterPress={handleTipsterPress}
            onCardPress={handleCardPress}
            onFollowCreator={handleFollowCreator}
            colors={colors}
          />
        )}
        ListEmptyComponent={<EmptyState colors={colors} />}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                Chargement...
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        list: {
          padding: spacing.base,
          paddingBottom: 140,
        },
        loadingMore: {
          padding: spacing.xl,
          alignItems: 'center',
        },
      }),
    [colors]
  );

export default MarketplaceScreen;

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TicketDto, TipsterStatsDto } from '../../types';
import { MatchPreview } from './MatchPreview';
import { DS } from '../../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basket',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
  HOCKEY: 'Hockey',
  BASEBALL: 'Baseball',
  RUGBY: 'Rugby',
};

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennisball',
  ESPORT: 'game-controller',
  HOCKEY: 'snow',
  BASEBALL: 'baseball',
  RUGBY: 'american-football',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDateRange(firstMatchTime: string, lastMatchTime: string, selectionCount: number): string {
  const first = new Date(firstMatchTime);
  const last = new Date(lastMatchTime);

  const formatShort = (d: Date) => d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (selectionCount <= 1 || first.getTime() === last.getTime()) {
    return formatShort(first);
  }

  return `${formatShort(first)} → ${formatShort(last)}`;
}

function countSportsByType(sports: string[], selections: TicketDto['selections']): Map<string, number> {
  const counts = new Map<string, number>();

  sports.forEach(sport => {
    const sportUpper = sport.toUpperCase();
    counts.set(sportUpper, (counts.get(sportUpper) || 0) + 1);
  });

  if (selections && selections.length > 0) {
    counts.clear();
    selections.forEach(() => {
      const sport = 'FOOTBALL';
      counts.set(sport, (counts.get(sport) || 0) + 1);
    });

    if (sports.length > 0) {
      counts.clear();
      const selectionsPerSport = Math.ceil(selections.length / sports.length);
      sports.forEach((sport, index) => {
        const remaining = selections.length - (index * selectionsPerSport);
        const count = Math.min(selectionsPerSport, Math.max(0, remaining));
        if (count > 0) {
          counts.set(sport.toUpperCase(), count);
        }
      });
    }
  }

  return counts;
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface TicketCardProps {
  ticket: TicketDto;
  tipsterStats?: TipsterStatsDto | null;
  tipsterRanking?: number | null;
  isFavorited: boolean;
  isFollowingCreator: boolean;
  isOwnTicket: boolean;
  onToggleFavorite: (ticketId: string) => void;
  onBuy: (ticket: TicketDto) => void;
  onShare: (ticket: TicketDto) => void;
  onTipsterPress: (creatorId: string, username: string) => void;
  onFollowCreator: (creatorId: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const TicketCard: React.FC<TicketCardProps> = React.memo(({
  ticket,
  tipsterStats,
  tipsterRanking,
  isFavorited,
  isFollowingCreator,
  isOwnTicket,
  onToggleFavorite,
  onBuy,
  onShare,
  onTipsterPress,
  onFollowCreator,
}) => {
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const followAnim = useRef(new Animated.Value(1)).current;
  const accordionAnim = useRef(new Animated.Value(0)).current;

  // State
  const [isExpanded, setIsExpanded] = useState(false);

  // Computed values
  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const hasAccess = ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;
  const isFree = ticket.isPublic || ticket.priceEur === 0;
  const selections = ticket.selections || [];
  const visibleSelections = selections.slice(0, 2);
  const hiddenSelections = selections.slice(2);
  const hasMoreSelections = hiddenSelections.length > 0;

  // Sport counts
  const sportCounts = countSportsByType(ticket.sports, selections);

  // Handlers
  const handleFavoritePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onToggleFavorite(ticket.id);
  }, [heartAnim, onToggleFavorite, ticket.id]);

  const handleFollowPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(followAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(followAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onFollowCreator(ticket.creatorId);
  }, [followAnim, onFollowCreator, ticket.creatorId]);

  const handleSharePress = useCallback(async () => {
    onShare(ticket);
  }, [onShare, ticket]);

  const handleBuyPress = useCallback(() => {
    onBuy(ticket);
  }, [onBuy, ticket]);

  const handleViewPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    Animated.timing(accordionAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, accordionAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // Accordion rotation
  const rotateChevron = accordionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER - Tipster Info */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => onTipsterPress(ticket.creatorId, ticket.creatorUsername)}
              >
                <View style={styles.creatorAvatar}>
                  <Ionicons name="person" size={18} color={DS.colors.green} />
                </View>
              </TouchableOpacity>

              <View style={styles.tipsterInfo}>
                <View style={styles.tipsterNameRow}>
                  <TouchableOpacity
                    onPress={() => onTipsterPress(ticket.creatorId, ticket.creatorUsername)}
                  >
                    <Text style={styles.tipsterName}>
                      {ticket.creatorUsername.toUpperCase()}
                    </Text>
                  </TouchableOpacity>

                  {tipsterStats && (
                    <View style={styles.vipBadge}>
                      <Ionicons name="star" size={10} color={DS.colors.greenLight} />
                      <Text style={styles.vipText}>VIP</Text>
                    </View>
                  )}
                </View>

                {/* Tipster Stats Row */}
                <View style={styles.tipsterStatsRow}>
                  {tipsterRanking && (
                    <View style={styles.tipsterStat}>
                      <Ionicons name="trophy" size={12} color="#FFD700" />
                      <Text style={styles.tipsterStatText}>
                        #{tipsterRanking}
                      </Text>
                    </View>
                  )}
                  <View style={styles.tipsterStat}>
                    <Ionicons name="stats-chart" size={12} color={DS.colors.greenLight} />
                    <Text style={styles.tipsterStatText}>
                      {tipsterStats?.averageOdds?.toFixed(2) || ticket.avgOdds.toFixed(2)}
                    </Text>
                  </View>
                  {tipsterStats && (
                    <View style={styles.tipsterStat}>
                      <Ionicons name="checkmark-circle" size={12} color={DS.colors.green} />
                      <Text style={styles.tipsterStatText}>
                        {(tipsterStats.winRate * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Ticket ID */}
              <Text style={styles.ticketId}>
                #{ticket.id.slice(-4).toUpperCase()}
              </Text>

              {/* Follow Button */}
              {!isOwnTicket && (
                <Animated.View style={{ transform: [{ scale: followAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.followChip,
                      isFollowingCreator && styles.followChipActive,
                    ]}
                    onPress={handleFollowPress}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isFollowingCreator ? 'checkmark' : 'add'}
                      size={12}
                      color={isFollowingCreator ? DS.colors.white : DS.colors.green}
                    />
                    <Text
                      style={[
                        styles.followText,
                        isFollowingCreator && styles.followTextActive,
                      ]}
                    >
                      {isFollowingCreator ? 'Suivi' : 'Suivre'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SPORTS ROW */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.sportsRow}>
            {Array.from(sportCounts.entries()).map(([sport, sportCount]) => (
              <View key={sport} style={styles.sportBadge}>
                <Ionicons
                  name={SPORT_ICONS[sport] || 'trophy'}
                  size={14}
                  color={DS.colors.green}
                />
                <Text style={styles.sportText}>
                  {SPORT_LABELS[sport] ?? sport}
                </Text>
                <View style={styles.sportCount}>
                  <Text style={styles.sportCountText}>{sportCount}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DATE RANGE */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={14} color={DS.colors.green} />
            <Text style={styles.dateText}>
              {formatDateRange(ticket.firstMatchTime, ticket.lastMatchTime, count)}
            </Text>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* COTE GLOBALE */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.oddsRow}>
            <Text style={styles.oddsLabel}>COTE</Text>
            <Text style={styles.oddsValue}>
              {ticket.avgOdds.toFixed(2)}
            </Text>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MATCHES PREVIEW (Free tickets only or purchased) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(isFree || hasAccess) && selections.length > 0 && (
            <View style={styles.matchesContainer}>
              {/* Visible selections (first 2) */}
              {visibleSelections.map((sel, index) => (
                <MatchPreview
                  key={sel.id}
                  selection={sel}
                  matchIndex={index}
                  sportCode={ticket.sports[0]}
                />
              ))}

              {/* Accordion for remaining selections */}
              {hasMoreSelections && (
                <>
                  {isExpanded && hiddenSelections.map((sel, index) => (
                    <MatchPreview
                      key={sel.id}
                      selection={sel}
                      matchIndex={index + 2}
                      sportCode={ticket.sports[0]}
                    />
                  ))}

                  <TouchableOpacity
                    style={styles.accordionButton}
                    onPress={handleViewPress}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.accordionText}>
                      {isExpanded ? 'Masquer' : `+${hiddenSelections.length} autres matchs`}
                    </Text>
                    <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
                      <Ionicons name="chevron-down" size={18} color={DS.colors.textSecondary} />
                    </Animated.View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FOOTER - Actions */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.footer}>
            {/* Left actions: Like + Share */}
            <View style={styles.footerLeft}>
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFavorited && styles.actionButtonFavorited,
                  ]}
                  onPress={handleFavoritePress}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#FF4757' : DS.colors.textSecondary}
                  />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSharePress}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={20} color={DS.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Right: Price + Buy/View button */}
            <View style={styles.footerRight}>
              {renderActionButton(
                ticket,
                isFree,
                isPrivateLocked,
                hasAccess,
                hasMoreSelections,
                isExpanded,
                handleBuyPress,
                handleViewPress
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

TicketCard.displayName = 'TicketCard';

// ═══════════════════════════════════════════════════════════════
// RENDER HELPERS
// ═══════════════════════════════════════════════════════════════

function renderActionButton(
  ticket: TicketDto,
  isFree: boolean,
  isPrivateLocked: boolean,
  hasAccess: boolean,
  hasMoreSelections: boolean,
  isExpanded: boolean,
  onBuy: () => void,
  onView: () => void
) {
  // Already purchased
  if (!ticket.isPublic && ticket.isPurchasedByCurrentUser) {
    return (
      <View style={styles.purchasedBadge}>
        <Ionicons name="checkmark-circle" size={16} color={DS.colors.white} />
        <Text style={styles.purchasedText}>Acheté</Text>
      </View>
    );
  }

  // Subscribed
  if (!ticket.isPublic && ticket.isSubscribedToCreator) {
    return (
      <View style={styles.subscribedBadge}>
        <Ionicons name="star" size={14} color={DS.colors.white} />
        <Text style={styles.subscribedText}>Abonné</Text>
      </View>
    );
  }

  // Paid ticket - show price + buy button
  if (isPrivateLocked) {
    return (
      <View style={styles.buyContainer}>
        <Text style={styles.priceLabel}>
          Coût du ticket :
        </Text>
        <Text style={styles.priceValue}>
          {ticket.priceEur.toFixed(2)} €
        </Text>
        <TouchableOpacity onPress={onBuy} activeOpacity={0.8} style={styles.buyButton}>
          <Text style={styles.buyButtonText}>ACHETER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Free ticket - show GRATUIT badge + VOIR button if has more selections
  return (
    <View style={styles.freeContainer}>
      <View style={styles.freeBadge}>
        <Ionicons name="gift" size={14} color={DS.colors.green} />
        <Text style={styles.freeText}>GRATUIT</Text>
      </View>

      {hasMoreSelections && (
        <TouchableOpacity
          onPress={onView}
          activeOpacity={0.8}
          style={styles.viewButton}
        >
          <Text style={styles.viewButtonText}>
            {isExpanded ? 'MASQUER' : 'VOIR'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DS.colors.green,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  tipsterInfo: {
    flex: 1,
    gap: 4,
  },
  tipsterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsterName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: DS.colors.white,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '700',
    color: DS.colors.greenLight,
  },
  tipsterStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tipsterStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipsterStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  followChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: DS.colors.green,
    backgroundColor: 'transparent',
  },
  followChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  followText: {
    fontSize: 11,
    fontWeight: '600',
    color: DS.colors.green,
  },
  followTextActive: {
    color: DS.colors.white,
  },

  // Sports
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.green,
  },
  sportCount: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.green,
  },
  sportCountText: {
    color: DS.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.white,
  },

  // Odds
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  oddsLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: DS.colors.textSecondary,
  },
  oddsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: DS.colors.greenLight,
  },

  // Matches
  matchesContainer: {
    marginBottom: 12,
  },
  accordionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    backgroundColor: DS.colors.buttonBg,
  },
  accordionText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DS.colors.cardBorder,
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.buttonBg,
  },
  actionButtonFavorited: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },

  // Buy container
  buyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: DS.colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: DS.colors.greenLight,
  },
  buyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DS.colors.greenLight,
  },
  buyButtonText: {
    color: '#0A0F0C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Free container
  freeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DS.colors.greenBgSubtle,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.green,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DS.colors.green,
  },
  viewButtonText: {
    color: DS.colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Badges
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DS.colors.green,
  },
  purchasedText: {
    color: DS.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DS.colors.greenLight,
  },
  subscribedText: {
    color: '#0A0F0C',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default TicketCard;

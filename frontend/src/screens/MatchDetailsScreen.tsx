import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import { matchApi } from '../api/match.api';
import { useTicketBuilderStore } from '../store/ticketBuilder.store';
import OddsButton from '../components/match/OddsButton';
import type {
  MatchDetail,
  Market,
  MarketSelection,
  TicketSelection,
} from '../types';
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getTeamInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getSportIcon(sportCode: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    FOOTBALL: 'football',
    BASKETBALL: 'basketball',
    TENNIS: 'tennisball',
    ESPORT: 'game-controller',
    BASEBALL: 'baseball',
    HOCKEY: 'snow',
    RUGBY: 'american-football',
  };
  return icons[sportCode.toUpperCase()] ?? 'trophy';
}

function formatMarketLabel(market: Market): string {
  const { type, label, line } = market;
  if (line == null) return label;

  const marketType = type.toLowerCase();
  if (marketType.includes('handicap') || marketType === 'spreads') {
    const sign = line >= 0 ? '+' : '';
    return `${label} (${sign}${line})`;
  }
  if (marketType.includes('overunder') || marketType.includes('total')) {
    return `${label} (${line})`;
  }
  return `${label} (${line})`;
}

function formatSelectionLabel(sel: MarketSelection, market: Market): string {
  const { label, code, point } = sel;
  const { type } = market;
  const marketType = type.toLowerCase();

  if (marketType.includes('overunder') || marketType.includes('total')) {
    if (point != null) {
      if (code === 'OVER') return `Over ${point}`;
      if (code === 'UNDER') return `Under ${point}`;
    }
  }

  if (marketType.includes('handicap') || marketType === 'spreads') {
    if (point != null) {
      const sign = point >= 0 ? '+' : '';
      return `${label} (${sign}${point})`;
    }
  }

  return label;
}

// Player market types detection
type PlayerMarketType = 'scorer' | 'assist' | 'decisive' | null;

function getPlayerMarketType(market: Market): PlayerMarketType {
  const type = market.type.toLowerCase();
  const label = market.label.toLowerCase();

  if (type.includes('scorer') || type.includes('buteur') || label.includes('buteur') || label.includes('marquer')) {
    return 'scorer';
  }
  if (type.includes('assist') || type.includes('passeur') || label.includes('passeur') || label.includes('passe')) {
    return 'assist';
  }
  if (type.includes('decisive') || type.includes('décisif') || label.includes('décisif')) {
    return 'decisive';
  }
  return null;
}

// Combined player data type for column layout
interface CombinedPlayerOdds {
  playerName: string;
  isStarter: boolean;
  scorer: { selection: MarketSelection; market: Market } | null;
  assist: { selection: MarketSelection; market: Market } | null;
  decisive: { selection: MarketSelection; market: Market } | null;
}

// Combine player markets into a single list with all 3 odds
function combinePlayerMarkets(
  playerMarkets: { type: PlayerMarketType; market: Market }[]
): CombinedPlayerOdds[] {
  const playersMap = new Map<string, CombinedPlayerOdds>();

  for (const { type, market } of playerMarkets) {
    if (!type) continue;

    for (const selection of market.selections) {
      const name = selection.label;

      if (!playersMap.has(name)) {
        // Determine starter status based on ID hash (deterministic)
        const hash = selection.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        playersMap.set(name, {
          playerName: name,
          isStarter: name.toLowerCase().includes('titulaire') || hash % 3 === 0,
          scorer: null,
          assist: null,
          decisive: null,
        });
      }

      const player = playersMap.get(name)!;
      player[type] = { selection, market };
    }
  }

  // Sort by number of markets available (more markets = higher priority) and then by lowest scorer odds
  return Array.from(playersMap.values()).sort((a, b) => {
    const aCount = (a.scorer ? 1 : 0) + (a.assist ? 1 : 0) + (a.decisive ? 1 : 0);
    const bCount = (b.scorer ? 1 : 0) + (b.assist ? 1 : 0) + (b.decisive ? 1 : 0);
    if (bCount !== aCount) return bCount - aCount;

    // Sort by scorer odds if both have scorer
    const aOdds = a.scorer?.selection.odds ?? 999;
    const bOdds = b.scorer?.selection.odds ?? 999;
    return aOdds - bOdds;
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MatchDetailsScreen: React.FC = () => {
  const route = useRoute();
  const { matchId } = route.params as { matchId: string };

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleSelection = useTicketBuilderStore((s) => s.toggleSelection);
  const selections = useTicketBuilderStore((s) => s.selections);
  const isSelected = useCallback(
    (selectionId: string) => selections.some((s) => s.selectionId === selectionId),
    [selections]
  );

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

  const handleSelect = useCallback(
    (market: Market, sel: MarketSelection) => {
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
    },
    [match, toggleSelection]
  );

  const started = useMemo(
    () =>
      match != null &&
      (match.status !== 'Scheduled' || new Date(match.startTime) <= new Date()),
    [match]
  );

  // Separate player markets from regular markets
  const { playerMarkets, regularMarkets } = useMemo(() => {
    if (!match) return { playerMarkets: [], regularMarkets: [] };

    const player: { type: PlayerMarketType; market: Market }[] = [];
    const regular: Market[] = [];

    for (const market of match.markets) {
      const playerType = getPlayerMarketType(market);
      if (playerType) {
        player.push({ type: playerType, market });
      } else {
        regular.push(market);
      }
    }

    return { playerMarkets: player, regularMarkets: regular };
  }, [match]);

  // Combine player markets into column format
  const combinedPlayers = useMemo(
    () => combinePlayerMarkets(playerMarkets),
    [playerMarkets]
  );

  // State for showing all players
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const displayedPlayers = showAllPlayers ? combinedPlayers : combinedPlayers.slice(0, 5);

  // ─────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={DS.colors.green} />
        <Text style={styles.loadingText}>Chargement du match...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────────

  if (error || !match) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error ?? 'Match introuvable'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMatch}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN CONTENT
  // ─────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
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
      {/* ══════════════════════════════════════════════════════════
          MATCH HEADER CARD
          ══════════════════════════════════════════════════════════ */}
      <View style={styles.matchCard}>
        {/* Header: Sport Icon + League + Time */}
        <View style={styles.cardHeader}>
          <View style={styles.leagueBadge}>
            <Ionicons
              name={getSportIcon(match.sportCode)}
              size={14}
              color={DS.colors.green}
            />
            <Text style={styles.leagueText}>{match.leagueName}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#8A9A8F" />
            <Text style={styles.timeText}>{formatTime(match.startTime)}</Text>
          </View>
        </View>

        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={12} color={DS.colors.greenLight} />
          <Text style={styles.dateText}>{formatDate(match.startTime)}</Text>
        </View>

        {/* Status Badge (if started/live) */}
        {started && (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {match.status === 'Scheduled' ? 'BIENTÔT' : match.status.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Teams Section */}
        <View style={styles.teamsSection}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamLogo}>
              {(() => {
                const logoUrl =
                  match.sportCode === 'TENNIS'
                    ? getTennisFlag(match.homeTeam.name)
                    : getTeamLogo(match.homeTeam.name, match.sportCode);
                return logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.teamLogoImage} />
                ) : (
                  <Text style={styles.teamInitials}>
                    {getTeamInitials(match.homeTeam.name)}
                  </Text>
                );
              })()}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.homeTeam.name}
            </Text>
            <Text style={styles.teamRole}>Domicile</Text>
          </View>

          {/* VS Circle */}
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <View style={styles.teamLogo}>
              {(() => {
                const logoUrl =
                  match.sportCode === 'TENNIS'
                    ? getTennisFlag(match.awayTeam.name)
                    : getTeamLogo(match.awayTeam.name, match.sportCode);
                return logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.teamLogoImage} />
                ) : (
                  <Text style={styles.teamInitials}>
                    {getTeamInitials(match.awayTeam.name)}
                  </Text>
                );
              })()}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.awayTeam.name}
            </Text>
            <Text style={styles.teamRole}>Extérieur</Text>
          </View>
        </View>

        {/* Score (if available) */}
        {match.homeScore != null && match.awayScore != null && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{match.homeScore}</Text>
            <View style={styles.scoreDivider} />
            <Text style={styles.scoreText}>{match.awayScore}</Text>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════
          PLAYER MARKETS - Column Layout (Buteur / Passeur / Décisif)
          ══════════════════════════════════════════════════════════ */}
      {combinedPlayers.length > 0 && (
        <View style={playerStyles.playerMarketsSection}>
          {/* Section Header */}
          <View style={playerStyles.sectionHeader}>
            <Ionicons name="people" size={18} color={DS.colors.green} />
            <Text style={playerStyles.sectionTitle}>JOUEURS</Text>
            <View style={playerStyles.countBadge}>
              <Text style={playerStyles.countText}>{combinedPlayers.length}</Text>
            </View>
          </View>

          {/* Columns Header */}
          <View style={playerStyles.columnsHeader}>
            <Text style={playerStyles.columnTitle}>Buteur</Text>
            <Text style={playerStyles.columnTitle}>Passeur</Text>
            <Text style={playerStyles.columnTitle}>Décisif</Text>
          </View>

          {/* Players List */}
          {displayedPlayers.map((player) => (
            <PlayerColumnsRow
              key={player.playerName}
              player={player}
              isSelected={isSelected}
              onSelect={handleSelect}
              disabled={started}
            />
          ))}

          {/* See More / Collapse Button */}
          {combinedPlayers.length > 5 && (
            <TouchableOpacity
              style={playerStyles.seeMoreButton}
              onPress={() => setShowAllPlayers(!showAllPlayers)}
              activeOpacity={0.7}
            >
              <Text style={playerStyles.seeMoreText}>
                {showAllPlayers ? 'Réduire' : `Voir plus de joueurs (${combinedPlayers.length - 5})`}
              </Text>
              <Ionicons
                name={showAllPlayers ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={DS.colors.green}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════
          REGULAR MARKETS SECTION HEADER
          ══════════════════════════════════════════════════════════ */}
      {regularMarkets.length > 0 && (
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={14} color={DS.colors.greenLight} />
          <Text style={styles.sectionTitle}>Autres Marchés</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{regularMarkets.length}</Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════
          REGULAR MARKETS LIST
          ══════════════════════════════════════════════════════════ */}
      {match.markets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={36} color="#8A9A8F" />
          <Text style={styles.emptyTitle}>Aucun marché disponible</Text>
          <Text style={styles.emptyText}>
            Les marchés seront disponibles prochainement
          </Text>
        </View>
      ) : (
        regularMarkets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            match={match}
            isSelected={isSelected}
            onSelect={handleSelect}
            started={started}
          />
        ))
      )}
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// MARKET CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface MarketCardProps {
  market: Market;
  match: MatchDetail;
  isSelected: (selectionId: string) => boolean;
  onSelect: (market: Market, sel: MarketSelection) => void;
  started: boolean;
}

const MarketCard: React.FC<MarketCardProps> = React.memo(
  ({ market, match, isSelected, onSelect, started }) => {
    return (
      <View style={styles.marketCard}>
        {/* Market Header */}
        <View style={styles.marketHeader}>
          <View style={styles.marketIconWrapper}>
            <Ionicons name="analytics" size={16} color={DS.colors.green} />
          </View>
          <Text style={styles.marketTitle} numberOfLines={2}>
            {formatMarketLabel(market)}
          </Text>
          <View style={styles.marketCountBadge}>
            <Text style={styles.marketCountText}>{market.selections.length}</Text>
          </View>
        </View>

        {/* Odds Row - using OddsButton component */}
        <View style={styles.oddsRow}>
          {market.selections.map((sel) => (
            <OddsButton
              key={sel.id}
              label={formatSelectionLabel(sel, market)}
              odds={sel.odds}
              isSelected={isSelected(sel.id)}
              disabled={started}
              onPress={() => onSelect(market, sel)}
              variant="default"
              size="md"
            />
          ))}
        </View>
      </View>
    );
  }
);

MarketCard.displayName = 'MarketCard';

// ═══════════════════════════════════════════════════════════════
// PLAYER COLUMNS ROW COMPONENT (3 columns: Buteur / Passeur / Décisif)
// ═══════════════════════════════════════════════════════════════

interface PlayerColumnsRowProps {
  player: CombinedPlayerOdds;
  isSelected: (selectionId: string) => boolean;
  onSelect: (market: Market, sel: MarketSelection) => void;
  disabled: boolean;
}

const PlayerColumnsRow: React.FC<PlayerColumnsRowProps> = React.memo(
  ({ player, isSelected, onSelect, disabled }) => {
    const renderOddsBox = (
      data: { selection: MarketSelection; market: Market } | null,
      type: string
    ) => {
      if (!data) {
        return (
          <View style={[playerStyles.oddsBox, playerStyles.oddsBoxEmpty]}>
            <Text style={playerStyles.oddsValueEmpty}>—</Text>
          </View>
        );
      }

      const selected = isSelected(data.selection.id);

      return (
        <TouchableOpacity
          style={[
            playerStyles.oddsBox,
            selected && playerStyles.oddsBoxSelected,
            disabled && playerStyles.oddsBoxDisabled,
          ]}
          onPress={() => onSelect(data.market, data.selection)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text
            style={[
              playerStyles.oddsValue,
              selected && playerStyles.oddsValueSelected,
            ]}
          >
            {data.selection.odds.toFixed(2)}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={playerStyles.playerRow}>
        {/* Player Info */}
        <View style={playerStyles.playerInfo}>
          <Text style={playerStyles.playerName}>{player.playerName}</Text>
          {player.isStarter && (
            <View style={playerStyles.starterBadge}>
              <Ionicons name="shirt" size={12} color="#FBBF24" />
              <Text style={playerStyles.starterText}>Titulaire</Text>
            </View>
          )}
        </View>

        {/* 3 Odds Boxes */}
        <View style={playerStyles.oddsRow}>
          {renderOddsBox(player.scorer, 'scorer')}
          {renderOddsBox(player.assist, 'assist')}
          {renderOddsBox(player.decisive, 'decisive')}
        </View>
      </View>
    );
  }
);

PlayerColumnsRow.displayName = 'PlayerColumnsRow';

// ═══════════════════════════════════════════════════════════════
// PLAYER STYLES
// ═══════════════════════════════════════════════════════════════

const playerStyles = StyleSheet.create({
  // Section container
  playerMarketsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#131916',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2A22',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.colors.white,
    letterSpacing: 0.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.green,
  },

  // Columns header (Buteur / Passeur / Décisif)
  columnsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#0F1611',
    borderRadius: 10,
    gap: 8,
  },
  columnTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Player row
  playerRow: {
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
    flex: 1,
  },
  starterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  starterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Odds row (3 columns)
  oddsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  oddsBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 40, 30, 0.6)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minHeight: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  oddsBoxSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: DS.colors.green,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  oddsBoxEmpty: {
    backgroundColor: 'rgba(0, 20, 15, 0.4)',
    borderColor: 'rgba(34, 197, 94, 0.1)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  oddsBoxDisabled: {
    opacity: 0.5,
  },
  oddsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: DS.colors.green,
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  oddsValueSelected: {
    color: DS.colors.white,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  oddsValueEmpty: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(138, 154, 143, 0.5)',
  },

  // See more button
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: DS.colors.green,
  },
});

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: DS.colors.background,
  },
  loadingText: {
    color: DS.colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: DS.colors.green,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: DS.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // ══════════════════════════════════════════════════════════════
  // MATCH CARD (same style as MatchesScreen)
  // ══════════════════════════════════════════════════════════════
  matchCard: {
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.white,
    textTransform: 'uppercase',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8A9A8F',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: DS.colors.greenLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
  teamsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F1611',
    borderWidth: 2,
    borderColor: DS.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'contain',
  },
  teamInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.green,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8A9A8F',
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 2,
    borderColor: DS.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    color: DS.colors.green,
    letterSpacing: 0.5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#0F1611',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
    color: DS.colors.white,
  },
  scoreDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#1E2A22',
    borderRadius: 1,
  },

  // ══════════════════════════════════════════════════════════════
  // SECTION HEADER (same style as date headers in MatchesScreen)
  // ══════════════════════════════════════════════════════════════
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.greenLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: DS.colors.green,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.colors.white,
  },

  // ══════════════════════════════════════════════════════════════
  // MARKET CARD (same style as MatchCard)
  // ══════════════════════════════════════════════════════════════
  marketCard: {
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  marketIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
  },
  marketCountBadge: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  marketCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.green,
  },
  oddsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // ══════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════════════════════════════
  emptyContainer: {
    backgroundColor: '#131916',
    borderWidth: 1,
    borderColor: '#1E2A22',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#8A9A8F',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MatchDetailsScreen;

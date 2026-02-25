import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { ticketApi } from '../api/ticket.api';
import type { RootStackParamList, TicketDto } from '../types';
import { SkeletonTicketList } from '../components/common/Skeleton';
import { TicketRefreshControl } from '../components/common/PremiumRefreshControl';
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  effectGlass,
  effectShadows,
  springConfigs,
} from '../theme';

const PAGE_SIZE = 15;

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

  // Multiple selections with different times
  return `${formatShort(first)} → ${formatShort(last)}`;
}

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Open: 'radio-button-on',
  Locked: 'lock-closed',
  Finished: 'checkmark-circle',
};

// ─────────────────────────────────────────────────────────────
// Sub-components with glassmorphism & animations
// ─────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: TicketDto;
  colors: ThemeColors;
  onPress: () => void;
}

const TicketCard: React.FC<TicketCardProps> = React.memo(({ ticket, colors, onPress }) => {
  const styles = useTicketCardStyles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const statusColors: Record<string, string> = {
    Open: colors.success,
    Locked: colors.accent,
    Finished: colors.textSecondary,
  };

  const statusLabels: Record<string, string> = {
    Open: 'Ouvert',
    Locked: 'Verrouillé',
    Finished: 'Terminé',
  };

  const resultColors: Record<string, string> = {
    Pending: colors.textSecondary,
    Win: colors.success,
    Lose: colors.danger,
  };

  const resultLabels: Record<string, string> = {
    Pending: 'En cours',
    Win: 'Validé',
    Lose: 'Non validé',
  };

  const resultIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Pending: 'time',
    Win: 'checkmark-circle',
    Lose: 'close-circle',
  };

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

  const selectionCount = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const dateRangeText = formatDateRange(ticket.firstMatchTime, ticket.lastMatchTime, selectionCount);

  const CardContainer = Platform.OS === 'ios' ? BlurView : View;
  const cardContainerProps = Platform.OS === 'ios'
    ? { intensity: 25, tint: 'dark' as const }
    : {};

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <CardContainer {...cardContainerProps} style={styles.card}>
          {/* Gradient overlay for glass effect on Android */}
          {Platform.OS === 'android' && (
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={[`${colors.surface}F2`, `${colors.surface}E6`]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ticketIcon}
              >
                <Ionicons name="receipt" size={14} color={colors.textOnPrimary} />
              </LinearGradient>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {ticket.title}
              </Text>
            </View>
            <LinearGradient
              colors={[
                statusColors[ticket.status] ?? colors.textSecondary,
                `${statusColors[ticket.status] ?? colors.textSecondary}CC`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusBadge}
            >
              <Ionicons
                name={STATUS_ICONS[ticket.status] ?? 'ellipse'}
                size={10}
                color={colors.textOnPrimary}
              />
              <Text style={styles.statusText}>{statusLabels[ticket.status] ?? ticket.status}</Text>
            </LinearGradient>
          </View>

          {/* Match dates */}
          <View style={styles.dateRangeWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dateRangeContainer}
            >
              <Ionicons name="calendar" size={12} color={colors.textOnPrimary} />
              <Text style={styles.dateRangeText}>{dateRangeText}</Text>
            </LinearGradient>
          </View>

          {/* Meta stats */}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconWrapper}>
                <Ionicons name="layers" size={14} color={colors.primary} />
              </View>
              <Text style={styles.metaLabel}>Sélections</Text>
              <Text style={styles.metaValue}>{ticket.selections.length}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <View style={[styles.metaIconWrapper, { backgroundColor: colors.accentBg }]}>
                <Ionicons name="trending-up" size={14} color={colors.accent} />
              </View>
              <Text style={styles.metaLabel}>Cote moy.</Text>
              <LinearGradient
                colors={[colors.accent, colors.accentLight || colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.oddsGradient}
              >
                <Text style={styles.metaValueHighlight}>
                  {ticket.avgOdds.toFixed(2)}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <View style={[styles.metaIconWrapper, { backgroundColor: colors.successBg }]}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              </View>
              <Text style={styles.metaLabel}>Confiance</Text>
              <Text style={styles.metaValue}>{ticket.confidenceIndex}/10</Text>
            </View>
          </View>

          {/* Sports badges */}
          <View style={styles.sportsRow}>
            {ticket.sports.map((s) => (
              <View key={s} style={styles.sportBadge}>
                <Ionicons name={SPORT_ICONS[s] || 'trophy'} size={12} color={colors.primary} />
                <Text style={styles.sportBadgeText}>
                  {SPORT_LABELS[s] ?? s}
                </Text>
              </View>
            ))}
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <View style={[
                styles.visibilityBadge,
                ticket.isPublic ? styles.visibilityPublic : styles.visibilityPrivate,
              ]}>
                <Ionicons
                  name={ticket.isPublic ? 'earth' : 'lock-closed'}
                  size={11}
                  color={ticket.isPublic ? colors.primary : colors.accent}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    { color: ticket.isPublic ? colors.primary : colors.accent },
                  ]}
                >
                  {ticket.isPublic ? 'Public' : `${ticket.priceEur.toFixed(2)} €`}
                </Text>
              </View>
              <View style={styles.dateWrapper}>
                <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
                <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
              </View>
            </View>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor:
                    (resultColors[ticket.result] ?? colors.textSecondary) + '20',
                  borderColor: (resultColors[ticket.result] ?? colors.textSecondary) + '40',
                },
              ]}
            >
              <Ionicons
                name={resultIcons[ticket.result] ?? 'ellipse'}
                size={14}
                color={resultColors[ticket.result] ?? colors.textSecondary}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: resultColors[ticket.result] ?? colors.textSecondary },
                ]}
              >
                {resultLabels[ticket.result] ?? ticket.result}
              </Text>
            </View>
          </View>

          {/* Decorative accent line */}
          <LinearGradient
            colors={[colors.primary, colors.accent, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </CardContainer>
      </TouchableOpacity>
    </Animated.View>
  );
});

const LoadingState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const styles = useLoadingStyles(colors);

  return (
    <View style={styles.container}>
      <SkeletonTicketList count={4} />
    </View>
  );
});

const ErrorState: React.FC<{ colors: ThemeColors; error: string; onRetry: () => void }> = React.memo(
  ({ colors, error, onRetry }) => {
    const styles = useErrorStyles(colors);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }, [shakeAnim]);

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
      <View style={styles.center}>
        <Animated.View
          style={[styles.errorIconWrapper, { transform: [{ translateX: shakeAnim }] }]}
        >
          <LinearGradient
            colors={[colors.danger, `${colors.danger}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.errorGradient}
          >
            <Ionicons name="cloud-offline" size={36} color={colors.textOnPrimary} />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={onRetry}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryBtn}
            >
              <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

const EmptyState: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const styles = useEmptyStyles(colors);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim]);

  return (
    <View style={styles.center}>
      <Animated.View style={[styles.emptyIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
        <LinearGradient
          colors={[`${colors.primary}20`, `${colors.primary}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyGradient}
        >
          <Ionicons name="receipt-outline" size={40} color={colors.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>Aucun ticket créé</Text>
      <Text style={styles.emptyHint}>
        Créez votre premier ticket depuis le coupon
      </Text>
      <View style={styles.emptyArrow}>
        <Ionicons name="arrow-down" size={24} color={colors.textTertiary} />
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────

const MyTicketsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTickets = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      setError(null);
      const { data } = await ticketApi.getMyTicketsPaginated(pageNum, PAGE_SIZE);

      if (isRefresh || pageNum === 1) {
        setTickets(data.items);
      } else {
        setTickets(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch {
      setError('Impossible de charger vos tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchTickets(1, true);
  }, [fetchTickets]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchTickets(page + 1);
  }, [hasMore, loadingMore, loading, page, fetchTickets]);

  const handleTicketPress = useCallback(
    (ticketId: string) => {
      navigation.navigate('TicketDetail', { ticketId });
    },
    [navigation]
  );

  const renderTicket = useCallback(
    ({ item }: { item: TicketDto }) => (
      <TicketCard
        ticket={item}
        colors={colors}
        onPress={() => handleTicketPress(item.id)}
      />
    ),
    [colors, handleTicketPress]
  );

  const keyExtractor = useCallback((item: TicketDto) => item.id, []);

  if (loading && tickets.length === 0) {
    return <LoadingState colors={colors} />;
  }

  if (error && tickets.length === 0) {
    return <ErrorState colors={colors} error={error} onRetry={onRefresh} />;
  }

  if (tickets.length === 0) {
    return <EmptyState colors={colors} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <TicketRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        renderItem={renderTicket}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>Chargement...</Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        list: {
          padding: spacing.md,
          paddingBottom: spacing.xxl + 80,
          flexGrow: 1,
        },
        separator: {
          height: spacing.sm,
        },
        loadingMore: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.xl,
        },
        loadingMoreText: {
          ...typography.caption,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

const useTicketCardStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        cardWrapper: {
          borderRadius: radius.xl,
          ...effectShadows.lg,
        },
        card: {
          borderRadius: radius.xl,
          padding: spacing.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: effectGlass.borderColor,
          backgroundColor: Platform.OS === 'android' ? 'transparent' : undefined,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        },
        cardTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flex: 1,
          marginRight: spacing.sm,
        },
        ticketIcon: {
          width: 32,
          height: 32,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          ...effectShadows.sm,
        },
        cardTitle: {
          ...typography.h4,
          color: colors.text,
          flex: 1,
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        statusText: {
          ...typography.badge,
          color: colors.textOnPrimary,
          fontWeight: '600',
        },
        dateRangeWrapper: {
          marginBottom: spacing.lg,
        },
        dateRangeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.xs,
          ...effectShadows.md,
        },
        dateRangeText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        cardMeta: {
          flexDirection: 'row',
          backgroundColor: `${colors.background}90`,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        metaItem: {
          flex: 1,
          alignItems: 'center',
          gap: spacing.xxs,
        },
        metaIconWrapper: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xxs,
        },
        metaDivider: {
          width: 1,
          backgroundColor: colors.border,
          marginHorizontal: spacing.xs,
        },
        metaLabel: {
          ...typography.caption,
          fontSize: 10,
          color: colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        metaValue: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        oddsGradient: {
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
        },
        metaValueHighlight: {
          ...typography.odds,
          color: colors.textOnPrimary,
          fontWeight: '700',
        },
        sportsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
          marginBottom: spacing.md,
        },
        sportBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          backgroundColor: colors.primaryBg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderWidth: 1,
          borderColor: `${colors.primary}30`,
        },
        sportBadgeText: {
          ...typography.badge,
          color: colors.primary,
          fontWeight: '600',
        },
        cardFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        footerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        visibilityBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
          borderWidth: 1,
        },
        visibilityPublic: {
          backgroundColor: colors.primaryBg,
          borderColor: `${colors.primary}30`,
        },
        visibilityPrivate: {
          backgroundColor: colors.accentBg,
          borderColor: `${colors.accent}30`,
        },
        visibilityText: {
          ...typography.badge,
          fontWeight: '600',
        },
        dateWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
        },
        dateText: {
          ...typography.caption,
          color: colors.textTertiary,
        },
        resultBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
        },
        resultText: {
          ...typography.badge,
          fontWeight: '600',
        },
        accentLine: {
          position: 'absolute',
          bottom: 0,
          left: spacing.lg,
          right: spacing.lg,
          height: 2,
          borderRadius: radius.full,
        },
      }),
    [colors]
  );

const useLoadingStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.md,
        },
      }),
    [colors]
  );

const useErrorStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        },
        errorIconWrapper: {
          marginBottom: spacing.lg,
        },
        errorGradient: {
          width: 88,
          height: 88,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          ...effectShadows.lg,
        },
        errorTitle: {
          ...typography.h3,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        errorText: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
          maxWidth: 280,
        },
        retryBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          ...effectShadows.md,
        },
        retryBtnText: {
          ...typography.button,
          color: colors.textOnPrimary,
        },
      }),
    [colors]
  );

const useEmptyStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        },
        emptyIconWrapper: {
          marginBottom: spacing.lg,
        },
        emptyGradient: {
          width: 100,
          height: 100,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${colors.primary}30`,
          borderStyle: 'dashed',
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        },
        emptyHint: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
          marginBottom: spacing.lg,
        },
        emptyArrow: {
          opacity: 0.5,
        },
      }),
    [colors]
  );

export default MyTicketsScreen;

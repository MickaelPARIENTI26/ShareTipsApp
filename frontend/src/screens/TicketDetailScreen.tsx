import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripeSafe } from '../hooks/useStripeSafe';

import { ticketApi } from '../api/ticket.api';
import { purchaseApi } from '../api/purchase.api';
import { useFavoriteStore } from '../store/favorite.store';
import { useConsentStore } from '../store/consent.store';
import { useAuthStore } from '../store/auth.store';
import { getErrorMessage } from '../utils/errors';
import type { RootStackParamList, TicketDto } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette } from '../theme';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateRangeSummary(firstMatchTime: string, lastMatchTime: string): {
  isSameDay: boolean;
  firstDate: string;
  lastDate: string;
  duration: string;
} {
  const first = new Date(firstMatchTime);
  const last = new Date(lastMatchTime);

  const isSameDay = first.toDateString() === last.toDateString();

  const firstDate = formatDateTime(firstMatchTime);
  const lastDate = formatDateTime(lastMatchTime);

  // Calculate duration in days/hours
  const diffMs = last.getTime() - first.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  let duration = '';
  if (diffDays > 0) {
    duration = `${diffDays}j`;
    if (remainingHours > 0) {
      duration += ` ${remainingHours}h`;
    }
  } else if (diffHours > 0) {
    duration = `${diffHours}h`;
  } else {
    duration = 'Même heure';
  }

  return { isSameDay, firstDate, lastDate, duration };
}

const TicketDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const { initPaymentSheet, presentPaymentSheet } = useStripeSafe();
  const viewShotRef = useRef<ViewShot>(null);

  const route = useRoute();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ticketId } = route.params as RootStackParamList['TicketDetail'];

  const STATUS_COLORS: Record<string, string> = {
    Open: colors.success,
    Locked: colors.warning,
    Finished: colors.textSecondary,
  };

  const STATUS_LABELS: Record<string, string> = {
    Open: 'Ouvert',
    Locked: 'Verrouillé',
    Finished: 'Terminé',
  };

  const RESULT_COLORS: Record<string, string> = {
    Win: colors.success,
    Won: colors.success,
    Lose: colors.danger,
    Lost: colors.danger,
    Pending: colors.textSecondary,
  };

  const RESULT_LABELS: Record<string, string> = {
    Win: 'Validé',
    Won: 'Validé',
    Lose: 'Non validé',
    Lost: 'Non validé',
    Pending: 'En cours',
  };

  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [sharing, setSharing] = useState(false);

  const isFavorited = useFavoriteStore((s) => s.favoritedIds.has(ticketId));
  const toggleFavorite = useFavoriteStore((s) => s.toggle);
  const hydrateFavorites = useFavoriteStore((s) => s.hydrate);

  // Current user
  const currentUserId = useAuthStore((s) => s.user?.id);

  // Consent store
  const hasConsented = useConsentStore((s) => s.hasConsented);
  const hydrateConsent = useConsentStore((s) => s.hydrate);
  const giveConsent = useConsentStore((s) => s.giveConsent);

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await ticketApi.getById(ticketId);
      setTicket(data);
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [ticketId, navigation]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    hydrateFavorites();
    hydrateConsent();
  }, [hydrateFavorites, hydrateConsent]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(ticketId);
  }, [ticketId, toggleFavorite]);

  const handleBuy = useCallback(async () => {
    if (!ticket || buying) return;

    // Give consent if checkbox is checked (and not already consented)
    if (!hasConsented) {
      if (!consentChecked) {
        Alert.alert('Consentement requis', 'Veuillez cocher la case de consentement avant d\'acheter.');
        return;
      }
      const success = await giveConsent();
      if (!success) {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le consentement');
        return;
      }
    }

    setBuying(true);
    try {
      // 1. Create PaymentIntent on server
      const { data: initData } = await purchaseApi.initiatePurchase(ticket.id);

      if (!initData.success || !initData.clientSecret) {
        Alert.alert('Erreur', initData.message ?? 'Impossible de créer le paiement');
        setBuying(false);
        return;
      }

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: initData.clientSecret,
        merchantDisplayName: 'ShareTips',
      });

      if (initError) {
        Alert.alert('Erreur', initError.message);
        setBuying(false);
        return;
      }

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled - not an error
        if (presentError.code !== 'Canceled') {
          Alert.alert('Erreur', presentError.message);
        }
        setBuying(false);
        return;
      }

      // 4. Confirm purchase on server
      if (initData.paymentId) {
        await purchaseApi.confirmPurchase(initData.paymentId);
      }

      Alert.alert('Achat réussi', 'Vous avez maintenant accès au ticket.');
      // Refetch ticket to unlock selections
      await fetchTicket();
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setBuying(false);
    }
  }, [ticket, buying, fetchTicket, hasConsented, consentChecked, giveConsent, initPaymentSheet, presentPaymentSheet]);

  const handleTipsterPress = useCallback(() => {
    if (!ticket) return;
    navigation.navigate('TipsterProfile', {
      tipsterId: ticket.creatorId,
      tipsterUsername: ticket.creatorUsername,
    });
  }, [ticket, navigation]);

  const handleShare = useCallback(async () => {
    if (!ticket || !viewShotRef.current || sharing) return;

    setSharing(true);
    try {
      // 1. Capture the ticket image
      const imageUri = await viewShotRef.current.capture?.();

      // 2. Prepare share message with link
      const ticketUrl = `https://sharetips.com/tickets/${ticket.id}`;
      const selectionCount = ticket.selections?.length ?? ticket.selectionCount ?? 0;
      const totalOddsValue = ticket.selections?.length > 0
        ? ticket.selections.reduce((acc, sel) => acc * sel.odds, 1)
        : ticket.avgOdds;

      const message = `🎯 Découvre ce ticket sur ShareTips !

${ticket.creatorUsername} - ${selectionCount} sélection${selectionCount > 1 ? 's' : ''}
Cote totale: ${totalOddsValue.toFixed(2)}

👉 ${ticketUrl}`;

      // 3. Share image + message
      if (imageUri) {
        // Try sharing with image first
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            dialogTitle: message,
            UTI: 'public.png',
          });
        } else {
          // Fallback to text-only share
          await Share.share({
            message,
            url: ticketUrl,
            title: `Ticket de ${ticket.creatorUsername}`,
          });
        }
      } else {
        // Fallback if image capture fails
        await Share.share({
          message,
          url: ticketUrl,
          title: `Ticket de ${ticket.creatorUsername}`,
        });
      }
    } catch (err) {
      // User cancelled - not an error
      if ((err as Error).message !== 'User did not share') {
        if (__DEV__) console.error('Share error:', err);
        Alert.alert('Erreur', 'Impossible de partager le ticket');
      }
    } finally {
      setSharing(false);
    }
  }, [ticket, sharing]);

  // Save image to gallery
  const handleSaveImage = useCallback(async () => {
    if (!viewShotRef.current || sharing) return;

    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        Alert.alert('Erreur', 'Impossible de capturer le ticket');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Succès', 'Image sauvegardée dans votre galerie.');
      } else {
        Alert.alert('Erreur', 'Permission refusée pour accéder à la galerie');
      }
    } catch (err) {
      if (__DEV__) console.error('Save image error:', err);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'image');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!ticket) return null;

  const isCreator = currentUserId === ticket.creatorId;
  const hasAccess =
    isCreator || ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;
  const isTicketLocked = ticket.status === 'Locked' || ticket.status === 'Finished';
  const showSelections = !isPrivateLocked;

  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;

  // Calculate total odds as product of all selection odds
  const totalOdds = ticket.selections?.length > 0
    ? ticket.selections.reduce((acc, sel) => acc * sel.odds, 1)
    : ticket.avgOdds;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Shareable content */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={styles.shareableContent}
        >
          {/* ShareTips Branding Header */}
          <View style={styles.shareBrandingHeader}>
            <View style={styles.shareBrandingLogo}>
              <Ionicons name="flash" size={16} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.shareBrandingTitle}>ShareTips</Text>
            <View style={styles.shareBrandingBadge}>
              <Text style={styles.shareBrandingBadgeText}>TICKET</Text>
            </View>
          </View>

          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>{ticket.creatorUsername}</Text>
              {isPrivateLocked && (
                <View style={styles.payantBadge}>
                  <Ionicons name="lock-closed" size={12} color={colors.accent} />
                  <Text style={styles.payantBadgeText}>Payant</Text>
                </View>
              )}
              {!ticket.isPublic && ticket.isSubscribedToCreator && (
                <View style={styles.abonneBadge}>
                  <Ionicons name="star" size={12} color={colors.accent} />
                  <Text style={styles.abonneBadgeText}>Abonné</Text>
                </View>
              )}
              {!ticket.isPublic &&
                ticket.isPurchasedByCurrentUser &&
                !ticket.isSubscribedToCreator && (
                  <View style={styles.acheteBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color={colors.primary}
                    />
                    <Text style={styles.acheteBadgeText}>Acheté</Text>
                  </View>
                )}
            </View>

            {/* Tipster username + stats */}
            <TouchableOpacity
              onPress={handleTipsterPress}
              accessibilityLabel={`Voir le profil de ${ticket.creatorUsername}`}
              accessibilityRole="button"
            >
              <Text style={styles.creatorLink}>@{ticket.creatorUsername}</Text>
            </TouchableOpacity>

            {/* Tipster Stats Row: 🏆 #42 • 📊 2.45 • ✅ 67% */}
            <View style={styles.tipsterStatsRow}>
              {/* Ranking */}
              <View style={styles.tipsterStat}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
                <Text style={styles.tipsterStatText}>#—</Text>
              </View>

              <Text style={styles.statSeparator}>•</Text>

              {/* Average Odds */}
              <View style={styles.tipsterStat}>
                <Ionicons name="stats-chart" size={12} color={colors.primary} />
                <Text style={styles.tipsterStatText}>
                  {ticket.avgOdds.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.statSeparator}>•</Text>

              {/* Win Rate */}
              <View style={styles.tipsterStat}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.tipsterStatText}>—%</Text>
              </View>
            </View>
          </View>

        {/* Summary - Only Cote moyenne + Sélections */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="trending-up" size={14} color={colors.textSecondary} />
              <Text style={styles.summaryLabel}>Cote totale</Text>
            </View>
            <View style={styles.oddsContainer}>
              <Text style={styles.summaryValueBlue}>
                {totalOdds.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="list" size={14} color={colors.textSecondary} />
              <Text style={styles.summaryLabel}>Sélections</Text>
            </View>
            <Text style={styles.summaryValue}>{count}</Text>
          </View>
        </View>

        {/* Timeline - Compact on 1 line */}
        {(() => {
          const { isSameDay, firstDate, lastDate } = formatDateRangeSummary(
            ticket.firstMatchTime,
            ticket.lastMatchTime
          );
          return (
            <View style={styles.timelineCard}>
              <View style={styles.timelineCompactRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={styles.timelineCompactText}>{firstDate}</Text>
                {!isSameDay && (
                  <>
                    <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
                    <Text style={styles.timelineCompactText}>{lastDate}</Text>
                  </>
                )}
              </View>
            </View>
          );
        })()}

        {/* Sports */}
          <View style={styles.sportRow}>
            {ticket.sports.map((s) => (
              <View key={s} style={styles.sportBadge}>
                <Ionicons name="trophy" size={10} color={colors.primary} />
                <Text style={styles.sportBadgeText}>
                  {SPORT_LABELS[s] ?? s}
                </Text>
              </View>
            ))}
          </View>

          {/* ShareTips branding footer for shared image */}
          <View style={styles.brandingFooter}>
            <View style={styles.brandingRow}>
              <Ionicons name="link" size={12} color={colors.primary} />
              <Text style={styles.brandingUrl}>
                sharetips.com/t/{ticket.id.slice(-6)}
              </Text>
            </View>
            <Text style={styles.brandingText}>Partagé via ShareTips</Text>
          </View>
        </ViewShot>

        {/* Selections — visible only if public or purchased */}
        {showSelections && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Ionicons name="list" size={14} color={colors.textOnPrimary} />
                <Text style={styles.sectionTitle}>
                  Sélections ({ticket.selections.length})
                </Text>
              </View>
              <View style={styles.sectionLine} />
            </View>
            {ticket.selections.map((sel, i) => {
              const matchDate = sel.matchStartTime
                ? new Date(sel.matchStartTime).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              const isFinished = sel.matchStatus === 'Finished';
              const hasScore =
                sel.homeScore !== null && sel.awayScore !== null;
              const scoreText =
                isFinished && hasScore
                  ? `${sel.homeScore} - ${sel.awayScore}`
                  : null;

              const resultColor =
                sel.result === 'Win'
                  ? colors.success
                  : sel.result === 'Lose'
                    ? colors.danger
                    : undefined;

              const resultIcon =
                sel.result === 'Win'
                  ? 'checkmark-circle'
                  : sel.result === 'Lose'
                    ? 'close-circle'
                    : null;

              return (
                <View
                  key={sel.id}
                  style={[
                    styles.selCard,
                    resultColor && {
                      borderLeftWidth: 4,
                      borderLeftColor: resultColor,
                    },
                  ]}
                >
                  <View style={styles.selCardHeader}>
                    <View style={[styles.selIndex, resultColor && { backgroundColor: resultColor }]}>
                      <Text style={styles.selIndexText}>{i + 1}</Text>
                    </View>
                    <View style={styles.selCardHeaderText}>
                      <View style={styles.matchLabelRow}>
                        <Text style={styles.selMatchLabel}>
                          {sel.matchLabel ??
                            `Match ${sel.matchId.substring(0, 8)}...`}
                        </Text>
                        {resultIcon && (
                          <Ionicons
                            name={resultIcon}
                            size={18}
                            color={resultColor}
                            style={styles.resultIcon}
                          />
                        )}
                      </View>
                      <View style={styles.matchMetaRow}>
                        {matchDate && (
                          <Text style={styles.selMatchDate}>{matchDate}</Text>
                        )}
                        {scoreText && (
                          <View style={[styles.scoreBadge, { backgroundColor: resultColor + '20' }]}>
                            <Text
                              style={[styles.scoreText, { color: resultColor }]}
                            >
                              {scoreText}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  {sel.leagueName && (
                    <View style={styles.leagueBadgeRow}>
                      <Ionicons name="ribbon" size={12} color={colors.primary} />
                      <Text style={styles.selLeague}>{sel.leagueName}</Text>
                    </View>
                  )}
                  <View style={styles.selRow}>
                    <View style={styles.selLabelContainer}>
                      <Ionicons name="stats-chart" size={12} color={colors.textTertiary} />
                      <Text style={styles.selLabel}>Marché</Text>
                    </View>
                    <Text style={styles.selValue}>{sel.marketType}</Text>
                  </View>
                  <View style={styles.selRow}>
                    <View style={styles.selLabelContainer}>
                      <Ionicons name="checkmark" size={12} color={colors.textTertiary} />
                      <Text style={styles.selLabel}>Sélection</Text>
                    </View>
                    <Text
                      style={[
                        styles.selValue,
                        resultColor && { color: resultColor },
                      ]}
                    >
                      {sel.selectionLabel}
                    </Text>
                  </View>
                  <View style={[styles.selRow, styles.selRowLast]}>
                    <View style={styles.selLabelContainer}>
                      <Ionicons name="trending-up" size={12} color={colors.accent} />
                      <Text style={styles.selLabel}>Cote</Text>
                    </View>
                    <View style={styles.oddsValueContainer}>
                      <Text style={styles.oddsValue}>{sel.odds.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Locked content notice for private non-purchased */}
        {isPrivateLocked && (
          <View style={styles.lockedCard}>
            <View style={styles.lockedIconWrapper}>
              <Ionicons name="lock-closed" size={32} color={isTicketLocked ? colors.textSecondary : colors.accent} />
            </View>
            <Text style={styles.lockedTitle}>Contenu verrouillé</Text>
            {isTicketLocked ? (
              <Text style={styles.lockedText}>
                Ce ticket est {ticket.status === 'Finished' ? 'terminé' : 'verrouillé'} et n{"'"}est plus disponible à l{"'"}achat.
              </Text>
            ) : (
              <>
                <Text style={styles.lockedText}>
                  Achetez ce ticket ou abonnez-vous à{' '}
                  {ticket.creatorUsername} pour voir{' '}
                  {count === 1
                    ? `la sélection`
                    : `les ${count} sélections`}.
                </Text>
                <View style={styles.disclaimerContainer}>
                  <Ionicons name="information-circle" size={14} color={colors.textTertiary} />
                  <Text style={styles.disclaimer}>
                    Ce pronostic ne garantit aucun résultat. Vous restez seul responsable de vos décisions.
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        {/* Consent checkbox for private locked tickets - only show if ticket is still purchasable */}
        {isPrivateLocked && !hasConsented && !isTicketLocked && (
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsentChecked(!consentChecked)}
            activeOpacity={0.7}
            accessibilityLabel={consentChecked ? 'Retirer le consentement' : 'Accepter les conditions'}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentChecked }}
          >
            <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
              {consentChecked && (
                <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
              )}
            </View>
            <Text style={styles.consentLabel}>
              Je comprends que les pronostics ne garantissent aucun résultat
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerButtonsRow}>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            accessibilityLabel={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? colors.danger : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.7}
            disabled={sharing}
            accessibilityLabel="Partager ce ticket"
            accessibilityRole="button"
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-social-outline" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>

          {isPrivateLocked && isTicketLocked ? (
            // Ticket is locked/finished - cannot be purchased anymore
            <View style={styles.lockedBadgeFooter}>
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
              <Text style={styles.lockedFooterText}>Ticket verrouillé</Text>
            </View>
          ) : isPrivateLocked ? (
            <TouchableOpacity
              style={[styles.buyBtn, buying && styles.buyBtnDisabled]}
              onPress={handleBuy}
              activeOpacity={0.7}
              disabled={buying}
              accessibilityLabel={buying ? 'Achat en cours' : `Acheter ce ticket pour ${ticket.priceEur.toFixed(2)} euros`}
              accessibilityRole="button"
              accessibilityState={{ disabled: buying }}
            >
              {buying ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <>
                  <Ionicons name="cart" size={18} color={colors.textOnPrimary} />
                  <Text style={styles.buyBtnText}>
                    {ticket.priceEur.toFixed(2)} €
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : !ticket.isPublic && ticket.isSubscribedToCreator ? (
            <View style={styles.abonneBadgeFooter}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={styles.abonneFooterText}>Abonné</Text>
            </View>
          ) : !ticket.isPublic && ticket.isPurchasedByCurrentUser ? (
            <View style={styles.purchasedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.purchasedText}>Acheté</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        },
        loadingContainer: {
          alignItems: 'center',
          gap: spacing.md,
        },
        loadingText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        scroll: {
          padding: spacing.base,
          paddingBottom: spacing.lg,
        },
        shareableContent: {
          backgroundColor: colors.background,
          borderRadius: radius.lg,
          padding: spacing.xxs,
        },

        // Share branding header
        shareBrandingHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
          gap: spacing.sm,
        },
        shareBrandingLogo: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shareBrandingTitle: {
          ...typography.h4,
          fontWeight: '800',
          color: colors.primary,
          letterSpacing: -0.5,
        },
        shareBrandingBadge: {
          backgroundColor: colors.accentBg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        shareBrandingBadgeText: {
          ...typography.badge,
          fontWeight: '700',
          color: colors.accent,
          letterSpacing: 0.5,
        },

        // Header
        headerCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
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
        },
        headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xs,
        },
        title: {
          ...typography.h4,
          color: colors.text,
          flex: 1,
        },
        creatorLink: {
          ...typography.body,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: spacing.sm,
        },
        tipsterStatsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        tipsterStat: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
        },
        tipsterStatText: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        statSeparator: {
          fontSize: 10,
          color: colors.textTertiary,
        },
        payantBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.accentBg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          gap: spacing.xxs,
          marginLeft: spacing.sm,
        },
        payantBadgeText: {
          ...typography.badge,
          color: colors.accent,
        },
        acheteBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primaryBg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          gap: spacing.xxs,
          marginLeft: spacing.sm,
        },
        acheteBadgeText: {
          ...typography.badge,
          color: colors.primary,
        },

        // Summary
        summaryCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
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
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        summaryRowLast: {
          borderBottomWidth: 0,
        },
        summaryLabelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        summaryLabel: {
          ...typography.body,
          color: colors.textSecondary,
        },
        summaryValue: {
          ...typography.body,
          fontWeight: '700',
          color: colors.text,
        },
        oddsContainer: {
          backgroundColor: colors.accentBg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        summaryValueBlue: {
          ...typography.odds,
          color: colors.accent,
        },
        statusBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        statusBadgeText: {
          ...typography.badge,
        },
        resultBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xxs,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        resultBadgeText: {
          ...typography.badge,
        },
        visibilityBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        visibilityPublic: {
          backgroundColor: colors.primaryBg,
        },
        visibilityPrivate: {
          backgroundColor: colors.accentBg,
        },
        visibilityText: {
          ...typography.badge,
        },

        // Timeline - Compact
        timelineCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
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
        },
        timelineCompactRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
        },
        timelineCompactText: {
          ...typography.bodySmall,
          fontWeight: '500',
          color: colors.text,
        },
        durationCompactRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.sm,
        },
        durationCompactText: {
          ...typography.caption,
          color: colors.textTertiary,
        },

        // Sports
        sportRow: {
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
          paddingVertical: spacing.xxs,
        },
        sportBadgeText: {
          ...typography.badge,
          color: colors.primary,
        },
        brandingFooter: {
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          marginTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: spacing.xs,
        },
        brandingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        brandingUrl: {
          ...typography.caption,
          fontWeight: '600',
          color: colors.primary,
        },
        brandingText: {
          ...typography.caption,
          color: colors.textTertiary,
          fontWeight: '500',
        },

        // Section header
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: spacing.md,
        },
        sectionBadge: {
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
        },
        sectionTitle: {
          ...typography.label,
          color: colors.textOnPrimary,
        },
        sectionLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },

        // Selections
        selCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
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
        },
        selCardHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
          gap: spacing.sm,
        },
        selIndex: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
            android: {
              elevation: 3,
            },
          }),
        },
        selIndexText: {
          ...typography.badge,
          fontSize: 13,
          fontWeight: '800',
          color: colors.textOnPrimary,
        },
        selCardHeaderText: {
          flex: 1,
        },
        matchLabelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        selMatchLabel: {
          ...typography.body,
          fontWeight: '600',
          color: colors.text,
          flex: 1,
        },
        resultIcon: {
          marginLeft: spacing.xs,
        },
        matchMetaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.xxs,
          gap: spacing.sm,
        },
        selMatchDate: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        scoreBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.full,
        },
        scoreText: {
          ...typography.badge,
          fontWeight: '700',
        },
        leagueBadgeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginBottom: spacing.sm,
          marginLeft: 36,
        },
        selLeague: {
          ...typography.caption,
          color: colors.primary,
        },
        selRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        selRowLast: {
          borderBottomWidth: 0,
          paddingTop: spacing.md,
        },
        selLabelContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        selLabel: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        selValue: {
          ...typography.bodySmall,
          fontWeight: '600',
          color: colors.text,
          flexShrink: 1,
          textAlign: 'right',
          maxWidth: '55%',
        },
        oddsValueContainer: {
          backgroundColor: colors.accentBg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        oddsValue: {
          ...typography.odds,
          color: colors.accent,
        },

        // Locked content
        lockedCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.xl,
          alignItems: 'center',
          gap: spacing.sm,
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
        },
        lockedIconWrapper: {
          width: 72,
          height: 72,
          borderRadius: radius.full,
          backgroundColor: colors.accentBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        lockedTitle: {
          ...typography.h4,
          color: colors.text,
        },
        lockedText: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        },
        disclaimerContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.xs,
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        disclaimer: {
          ...typography.caption,
          color: colors.textTertiary,
          flex: 1,
          lineHeight: 18,
        },

        // Footer
        footer: {
          padding: spacing.base,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: spacing.sm,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        consentRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          marginBottom: spacing.xs,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        checkboxChecked: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        consentLabel: {
          ...typography.caption,
          flex: 1,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        footerButtonsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        favoriteBtn: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shareBtn: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buyBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.success,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          gap: spacing.xs,
          ...Platform.select({
            ios: {
              shadowColor: colors.success,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        buyBtnDisabled: {
          opacity: 0.6,
          ...Platform.select({
            ios: {
              shadowOpacity: 0,
            },
            android: {
              elevation: 0,
            },
          }),
        },
        buyBtnText: {
          ...typography.button,
          color: colors.textOnPrimary,
        },
        purchasedBadge: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryBg,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          gap: spacing.xs,
        },
        purchasedText: {
          ...typography.button,
          color: colors.primary,
        },
        abonneBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.accentBg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          gap: spacing.xxs,
          marginLeft: spacing.sm,
        },
        abonneBadgeText: {
          ...typography.badge,
          color: colors.accent,
        },
        abonneBadgeFooter: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentBg,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          gap: spacing.xs,
        },
        abonneFooterText: {
          ...typography.button,
          color: colors.accent,
        },
        lockedBadgeFooter: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          gap: spacing.xs,
        },
        lockedFooterText: {
          ...typography.button,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

export default TicketDetailScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripeSafe } from '../hooks/useStripeSafe';

import { ticketApi } from '../api/ticket.api';
import { purchaseApi } from '../api/purchase.api';
import { useFavoriteStore } from '../store/favorite.store';
import { useConsentStore } from '../store/consent.store';
import { getErrorMessage } from '../utils/errors';
import type { RootStackParamList, TicketDto } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
  BASKETBALL: 'Basketball',
  TENNIS: 'Tennis',
  ESPORT: 'Esport',
};

const TicketDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const { initPaymentSheet, presentPaymentSheet } = useStripeSafe();

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

  const isFavorited = useFavoriteStore((s) => s.favoritedIds.has(ticketId));
  const toggleFavorite = useFavoriteStore((s) => s.toggle);
  const hydrateFavorites = useFavoriteStore((s) => s.hydrate);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ticket) return null;

  const hasAccess =
    ticket.isPurchasedByCurrentUser || ticket.isSubscribedToCreator;
  const isPrivateLocked = !ticket.isPublic && !hasAccess;
  const showSelections = !isPrivateLocked;

  const count = ticket.selectionCount ?? ticket.selections?.length ?? 0;
  const matchWord = count === 1 ? 'match' : 'matchs';
  const displayTitle = `${ticket.creatorUsername} – ${count} ${matchWord}`;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{displayTitle}</Text>
            {isPrivateLocked && (
              <View style={styles.payantBadge}>
                <Ionicons name="lock-closed" size={12} color={colors.warning} />
                <Text style={styles.payantBadgeText}>Payant</Text>
              </View>
            )}
            {!ticket.isPublic && ticket.isSubscribedToCreator && (
              <View style={styles.abonneBadge}>
                <Ionicons name="star" size={12} color={colors.warning} />
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
          <TouchableOpacity onPress={handleTipsterPress}>
            <Text style={styles.creatorLink}>@{ticket.creatorUsername}</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cote moyenne</Text>
            <Text style={styles.summaryValueBlue}>
              {ticket.avgOdds.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Confiance</Text>
            <Text style={styles.summaryValue}>
              {ticket.confidenceIndex}/10
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sélections</Text>
            <Text style={styles.summaryValue}>{count}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Statut</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: STATUS_COLORS[ticket.status] ?? colors.textSecondary },
              ]}
            >
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Résultat</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: RESULT_COLORS[ticket.result] ?? colors.textSecondary },
              ]}
            >
              {RESULT_LABELS[ticket.result] ?? ticket.result}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Visibilité</Text>
            <View style={styles.visibilityRow}>
              <Ionicons
                name={ticket.isPublic ? 'earth' : 'lock-closed'}
                size={14}
                color={ticket.isPublic ? colors.primary : colors.warning}
              />
              <Text style={styles.summaryValue}>
                {ticket.isPublic ? 'Public' : 'Privé'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sports */}
        <View style={styles.sportRow}>
          {ticket.sports.map((s) => (
            <View key={s} style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {SPORT_LABELS[s] ?? s}
              </Text>
            </View>
          ))}
        </View>

        {/* Selections — visible only if public or purchased */}
        {showSelections && (
          <>
            <Text style={styles.sectionTitle}>
              Sélections ({ticket.selections.length})
            </Text>
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
                    <Text
                      style={[
                        styles.selIndex,
                        resultColor && { backgroundColor: resultColor },
                      ]}
                    >
                      {i + 1}
                    </Text>
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
                          <Text
                            style={[styles.scoreText, { color: resultColor }]}
                          >
                            {scoreText}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  {sel.leagueName && (
                    <Text style={styles.selLeague}>{sel.leagueName}</Text>
                  )}
                  <View style={styles.selRow}>
                    <Text style={styles.selLabel}>Marché</Text>
                    <Text style={styles.selValue}>{sel.marketType}</Text>
                  </View>
                  <View style={styles.selRow}>
                    <Text style={styles.selLabel}>Sélection</Text>
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
                    <Text style={styles.selLabel}>Cote</Text>
                    <Text style={styles.oddsValue}>{sel.odds.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Locked content notice for private non-purchased */}
        {isPrivateLocked && (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={32} color={colors.warning} />
            <Text style={styles.lockedTitle}>Contenu verrouillé</Text>
            <Text style={styles.lockedText}>
              Achetez ce ticket ou abonnez-vous à{' '}
              {ticket.creatorUsername} pour voir{' '}
              {count === 1
                ? `la sélection`
                : `les ${count} sélections`}.
            </Text>
            <Text style={styles.disclaimer}>
              Ce pronostic ne garantit aucun résultat. Vous restez seul responsable de vos décisions.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        {/* Consent checkbox for private locked tickets */}
        {isPrivateLocked && !hasConsented && (
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsentChecked(!consentChecked)}
            activeOpacity={0.7}
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
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorited ? colors.danger : colors.textSecondary}
            />
          </TouchableOpacity>

          {isPrivateLocked ? (
            <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.buyBtn, buying && styles.buyBtnDisabled]}
              onPress={handleBuy}
              activeOpacity={0.7}
              disabled={buying}
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
            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={handleTipsterPress}
              activeOpacity={0.7}
            >
              <Ionicons name="star" size={18} color={colors.textOnPrimary} />
              <Text style={styles.subscribeBtnText}>{"S'abonner"}</Text>
            </TouchableOpacity>
            </View>
          ) : !ticket.isPublic && ticket.isSubscribedToCreator ? (
            <View style={styles.abonneBadgeFooter}>
              <Ionicons name="star" size={16} color={colors.warning} />
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
        },
        scroll: {
          padding: 16,
          paddingBottom: 24,
        },

        // Header
        headerCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        },
        headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        title: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
        },
        creatorLink: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.primary,
        },
        payantBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
          marginLeft: 8,
        },
        payantBadgeText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.warning,
        },
        acheteBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#E8F0FE',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
          marginLeft: 8,
        },
        acheteBadgeText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.primary,
        },

        // Summary
        summaryCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 5,
        },
        summaryLabel: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        summaryValue: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
        summaryValueBlue: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.primary,
        },
        visibilityRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },

        // Sports
        sportRow: {
          flexDirection: 'row',
          gap: 6,
          marginBottom: 16,
        },
        sportBadge: {
          backgroundColor: colors.surface,
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        sportBadgeText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },

        // Selections
        sectionTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        selCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        },
        selCardHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 6,
          gap: 8,
        },
        selIndex: {
          fontSize: 12,
          fontWeight: '800',
          color: colors.textOnPrimary,
          backgroundColor: colors.primary,
          width: 22,
          height: 22,
          borderRadius: 11,
          textAlign: 'center',
          lineHeight: 22,
          overflow: 'hidden',
          marginTop: 1,
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
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          flex: 1,
        },
        resultIcon: {
          marginLeft: 6,
        },
        matchMetaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 2,
          gap: 8,
        },
        selMatchDate: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        scoreText: {
          fontSize: 12,
          fontWeight: '700',
        },
        selLeague: {
          fontSize: 12,
          color: colors.textSecondary,
          marginBottom: 8,
          marginLeft: 30,
        },
        selRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 4,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        selRowLast: {
          borderBottomWidth: 0,
        },
        selLabel: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        selValue: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
          flexShrink: 1,
          textAlign: 'right',
          maxWidth: '60%',
        },
        oddsValue: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.primary,
        },

        // Locked content
        lockedCard: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 24,
          alignItems: 'center',
          gap: 8,
        },
        lockedTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        lockedText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        disclaimer: {
          fontSize: 11,
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: 12,
          lineHeight: 15,
        },

        // Footer
        footer: {
          padding: 16,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 12,
        },
        consentRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 4,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 4,
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
          flex: 1,
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        footerButtonsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        favoriteBtn: {
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buyBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.success,
          borderRadius: 10,
          paddingVertical: 12,
          gap: 6,
        },
        buyBtnDisabled: {
          opacity: 0.6,
        },
        buyBtnText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
        purchasedBadge: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E8F0FE',
          borderRadius: 10,
          paddingVertical: 12,
          gap: 6,
        },
        purchasedText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.primary,
        },
        footerActions: {
          flex: 1,
          flexDirection: 'row',
          gap: 8,
        },
        subscribeBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.warning,
          borderRadius: 10,
          paddingVertical: 12,
          gap: 6,
        },
        subscribeBtnText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '700',
        },
        abonneBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          gap: 4,
          marginLeft: 8,
        },
        abonneBadgeText: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.warning,
        },
        abonneBadgeFooter: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.warningLight,
          borderRadius: 10,
          paddingVertical: 12,
          gap: 6,
        },
        abonneFooterText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.warning,
        },
      }),
    [colors]
  );

export default TicketDetailScreen;

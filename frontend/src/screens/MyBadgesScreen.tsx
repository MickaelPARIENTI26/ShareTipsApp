import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { gamificationApi } from '../api/gamification.api';
import type { BadgeDto, UserBadgeDto } from '../types/gamification.types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// BADGE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════

const BADGE_REQUIREMENTS: Record<string, string> = {
  // Sales
  FirstTicketSold: 'Vendez votre premier ticket payant à un acheteur.',
  TenTicketsSold: 'Vendez 10 tickets payants.',
  TwentyFiveTicketsSold: 'Vendez 25 tickets payants.',
  FiftyTicketsSold: 'Vendez 50 tickets payants.',
  HundredTicketsSold: 'Vendez 100 tickets payants.',
  TwoHundredFiftyTicketsSold: 'Vendez 250 tickets payants.',
  FiveHundredTicketsSold: 'Vendez 500 tickets payants.',
  ThousandTicketsSold: 'Vendez 1000 tickets payants.',
  // Creation
  FirstTicketCreated: 'Créez votre premier ticket de pronostic.',
  TenTicketsCreated: 'Créez 10 tickets de pronostic.',
  FiftyTicketsCreated: 'Créez 50 tickets de pronostic.',
  HundredTicketsCreated: 'Créez 100 tickets de pronostic.',
  FiveHundredTicketsCreated: 'Créez 500 tickets de pronostic.',
  // Wins
  FirstWin: 'Gagnez votre premier ticket (résultat positif).',
  TenWins: 'Gagnez 10 tickets.',
  FiftyWins: 'Gagnez 50 tickets.',
  HundredWins: 'Gagnez 100 tickets.',
  // Win streaks
  WinStreak3: 'Gagnez 3 tickets consécutifs.',
  WinStreak5: 'Gagnez 5 tickets consécutifs.',
  WinStreak7: 'Gagnez 7 tickets consécutifs.',
  WinStreak10: 'Gagnez 10 tickets consécutifs.',
  WinStreak15: 'Gagnez 15 tickets consécutifs.',
  WinStreak20: 'Gagnez 20 tickets consécutifs.',
  // Win rate
  WinRate50: 'Atteignez un taux de réussite de 50% (min. 10 tickets).',
  WinRate60: 'Atteignez un taux de réussite de 60% (min. 20 tickets).',
  WinRate70: 'Atteignez un taux de réussite de 70% (min. 30 tickets).',
  WinRate80: 'Atteignez un taux de réussite de 80% (min. 50 tickets).',
  WinRate90: 'Atteignez un taux de réussite de 90% (min. 50 tickets).',
  // Subscribers
  FirstSubscriber: 'Obtenez votre premier abonné premium.',
  FiveSubscribers: 'Obtenez 5 abonnés premium.',
  TenSubscribers: 'Obtenez 10 abonnés premium.',
  TwentyFiveSubscribers: 'Obtenez 25 abonnés premium.',
  FiftySubscribers: 'Obtenez 50 abonnés premium.',
  HundredSubscribers: 'Obtenez 100 abonnés premium.',
  TwoHundredFiftySubscribers: 'Obtenez 250 abonnés premium.',
  FiveHundredSubscribers: 'Obtenez 500 abonnés premium.',
  ThousandSubscribers: 'Obtenez 1000 abonnés premium.',
  // Purchases
  FirstPurchase: 'Achetez votre premier ticket.',
  FivePurchases: 'Achetez 5 tickets.',
  TenPurchases: 'Achetez 10 tickets.',
  TwentyFivePurchases: 'Achetez 25 tickets.',
  FiftyPurchases: 'Achetez 50 tickets.',
  HundredPurchases: 'Achetez 100 tickets.',
  // Engagement
  FirstFollow: 'Suivez votre premier tipster.',
  FiveFollows: 'Suivez 5 tipsters.',
  TenFollows: 'Suivez 10 tipsters.',
  TwentyFiveFollows: 'Suivez 25 tipsters.',
  FiftyFollows: 'Suivez 50 tipsters.',
  FirstFavorite: 'Ajoutez un ticket à vos favoris.',
  FiveFavorites: 'Ajoutez 5 tickets à vos favoris.',
  TenFavorites: 'Ajoutez 10 tickets à vos favoris.',
  TwentyFiveFavorites: 'Ajoutez 25 tickets à vos favoris.',
  FiftyFavorites: 'Ajoutez 50 tickets à vos favoris.',
  // Daily streak
  DailyStreak3: 'Connectez-vous 3 jours consécutifs.',
  DailyStreak7: 'Connectez-vous 7 jours consécutifs.',
  DailyStreak14: 'Connectez-vous 14 jours consécutifs.',
  DailyStreak30: 'Connectez-vous 30 jours consécutifs.',
  DailyStreak60: 'Connectez-vous 60 jours consécutifs.',
  DailyStreak100: 'Connectez-vous 100 jours consécutifs.',
  DailyStreak365: 'Connectez-vous 365 jours consécutifs.',
  // Levels
  Level5: 'Atteignez le niveau 5.',
  Level10: 'Atteignez le niveau 10.',
  Level15: 'Atteignez le niveau 15.',
  Level20: 'Atteignez le niveau 20.',
  Level25: 'Atteignez le niveau 25.',
  Level30: 'Atteignez le niveau 30.',
  Level40: 'Atteignez le niveau 40.',
  Level50: 'Atteignez le niveau 50.',
  // XP
  Xp1000: 'Accumulez 1 000 XP au total.',
  Xp5000: 'Accumulez 5 000 XP au total.',
  Xp10000: 'Accumulez 10 000 XP au total.',
  Xp25000: 'Accumulez 25 000 XP au total.',
  Xp50000: 'Accumulez 50 000 XP au total.',
  Xp100000: 'Accumulez 100 000 XP au total.',
  // Special
  EarlyAdopter: 'Inscrivez-vous pendant la phase de lancement.',
  BetaTester: 'Participez au programme de beta test.',
  Verified: 'Faites vérifier votre profil par l\'équipe.',
  Premium: 'Souscrivez à un abonnement premium.',
  Ambassador: 'Devenez ambassadeur de la plateforme.',
  Legend: 'Accomplissez des exploits exceptionnels.',
};

// ═══════════════════════════════════════════════════════════════
// BADGE CATEGORIES
// ═══════════════════════════════════════════════════════════════

const BADGE_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  sales: {
    label: 'Ventes',
    types: ['FirstTicketSold', 'TenTicketsSold', 'TwentyFiveTicketsSold', 'FiftyTicketsSold', 'HundredTicketsSold', 'TwoHundredFiftyTicketsSold', 'FiveHundredTicketsSold', 'ThousandTicketsSold'],
  },
  creation: {
    label: 'Création',
    types: ['FirstTicketCreated', 'TenTicketsCreated', 'FiftyTicketsCreated', 'HundredTicketsCreated', 'FiveHundredTicketsCreated'],
  },
  wins: {
    label: 'Victoires',
    types: ['FirstWin', 'TenWins', 'FiftyWins', 'HundredWins'],
  },
  winStreaks: {
    label: 'Séries de wins',
    types: ['WinStreak3', 'WinStreak5', 'WinStreak7', 'WinStreak10', 'WinStreak15', 'WinStreak20'],
  },
  winRate: {
    label: 'Taux de réussite',
    types: ['WinRate50', 'WinRate60', 'WinRate70', 'WinRate80', 'WinRate90'],
  },
  subscribers: {
    label: 'Abonnés',
    types: ['FirstSubscriber', 'FiveSubscribers', 'TenSubscribers', 'TwentyFiveSubscribers', 'FiftySubscribers', 'HundredSubscribers', 'TwoHundredFiftySubscribers', 'FiveHundredSubscribers', 'ThousandSubscribers'],
  },
  purchases: {
    label: 'Achats',
    types: ['FirstPurchase', 'FivePurchases', 'TenPurchases', 'TwentyFivePurchases', 'FiftyPurchases', 'HundredPurchases'],
  },
  engagement: {
    label: 'Engagement',
    types: ['FirstFollow', 'FiveFollows', 'TenFollows', 'TwentyFiveFollows', 'FiftyFollows', 'FirstFavorite', 'FiveFavorites', 'TenFavorites', 'TwentyFiveFavorites', 'FiftyFavorites'],
  },
  dailyStreak: {
    label: 'Connexions',
    types: ['DailyStreak3', 'DailyStreak7', 'DailyStreak14', 'DailyStreak30', 'DailyStreak60', 'DailyStreak100', 'DailyStreak365'],
  },
  levels: {
    label: 'Niveaux',
    types: ['Level5', 'Level10', 'Level15', 'Level20', 'Level25', 'Level30', 'Level40', 'Level50'],
  },
  xp: {
    label: 'XP',
    types: ['Xp1000', 'Xp5000', 'Xp10000', 'Xp25000', 'Xp50000', 'Xp100000'],
  },
  special: {
    label: 'Spéciaux',
    types: ['EarlyAdopter', 'BetaTester', 'Verified', 'Premium', 'Ambassador', 'Legend'],
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const MyBadgesScreen: React.FC = () => {
  const [allBadges, setAllBadges] = useState<BadgeDto[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadgeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ badge: BadgeDto; earned: boolean } | null>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadBadges();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadBadges = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        gamificationApi.getAllBadges(),
        gamificationApi.getMyBadges(),
      ]);
      setAllBadges(allRes.data);
      setMyBadges(myRes.data);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const earnedTypes = useMemo(() => new Set(myBadges.map(b => b.type)), [myBadges]);

  const categorizedBadges = useMemo(() => {
    const result: Record<string, { badge: BadgeDto; earned: boolean }[]> = {};

    for (const [key, category] of Object.entries(BADGE_CATEGORIES)) {
      const badges = allBadges
        .filter(b => category.types.includes(b.type))
        .map(badge => ({
          badge,
          earned: earnedTypes.has(badge.type),
        }));

      if (badges.length > 0) {
        result[key] = badges;
      }
    }

    return result;
  }, [allBadges, earnedTypes]);

  const stats = useMemo(() => ({
    earned: myBadges.length,
    total: allBadges.length,
  }), [myBadges, allBadges]);

  const getEarnedDate = (badgeType: string): string | null => {
    const userBadge = myBadges.find(b => b.type === badgeType);
    if (userBadge?.earnedAt) {
      return new Date(userBadge.earnedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return null;
  };

  const renderBadge = (item: { badge: BadgeDto; earned: boolean }) => {
    const { badge, earned } = item;
    return (
      <TouchableOpacity
        key={badge.id}
        style={[styles.badgeItem, !earned && styles.badgeLocked]}
        onPress={() => setSelectedBadge(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.badgeIcon, { backgroundColor: earned ? badge.color + '20' : DS.colors.cardBorder }]}>
          <Ionicons
            name={badge.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={earned ? badge.color : DS.colors.textSecondary}
          />
          {earned && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={14} color={DS.colors.greenLight} />
            </View>
          )}
        </View>
        <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={2}>
          {badge.name}
        </Text>
        <Text style={styles.badgeXp}>+{badge.xpReward} XP</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DS.colors.green} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Header */}
      <Animated.View
        style={[
          styles.statsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.earned}</Text>
          <Text style={styles.statLabel}>Obtenus</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Complété</Text>
        </View>
      </Animated.View>

      {/* Category Filters */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          {Object.entries(BADGE_CATEGORIES).map(([key, cat]) => (
            <TouchableOpacity
              key={key}
              style={[styles.categoryChip, selectedCategory === key && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(key)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === key && styles.categoryChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Badge Grid by Category */}
      {Object.entries(categorizedBadges)
        .filter(([key]) => !selectedCategory || key === selectedCategory)
        .map(([key, badges]) => (
          <Animated.View
            key={key}
            style={[
              styles.categorySection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                <Ionicons name="ribbon-outline" size={16} color={DS.colors.green} />
              </View>
              <Text style={styles.categoryTitle}>{BADGE_CATEGORIES[key].label}</Text>
            </View>
            <View style={styles.badgeGrid}>
              {badges.map(renderBadge)}
            </View>
          </Animated.View>
        ))}

      {/* Badge Detail Modal */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBadge(null)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {selectedBadge && (
              <>
                {/* Badge Icon */}
                <View
                  style={[
                    styles.modalBadgeIcon,
                    {
                      backgroundColor: selectedBadge.earned
                        ? selectedBadge.badge.color + '20'
                        : DS.colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedBadge.badge.icon as keyof typeof Ionicons.glyphMap}
                    size={48}
                    color={selectedBadge.earned ? selectedBadge.badge.color : DS.colors.textSecondary}
                  />
                </View>

                {/* Badge Name */}
                <Text style={styles.modalBadgeName}>{selectedBadge.badge.name}</Text>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: selectedBadge.earned
                        ? 'rgba(74, 222, 128, 0.15)'
                        : DS.colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedBadge.earned ? 'checkmark-circle' : 'lock-closed'}
                    size={14}
                    color={selectedBadge.earned ? DS.colors.greenLight : DS.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: selectedBadge.earned ? DS.colors.greenLight : DS.colors.textSecondary },
                    ]}
                  >
                    {selectedBadge.earned ? 'Obtenu' : 'Non obtenu'}
                  </Text>
                </View>

                {/* Earned Date */}
                {selectedBadge.earned && getEarnedDate(selectedBadge.badge.type) && (
                  <Text style={styles.earnedDate}>
                    Obtenu le {getEarnedDate(selectedBadge.badge.type)}
                  </Text>
                )}

                {/* Description */}
                <Text style={styles.modalDescription}>
                  {selectedBadge.badge.description}
                </Text>

                {/* How to unlock */}
                <View style={styles.requirementSection}>
                  <View style={styles.requirementHeader}>
                    <Ionicons name="bulb-outline" size={18} color={DS.colors.green} />
                    <Text style={styles.requirementTitle}>
                      {selectedBadge.earned ? 'Comment vous l\'avez obtenu' : 'Comment l\'obtenir'}
                    </Text>
                  </View>
                  <Text style={styles.requirementText}>
                    {BADGE_REQUIREMENTS[selectedBadge.badge.type] || selectedBadge.badge.description}
                  </Text>
                </View>

                {/* XP Reward */}
                <View style={styles.xpRewardSection}>
                  <Ionicons name="flash" size={20} color={DS.colors.green} />
                  <Text style={styles.xpRewardText}>
                    {selectedBadge.earned ? 'Récompense obtenue' : 'Récompense'}: +{selectedBadge.badge.xpReward} XP
                  </Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedBadge(null)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: DS.colors.textSecondary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DS.colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: DS.colors.cardBorder,
    marginHorizontal: 16,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: DS.colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: DS.colors.green,
    borderColor: DS.colors.green,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: DS.colors.white,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    width: '22%',
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 10,
  },
  badgeName: {
    fontSize: 11,
    color: DS.colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeNameLocked: {
    color: DS.colors.textSecondary,
  },
  badgeXp: {
    fontSize: 10,
    color: DS.colors.green,
    marginTop: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalBadgeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: '700',
    color: DS.colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  earnedDate: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  requirementSection: {
    backgroundColor: DS.colors.background,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
  },
  requirementText: {
    fontSize: 13,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
  xpRewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  xpRewardText: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.green,
  },
  closeButton: {
    backgroundColor: DS.colors.green,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
});

export default MyBadgesScreen;

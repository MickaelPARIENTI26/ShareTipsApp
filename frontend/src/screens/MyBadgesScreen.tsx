import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../theme';
import { gamificationApi } from '../api/gamification.api';
import type { BadgeDto, UserBadgeDto } from '../types/gamification.types';

// Badge unlock requirements explanations
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

// Badge categories for grouping
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

const MyBadgesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [allBadges, setAllBadges] = useState<BadgeDto[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadgeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ badge: BadgeDto; earned: boolean } | null>(null);

  useEffect(() => {
    loadBadges();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderBadge = (item: { badge: BadgeDto; earned: boolean }) => {
    const { badge, earned } = item;
    return (
      <TouchableOpacity
        key={badge.id}
        style={[styles.badgeItem, !earned && styles.badgeLocked]}
        onPress={() => setSelectedBadge(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.badgeIcon, { backgroundColor: earned ? badge.color + '20' : colors.border }]}>
          <Ionicons
            name={badge.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={earned ? badge.color : colors.textSecondary}
          />
          {earned && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Header */}
      <View style={styles.statsCard}>
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
          <Text style={styles.statValue}>{Math.round((stats.earned / stats.total) * 100)}%</Text>
          <Text style={styles.statLabel}>Complété</Text>
        </View>
      </View>

      {/* Category Filters */}
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

      {/* Badge Grid by Category */}
      {Object.entries(categorizedBadges)
        .filter(([key]) => !selectedCategory || key === selectedCategory)
        .map(([key, badges]) => (
          <View key={key} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{BADGE_CATEGORIES[key].label}</Text>
            <View style={styles.badgeGrid}>
              {badges.map(renderBadge)}
            </View>
          </View>
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
                        : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedBadge.badge.icon as keyof typeof Ionicons.glyphMap}
                    size={48}
                    color={selectedBadge.earned ? selectedBadge.badge.color : colors.textSecondary}
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
                        ? '#34C75920'
                        : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedBadge.earned ? 'checkmark-circle' : 'lock-closed'}
                    size={14}
                    color={selectedBadge.earned ? '#34C759' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: selectedBadge.earned ? '#34C759' : colors.textSecondary },
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
                    <Ionicons name="bulb-outline" size={18} color={colors.primary} />
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
                  <Ionicons name="flash" size={20} color={colors.primary} />
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

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    statsCard: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    categoryScroll: {
      marginBottom: 16,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.cardBackground,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: colors.textOnPrimary,
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
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
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      position: 'relative',
    },
    checkmark: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
    },
    badgeName: {
      fontSize: 11,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    badgeNameLocked: {
      color: colors.textSecondary,
    },
    badgeXp: {
      fontSize: 10,
      color: colors.primary,
      marginTop: 2,
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    modalBadgeIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalBadgeName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
      marginBottom: 8,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
    },
    earnedDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    requirementSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
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
      color: colors.text,
    },
    requirementText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
      color: colors.primary,
    },
    closeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default MyBadgesScreen;

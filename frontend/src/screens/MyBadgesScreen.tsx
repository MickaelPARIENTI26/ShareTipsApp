import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../theme';
import { gamificationApi } from '../api/gamification.api';
import type { BadgeDto, UserBadgeDto } from '../types/gamification.types';

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
      <View
        key={badge.id}
        style={[styles.badgeItem, !earned && styles.badgeLocked]}
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
      </View>
    );
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
  });

export default MyBadgesScreen;

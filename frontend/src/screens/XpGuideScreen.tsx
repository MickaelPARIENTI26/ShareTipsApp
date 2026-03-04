import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface XpAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  xp: number;
  description: string;
  category: 'tipster' | 'buyer' | 'engagement' | 'bonus';
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const XP_ACTIONS: XpAction[] = [
  // Tipster actions
  { icon: 'create', label: 'Créer un ticket', xp: 10, description: 'Chaque ticket publié', category: 'tipster' },
  { icon: 'cart', label: 'Vendre un ticket', xp: 25, description: 'Quand quelqu\'un achète votre ticket', category: 'tipster' },
  { icon: 'checkmark-circle', label: 'Ticket gagnant', xp: 50, description: 'Quand votre ticket est validé gagnant', category: 'tipster' },
  { icon: 'close-circle', label: 'Ticket perdant', xp: -10, description: 'Quand votre ticket est validé perdant', category: 'tipster' },
  { icon: 'flame', label: 'Bonus série gagnante', xp: 20, description: 'Par win consécutif (x2, x3...)', category: 'tipster' },
  { icon: 'person-add', label: 'Nouvel abonné', xp: 30, description: 'Quand quelqu\'un s\'abonne à vous', category: 'tipster' },
  { icon: 'cash', label: 'Gains (par 10€)', xp: 5, description: 'XP bonus sur vos revenus', category: 'tipster' },

  // Buyer actions
  { icon: 'bag', label: 'Acheter un ticket', xp: 15, description: 'À chaque achat de ticket', category: 'buyer' },
  { icon: 'ribbon', label: 'S\'abonner', xp: 20, description: 'Nouvel abonnement à un tipster', category: 'buyer' },
  { icon: 'trophy', label: 'Ticket acheté gagnant', xp: 10, description: 'Bonus quand votre achat est gagnant', category: 'buyer' },

  // Engagement
  { icon: 'calendar', label: 'Connexion quotidienne', xp: 5, description: 'Se connecter chaque jour', category: 'engagement' },
  { icon: 'flame', label: 'Bonus streak (par jour)', xp: 2, description: '+2 XP par jour de streak', category: 'engagement' },
  { icon: 'heart', label: 'Suivre un tipster', xp: 3, description: 'Chaque nouveau follow', category: 'engagement' },
  { icon: 'bookmark', label: 'Ajouter en favoris', xp: 2, description: 'Mettre un ticket en favoris', category: 'engagement' },
  { icon: 'share-social', label: 'Partager un ticket', xp: 5, description: 'Partager sur les réseaux', category: 'engagement' },

  // Bonus
  { icon: 'ribbon', label: 'Badge obtenu', xp: 25, description: 'XP bonus + XP du badge', category: 'bonus' },
  { icon: 'arrow-up-circle', label: 'Level up', xp: 50, description: 'Bonus à chaque niveau', category: 'bonus' },
  { icon: 'person', label: 'Profil complété', xp: 100, description: 'Bonus unique', category: 'bonus' },
  { icon: 'gift', label: 'Parrainage', xp: 200, description: 'Inviter un ami', category: 'bonus' },
];

const CATEGORIES = {
  tipster: { label: 'Actions Tipster', color: DS.colors.green },
  buyer: { label: 'Actions Acheteur', color: '#3B82F6' },
  engagement: { label: 'Engagement', color: '#8B5CF6' },
  bonus: { label: 'Bonus', color: '#F59E0B' },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const XpGuideScreen: React.FC = () => {
  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

  const renderCategory = (category: keyof typeof CATEGORIES) => {
    const actions = XP_ACTIONS.filter(a => a.category === category);
    const { label, color } = CATEGORIES[category];

    return (
      <Animated.View
        key={category}
        style={[
          styles.categorySection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: color + '20' }]}>
            <View style={[styles.categoryDot, { backgroundColor: color }]} />
          </View>
          <Text style={styles.categoryTitle}>{label}</Text>
        </View>

        {actions.map((action, index) => (
          <View key={index} style={styles.actionRow}>
            <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={action.icon} size={20} color={color} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <View style={[styles.xpBadge, action.xp < 0 && styles.xpBadgeNegative]}>
              <Text style={[styles.actionXp, action.xp < 0 && styles.actionXpNegative]}>
                {action.xp > 0 ? '+' : ''}{action.xp}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <Animated.View
        style={[
          styles.infoCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.infoIconWrapper}>
          <Ionicons name="sparkles" size={28} color={DS.colors.green} />
        </View>
        <Text style={styles.infoTitle}>{"Comment gagner de l'XP ?"}</Text>
        <Text style={styles.infoText}>
          {"L'XP vous permet de monter en niveau et de débloquer des badges. Plus vous êtes actif, plus vous progressez !"}
        </Text>
      </Animated.View>

      {/* Level Info */}
      <Animated.View
        style={[
          styles.levelCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.levelHeader}>
          <View style={styles.levelIconContainer}>
            <Ionicons name="trending-up" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.levelTitle}>Progression des niveaux</Text>
        </View>
        <View style={styles.levelContent}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Niveau 1 → 10</Text>
            <Text style={styles.levelXp}>50 - 700 XP</Text>
          </View>
          <View style={styles.levelDivider} />
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Niveau 11 → 20</Text>
            <Text style={styles.levelXp}>850 - 5,500 XP</Text>
          </View>
          <View style={styles.levelDivider} />
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Niveau 21 → 30</Text>
            <Text style={styles.levelXp}>7,500 - 40,000 XP</Text>
          </View>
          <View style={styles.levelDivider} />
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Niveau 31 → 40</Text>
            <Text style={styles.levelXp}>55,000 - 350,000 XP</Text>
          </View>
          <View style={styles.levelDivider} />
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Niveau 41 → 50 (MAX)</Text>
            <Text style={styles.levelXp}>450,000 - 1,600,000 XP</Text>
          </View>
        </View>
      </Animated.View>

      {/* XP Actions by Category */}
      {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(renderCategory)}
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
  infoCard: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 140, 78, 0.2)',
  },
  infoIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(45, 140, 78, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  levelCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
  },
  levelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
  levelContent: {
    padding: 14,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  levelDivider: {
    height: 1,
    backgroundColor: DS.colors.cardBorder,
  },
  levelLabel: {
    fontSize: 13,
    color: DS.colors.white,
  },
  levelXp: {
    fontSize: 13,
    color: DS.colors.green,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.white,
  },
  actionDescription: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: DS.colors.greenBgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  actionXp: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.colors.green,
  },
  actionXpNegative: {
    color: '#EF4444',
  },
});

export default XpGuideScreen;

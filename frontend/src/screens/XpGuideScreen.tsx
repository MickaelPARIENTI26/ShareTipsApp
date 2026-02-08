import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../theme';

interface XpAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  xp: number;
  description: string;
  category: 'tipster' | 'buyer' | 'engagement' | 'bonus';
}

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
  tipster: { label: 'Actions Tipster', color: '#FF9500' },
  buyer: { label: 'Actions Acheteur', color: '#5856D6' },
  engagement: { label: 'Engagement', color: '#34C759' },
  bonus: { label: 'Bonus', color: '#FFD700' },
};

const XpGuideScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const renderCategory = (category: keyof typeof CATEGORIES) => {
    const actions = XP_ACTIONS.filter(a => a.category === category);
    const { label, color } = CATEGORIES[category];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryDot, { backgroundColor: color }]} />
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
            <Text style={[styles.actionXp, action.xp < 0 && styles.actionXpNegative]}>
              {action.xp > 0 ? '+' : ''}{action.xp} XP
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.infoCard}>
        <Ionicons name="sparkles" size={24} color={colors.primary} />
        <Text style={styles.infoTitle}>Comment gagner de l'XP ?</Text>
        <Text style={styles.infoText}>
          L'XP vous permet de monter en niveau et de débloquer des badges.
          Plus vous êtes actif, plus vous progressez !
        </Text>
      </View>

      {/* Level Info */}
      <View style={styles.levelCard}>
        <Text style={styles.levelTitle}>Progression des niveaux</Text>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Niveau 1 → 10</Text>
          <Text style={styles.levelXp}>50 - 700 XP</Text>
        </View>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Niveau 11 → 20</Text>
          <Text style={styles.levelXp}>850 - 5,500 XP</Text>
        </View>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Niveau 21 → 30</Text>
          <Text style={styles.levelXp}>7,500 - 40,000 XP</Text>
        </View>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Niveau 31 → 40</Text>
          <Text style={styles.levelXp}>55,000 - 350,000 XP</Text>
        </View>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Niveau 41 → 50 (MAX)</Text>
          <Text style={styles.levelXp}>450,000 - 1,600,000 XP</Text>
        </View>
      </View>

      {/* XP Actions by Category */}
      {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(renderCategory)}
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
    infoCard: {
      backgroundColor: colors.primary + '15',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    levelCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    levelTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    levelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    levelLabel: {
      fontSize: 14,
      color: colors.text,
    },
    levelXp: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
      color: colors.text,
    },
    actionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionXp: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    actionXpNegative: {
      color: '#FF3B30',
    },
  });

export default XpGuideScreen;

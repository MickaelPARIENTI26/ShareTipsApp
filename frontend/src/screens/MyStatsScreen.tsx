import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../theme/designSystem';

const MyStatsScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mes Statistiques</Text>
        <Text style={styles.subtitle}>Analyse de tes performances</Text>
      </View>

      {/* Placeholder Card */}
      <View style={styles.placeholderCard}>
        <View style={styles.placeholderIconContainer}>
          <Ionicons name="construct-outline" size={48} color={DS.colors.textSecondary} />
        </View>
        <Text style={styles.placeholderTitle}>Page en construction</Text>
        <Text style={styles.placeholderText}>
          Tes statistiques détaillées s'afficheront ici prochainement
        </Text>
      </View>

      {/* Coming Soon Features */}
      <View style={styles.comingSoonSection}>
        <Text style={styles.sectionTitle}>Bientôt disponible</Text>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="trending-up" size={20} color={DS.colors.green} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Évolution du ROI</Text>
            <Text style={styles.featureDescription}>Graphique de ta progression</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="pie-chart" size={20} color={DS.colors.green} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Répartition par sport</Text>
            <Text style={styles.featureDescription}>Analyse de tes paris préférés</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="calendar" size={20} color={DS.colors.green} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Historique complet</Text>
            <Text style={styles.featureDescription}>Tous tes résultats mois par mois</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
  },
  placeholderCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DS.colors.white,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonSection: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
  },
  featureDescription: {
    fontSize: 13,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
});

export default MyStatsScreen;

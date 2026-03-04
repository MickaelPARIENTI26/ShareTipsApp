import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DS } from '../theme/designSystem';

const AboutScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo and App Name */}
      <View style={styles.header}>
        <LinearGradient
          colors={[DS.colors.green, '#1E5C34']}
          style={styles.logoContainer}
        >
          <Text style={styles.logoText}>ST</Text>
        </LinearGradient>
        <Text style={styles.appName}>ShareTips</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.description}>
          {"ShareTips est une plateforme innovante de partage de pronostics sportifs qui connecte les tipsters passionnés avec une communauté d'utilisateurs à la recherche de conseils avisés."}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOS FONCTIONNALITÉS</Text>

        <View style={styles.featureCard}>
          <FeatureItem
            icon="trophy"
            title="Tipsters vérifiés"
            description="Suivez les meilleurs pronostiqueurs avec des statistiques transparentes"
          />
          <FeatureItem
            icon="shield-checkmark"
            title="Transactions sécurisées"
            description="Paiements sécurisés via Stripe pour vos achats et abonnements"
          />
          <FeatureItem
            icon="stats-chart"
            title="Statistiques détaillées"
            description="Analysez les performances avec des métriques complètes"
          />
          <FeatureItem
            icon="ribbon"
            title="Système de badges"
            description="Gagnez des récompenses et montez en niveau"
            isLast
          />
        </View>
      </View>

      {/* Values */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOS VALEURS</Text>

        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <View style={styles.valueIcon}>
              <Ionicons name="eye-outline" size={20} color={DS.colors.green} />
            </View>
            <Text style={styles.valueText}>Transparence</Text>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueIcon}>
              <Ionicons name="people-outline" size={20} color={DS.colors.green} />
            </View>
            <Text style={styles.valueText}>Communauté</Text>
          </View>
          <View style={styles.valueItem}>
            <View style={styles.valueIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={DS.colors.green} />
            </View>
            <Text style={styles.valueText}>Sécurité</Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle" size={20} color={DS.colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          ShareTips est une plateforme de partage de pronostics. Nous ne proposons pas de paris et ne garantissons aucun résultat.
        </Text>
      </View>
    </ScrollView>
  );
};

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isLast?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, isLast }) => (
  <View style={[styles.featureItem, !isLast && styles.featureItemBorder]}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={22} color={DS.colors.green} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

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
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: DS.colors.white,
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: DS.colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    color: DS.colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  featureCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
  valuesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  valueItem: {
    flex: 1,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: DS.colors.white,
    textAlign: 'center',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
});

export default AboutScreen;

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../theme/designSystem';

const ContactScreen: React.FC = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@sharetips.com');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={32} color={DS.colors.green} />
        </View>
        <Text style={styles.title}>Contactez-nous</Text>
        <Text style={styles.subtitle}>
          Une question, un problème ou une suggestion ? Notre équipe est là pour vous aider.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PAR EMAIL</Text>
        <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress} activeOpacity={0.8}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail-outline" size={24} color={DS.colors.green} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>contact@sharetips.com</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={DS.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DÉLAI DE RÉPONSE</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={DS.colors.textSecondary} />
            <Text style={styles.infoText}>
              Nous répondons généralement sous 24 à 48 heures ouvrées.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AVANT DE NOUS CONTACTER</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="help-circle-outline" size={20} color={DS.colors.textSecondary} />
            <Text style={styles.infoText}>
              Consultez notre FAQ pour trouver une réponse rapide à vos questions les plus courantes.
            </Text>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: DS.colors.textSecondary,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: DS.colors.textSecondary,
    lineHeight: 20,
  },
});

export default ContactScreen;

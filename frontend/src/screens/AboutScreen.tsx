import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DS } from '../theme/designSystem';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={DS.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Logo + Name */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logos/logo_wbg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>ShareTips</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.description}>
            ShareTips est la plateforme qui connecte les passionnés de sport et les tipsters.
            Partagez vos pronostics, suivez les meilleurs analystes et améliorez votre expérience sportive.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fonctionnalités</Text>
          {[
            { icon: 'document-text', text: 'Créez et partagez vos pronostics' },
            { icon: 'cart', text: 'Achetez les meilleurs tips' },
            { icon: 'trophy', text: 'Classement des tipsters' },
            { icon: 'stats-chart', text: 'Statistiques détaillées' },
            { icon: 'ribbon', text: 'Système de niveaux et badges' },
            { icon: 'wallet', text: 'Monétisez votre expertise' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={DS.colors.green} />
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Équipe</Text>
          <Text style={styles.teamText}>
            Développé avec passion par l'équipe ShareTips.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.copyright}>© 2026 ShareTips. Tous droits réservés.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: DS.colors.cardBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DS.colors.white },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginVertical: 24 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  appName: { fontSize: 28, fontWeight: '800', color: DS.colors.white, marginTop: 12 },
  version: { fontSize: 14, color: DS.colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: DS.colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: DS.colors.cardBorder,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: DS.colors.white, marginBottom: 12 },
  description: { fontSize: 15, color: DS.colors.textSecondary, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  featureText: { fontSize: 14, color: DS.colors.white },
  teamText: { fontSize: 14, color: DS.colors.textSecondary, lineHeight: 20 },
  copyright: { fontSize: 12, color: DS.colors.textSecondary, textAlign: 'center', marginTop: 24, opacity: 0.5 },
});

export default AboutScreen;

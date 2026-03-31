import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DS } from '../theme/designSystem';

const ContactScreen: React.FC = () => {
  const navigation = useNavigation();

  const contactItems = [
    {
      icon: 'mail-outline' as const,
      label: 'Email',
      value: 'contact@sharetips.app',
      onPress: () => Linking.openURL('mailto:contact@sharetips.app'),
    },
    {
      icon: 'logo-instagram' as const,
      label: 'Instagram',
      value: '@sharetips.app',
      onPress: () => Linking.openURL('https://instagram.com/sharetips.app'),
    },
    {
      icon: 'logo-twitter' as const,
      label: 'X (Twitter)',
      value: '@ShareTipsApp',
      onPress: () => Linking.openURL('https://x.com/ShareTipsApp'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={DS.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contactez-nous</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Ionicons name="chatbubbles" size={48} color={DS.colors.green} />
          <Text style={styles.heroTitle}>Une question ?</Text>
          <Text style={styles.heroSubtitle}>
            Notre équipe est disponible pour répondre à toutes vos questions.
          </Text>
        </View>

        {contactItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.contactItem} onPress={item.onPress} activeOpacity={0.7}>
            <View style={styles.contactIcon}>
              <Ionicons name={item.icon} size={24} color={DS.colors.green} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{item.label}</Text>
              <Text style={styles.contactValue}>{item.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DS.colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={styles.responseTime}>
          <Ionicons name="time-outline" size={16} color={DS.colors.textSecondary} />
          <Text style={styles.responseTimeText}>Temps de réponse moyen : 24h</Text>
        </View>
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
  heroCard: {
    backgroundColor: DS.colors.cardBg, borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: DS.colors.cardBorder,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: DS.colors.white, marginTop: 16 },
  heroSubtitle: { fontSize: 14, color: DS.colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: DS.colors.cardBg,
    borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: DS.colors.cardBorder,
  },
  contactIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 13, fontWeight: '500', color: DS.colors.textSecondary },
  contactValue: { fontSize: 16, fontWeight: '600', color: DS.colors.white, marginTop: 2 },
  responseTime: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24, opacity: 0.6,
  },
  responseTimeText: { fontSize: 13, color: DS.colors.textSecondary },
});

export default ContactScreen;

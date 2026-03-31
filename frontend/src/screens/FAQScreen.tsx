import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DS } from '../theme/designSystem';

const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que ShareTips ?",
    a: "ShareTips est une plateforme de partage de pronostics sportifs. Les tipsters partagent leurs analyses et les utilisateurs peuvent acheter ou consulter gratuitement ces pronostics.",
  },
  {
    q: "Comment créer un ticket ?",
    a: "Rendez-vous dans l'onglet Matchs, sélectionnez vos paris, définissez votre niveau de confiance et publiez votre ticket. Vous pouvez le rendre gratuit ou payant.",
  },
  {
    q: "Comment acheter un ticket ?",
    a: "Dans la Marketplace, parcourez les tickets disponibles. Les tickets gratuits sont accessibles directement. Pour les tickets payants, cliquez sur 'Acheter' et procédez au paiement sécurisé via Stripe.",
  },
  {
    q: "Comment fonctionne le classement ?",
    a: "Le classement est basé sur le ROI (retour sur investissement) de vos pronostics sur la période sélectionnée (jour, semaine, mois). Plus votre taux de réussite et vos cotes sont élevés, mieux vous êtes classé.",
  },
  {
    q: "Comment gagner de l'argent ?",
    a: "Créez des tickets payants avec de bons pronostics. Quand d'autres utilisateurs achètent vos tickets, les revenus sont crédités sur votre wallet. Vous pouvez aussi créer des abonnements.",
  },
  {
    q: "Comment fonctionne le système de niveaux ?",
    a: "Vous gagnez de l'XP en créant des tickets, en vous connectant quotidiennement, en gagnant des paris, etc. L'XP vous fait monter de niveau et débloquer des badges.",
  },
  {
    q: "ShareTips est-il un site de paris ?",
    a: "Non. ShareTips est une plateforme de partage de pronostics. Nous ne collectons pas de mises et ne redistribuons pas de gains de paris. Vous restez seul responsable de vos décisions.",
  },
  {
    q: "Comment retirer mes gains ?",
    a: "Depuis votre Wallet, cliquez sur 'Retirer'. Le montant sera transféré sur votre compte bancaire via Stripe Connect. Un minimum de retrait peut s'appliquer.",
  },
];

const FAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const [expanded, setExpanded] = React.useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={DS.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {FAQ_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Text style={styles.question}>{item.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={DS.colors.green}
              />
            </View>
            {expanded === i && <Text style={styles.answer}>{item.a}</Text>}
          </TouchableOpacity>
        ))}
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
  faqItem: {
    backgroundColor: DS.colors.cardBg, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: DS.colors.cardBorder,
  },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 15, fontWeight: '600', color: DS.colors.white, flex: 1, marginRight: 12 },
  answer: { fontSize: 14, color: DS.colors.textSecondary, marginTop: 12, lineHeight: 20 },
});

export default FAQScreen;

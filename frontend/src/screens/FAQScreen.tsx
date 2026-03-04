import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../theme/designSystem';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Qu'est-ce que ShareTips ?",
    answer: "ShareTips est une plateforme de partage de pronostics sportifs. Les tipsters peuvent créer et vendre leurs pronostics, tandis que les utilisateurs peuvent acheter ces pronostics ou s'abonner à leurs tipsters préférés.",
  },
  {
    question: "Comment créer un pronostic ?",
    answer: "Pour créer un pronostic, allez dans l'onglet Matchs, sélectionnez un match, choisissez vos sélections, puis validez votre ticket. Vous pourrez ensuite le publier en mode public (gratuit ou payant) ou privé.",
  },
  {
    question: "Comment fonctionne le système d'abonnement ?",
    answer: "Les tipsters peuvent créer des plans d'abonnement avec différentes durées et prix. Les abonnés ont accès à tous les pronostics du tipster pendant la durée de leur abonnement.",
  },
  {
    question: "Comment retirer mes gains ?",
    answer: "Rendez-vous dans votre Portefeuille depuis votre profil. Vous pouvez demander un virement vers votre compte bancaire une fois que vous avez configuré votre compte Stripe.",
  },
  {
    question: "Que signifie le ROI ?",
    answer: "Le ROI (Return On Investment) représente le retour sur investissement. Un ROI positif signifie que les pronostics sont globalement gagnants sur la période analysée.",
  },
  {
    question: "Comment fonctionne le système de badges ?",
    answer: "Les badges récompensent vos accomplissements sur la plateforme : nombre de pronostics créés, taux de réussite, fidélité, etc. Plus vous êtes actif, plus vous débloquez de badges !",
  },
  {
    question: "Puis-je annuler un abonnement ?",
    answer: "Oui, vous pouvez annuler un abonnement à tout moment. L'accès restera actif jusqu'à la fin de la période payée, mais le renouvellement automatique sera désactivé.",
  },
  {
    question: "Comment signaler un problème ?",
    answer: "Vous pouvez nous contacter via la page Contact accessible depuis l'écran Information. Notre équipe répondra sous 24 à 48 heures.",
  },
];

const FAQScreen: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Questions fréquentes</Text>
        <Text style={styles.subtitle}>
          Trouvez rapidement les réponses à vos questions
        </Text>
      </View>

      <View style={styles.faqList}>
        {faqData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.faqItem,
              expandedIndex === index && styles.faqItemExpanded,
            ]}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <View style={styles.faqChevron}>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={DS.colors.textSecondary}
                />
              </View>
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerIcon}>
          <Ionicons name="help-buoy-outline" size={24} color={DS.colors.textSecondary} />
        </View>
        <Text style={styles.footerText}>
          {"Vous n'avez pas trouvé la réponse à votre question ? Contactez-nous directement."}
        </Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: DS.colors.textSecondary,
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  faqItemExpanded: {
    borderColor: DS.colors.green,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DS.colors.white,
    paddingRight: 12,
  },
  faqChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswer: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DS.colors.cardBorder,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
    padding: 16,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: DS.colors.textSecondary,
    lineHeight: 20,
  },
});

export default FAQScreen;

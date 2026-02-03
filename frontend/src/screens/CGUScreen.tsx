import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../theme';

const CGUScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CGU</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{"Conditions Générales d'Utilisation"}</Text>
      <Text style={styles.lastUpdate}>Dernière mise à jour : février 2026</Text>

      <Section title="1. Présentation de ShareTips" styles={styles}>
        <Text style={styles.paragraph}>
          {"ShareTips est une plateforme de partage de pronostics sportifs. Notre rôle est exclusivement celui d'intermédiaire : nous mettons en relation des utilisateurs souhaitant partager leurs analyses avec d'autres utilisateurs intéressés par ces contenus."}
        </Text>
        <Text style={styles.paragraph}>
          {"ShareTips ne propose pas de paris sportifs et n'est pas un opérateur de jeux d'argent. Nous ne collectons pas de mises et ne redistribuons pas de gains."}
        </Text>
      </Section>

      <Section title="2. Aucune garantie de résultat" styles={styles}>
        <Text style={styles.paragraph}>
          Les pronostics partagés sur ShareTips sont des analyses personnelles de leurs auteurs.
          Ils ne constituent en aucun cas des conseils financiers ou des incitations à parier.
        </Text>
        <Text style={styles.paragraph}>
          {"ShareTips ne garantit aucun résultat. Les performances passées d'un pronostiqueur ne préjugent pas de ses résultats futurs. Tout pronostic peut s'avérer erroné."}
        </Text>
      </Section>

      <Section title="3. Responsabilité de l'utilisateur" styles={styles}>
        <Text style={styles.paragraph}>
          {"En utilisant ShareTips, vous reconnaissez être seul responsable de l'utilisation que vous faites des pronostics consultés. Toute décision de placer un pari auprès d'un opérateur agréé reste votre choix personnel et sous votre entière responsabilité."}
        </Text>
        <Text style={styles.paragraph}>
          {"ShareTips décline toute responsabilité quant aux conséquences financières ou autres résultant de l'utilisation des pronostics partagés sur la plateforme."}
        </Text>
      </Section>

      <Section title="4. Accès réservé aux majeurs" styles={styles}>
        <Text style={styles.paragraph}>
          {"L'utilisation de ShareTips est strictement réservée aux personnes majeures (18 ans ou plus, selon la législation de votre pays de résidence)."}
        </Text>
        <Text style={styles.paragraph}>
          {"En créant un compte, vous certifiez avoir l'âge légal requis. ShareTips se réserve le droit de demander une vérification d'identité et de suspendre tout compte suspecté d'appartenir à un mineur."}
        </Text>
      </Section>

      <Section title="5. Règles de conduite" styles={styles}>
        <Text style={styles.paragraph}>
          {"Les utilisateurs s'engagent à :"}
        </Text>
        <Text style={styles.bullet}>• Partager des pronostics de bonne foi</Text>
        <Text style={styles.bullet}>• Ne pas publier de contenu trompeur ou frauduleux</Text>
        <Text style={styles.bullet}>• Respecter les autres utilisateurs</Text>
        <Text style={styles.bullet}>• Ne pas utiliser la plateforme à des fins illégales</Text>
      </Section>

      <Section title="6. Suspension et résiliation" styles={styles}>
        <Text style={styles.paragraph}>
          ShareTips se réserve le droit de suspendre ou supprimer tout compte en cas de :
        </Text>
        <Text style={styles.bullet}>• Violation des présentes conditions</Text>
        <Text style={styles.bullet}>• Comportement frauduleux ou abusif</Text>
        <Text style={styles.bullet}>{"• Suspicion de minorité de l'utilisateur"}</Text>
        <Text style={styles.bullet}>{"• Utilisation contraire à l'esprit de la plateforme"}</Text>
        <Text style={styles.paragraph}>
          {"En cas de suspension, les soldes disponibles pourront faire l'objet d'un remboursement selon les modalités en vigueur."}
        </Text>
      </Section>

      <Section title="7. Paiements et transactions" styles={styles}>
        <Text style={styles.paragraph}>
          {"Les paiements sur ShareTips sont effectués en euros (EUR) via Stripe. Les pronostiqueurs peuvent retirer leurs gains vers leur compte bancaire à tout moment (minimum 10 EUR)."}
        </Text>
      </Section>

      <Section title="8. Modification des CGU" styles={styles}>
        <Text style={styles.paragraph}>
          {"ShareTips peut modifier ces conditions à tout moment. Les utilisateurs seront informés des changements significatifs. La poursuite de l'utilisation de la plateforme vaut acceptation des nouvelles conditions."}
        </Text>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          En utilisant ShareTips, vous acceptez ces conditions.
        </Text>
        <Text style={styles.footerText}>
          Pour toute question : support@sharetips.app
        </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof useStyles>;
}

const Section: React.FC<SectionProps> = ({ title, children, styles }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        closeButton: {
          padding: 4,
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
        },
        headerSpacer: {
          width: 36,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 20,
          paddingBottom: 40,
        },
        title: {
          fontSize: 22,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 4,
        },
        lastUpdate: {
          fontSize: 12,
          color: colors.textTertiary,
          marginBottom: 24,
        },
        section: {
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: 10,
        },
        paragraph: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 22,
          marginBottom: 10,
        },
        bullet: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 24,
          paddingLeft: 8,
        },
        footer: {
          marginTop: 16,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
          gap: 6,
        },
        footerText: {
          fontSize: 12,
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [colors]
  );

export default CGUScreen;

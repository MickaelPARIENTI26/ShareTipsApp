import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';

const CGVScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Conditions Générales de Vente</Text>
      <Text style={styles.lastUpdate}>Dernière mise à jour : février 2026</Text>

      <Section title="1. Objet" styles={styles}>
        <Text style={styles.paragraph}>
          {"Les présentes Conditions Générales de Vente régissent l'achat de contenus numériques sur la plateforme ShareTips, notamment l'achat de pronostics individuels et les abonnements aux pronostiqueurs."}
        </Text>
      </Section>

      <Section title="2. Nature des produits" styles={styles}>
        <Text style={styles.paragraph}>
          Les produits vendus sur ShareTips sont exclusivement des contenus numériques :
        </Text>
        <Text style={styles.bullet}>• Pronostics sportifs (analyses et sélections)</Text>
        <Text style={styles.bullet}>{"• Abonnements donnant accès aux pronostics d'un créateur"}</Text>
        <Text style={styles.paragraph}>
          {"Ces contenus sont fournis par des utilisateurs tiers (pronostiqueurs) et non par ShareTips. ShareTips agit uniquement en tant qu'intermédiaire technique."}
        </Text>
      </Section>

      <Section title="3. Prix et paiements" styles={styles}>
        <Text style={styles.paragraph}>
          Tous les prix sur ShareTips sont exprimés en euros (EUR).
        </Text>
        <Text style={styles.paragraph}>
          {"Les paiements sont effectués de manière sécurisée via Stripe. Les prix des pronostics et abonnements sont fixés librement par les pronostiqueurs, dans les limites définies par la plateforme."}
        </Text>
      </Section>

      <Section title="4. Commission plateforme" styles={styles}>
        <Text style={styles.paragraph}>
          ShareTips prélève une commission de 10% sur chaque transaction entre acheteur et vendeur.
        </Text>
        <Text style={styles.paragraph}>
          {"Cette commission est automatiquement déduite du montant reçu par le vendeur. L'acheteur paie le prix affiché sans frais supplémentaire."}
        </Text>
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Exemple :</Text>
          <Text style={styles.exampleText}>
            Prix affiché : 10,00 €{'\n'}
            Acheteur paie : 10,00 €{'\n'}
            Vendeur reçoit : 9,00 €{'\n'}
            Commission ShareTips : 1,00 €
          </Text>
        </View>
      </Section>

      <Section title="5. Accès immédiat" styles={styles}>
        <Text style={styles.paragraph}>
          {"L'accès au contenu acheté est fourni immédiatement après validation du paiement. Dès la confirmation de l'achat, le contenu devient accessible dans votre compte."}
        </Text>
        <Text style={styles.paragraph}>
          {"En procédant à l'achat, vous reconnaissez expressément demander l'exécution immédiate du service et renoncez à votre droit de rétractation conformément à l'article L221-28 du Code de la consommation."}
        </Text>
      </Section>

      <Section title="6. Politique de remboursement" styles={styles}>
        <Text style={styles.paragraph}>
          {"Compte tenu de la nature numérique des contenus et de leur accessibilité immédiate, aucun remboursement ne peut être accordé une fois le contenu consulté."}
        </Text>
        <Text style={styles.paragraph}>
          Exceptions possibles (à la discrétion de ShareTips) :
        </Text>
        <Text style={styles.bullet}>{"• Erreur technique empêchant l'accès au contenu"}</Text>
        <Text style={styles.bullet}>• Contenu manifestement frauduleux ou trompeur</Text>
        <Text style={styles.bullet}>• Double facturation par erreur</Text>
        <Text style={styles.paragraph}>
          {"Toute demande de remboursement doit être adressée à support@sharetips.app dans un délai de 7 jours suivant l'achat."}
        </Text>
      </Section>

      <Section title="7. Durée des abonnements" styles={styles}>
        <Text style={styles.paragraph}>
          {"Les abonnements sont valables pour la durée indiquée lors de l'achat (ex : 7 jours, 30 jours, 90 jours)."}
        </Text>
        <Text style={styles.paragraph}>
          {"À l'expiration, l'accès aux contenus privés du pronostiqueur est automatiquement révoqué. Les abonnements ne sont pas renouvelés automatiquement."}
        </Text>
      </Section>

      <Section title="8. Responsabilité" styles={styles}>
        <Text style={styles.paragraph}>
          {"ShareTips ne garantit pas la qualité, l'exactitude ou les résultats des pronostics vendus sur la plateforme. Les pronostics sont fournis par des utilisateurs tiers sous leur seule responsabilité."}
        </Text>
        <Text style={styles.paragraph}>
          {"L'achat d'un pronostic ne constitue en aucun cas une garantie de gain. L'utilisateur reste seul responsable de l'utilisation qu'il fait des contenus achetés."}
        </Text>
      </Section>

      <Section title="9. Propriété intellectuelle" styles={styles}>
        <Text style={styles.paragraph}>
          Les contenus achetés sont destinés à un usage personnel et non commercial. Toute reproduction, diffusion ou revente des pronostics achetés est strictement interdite.
        </Text>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {"En effectuant un achat, vous acceptez ces conditions."}
        </Text>
        <Text style={styles.footerText}>
          Pour toute question : support@sharetips.app
        </Text>
      </View>
    </ScrollView>
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
        example: {
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          marginTop: 8,
        },
        exampleTitle: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 6,
        },
        exampleText: {
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 20,
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

export default CGVScreen;

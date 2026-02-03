import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';

const PrivacyPolicyScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Politique de confidentialité</Text>
      <Text style={styles.lastUpdate}>Dernière mise à jour : février 2026</Text>

      <Text style={styles.intro}>
        {"ShareTips s'engage à protéger votre vie privée. Cette politique explique quelles données nous collectons, pourquoi et comment nous les utilisons."}
      </Text>

      <Section title="1. Données collectées" styles={styles}>
        <Text style={styles.subtitle}>Données de compte</Text>
        <Text style={styles.bullet}>{"• Email (pour l'authentification)"}</Text>
        <Text style={styles.bullet}>{"• Nom d'utilisateur (affiché publiquement)"}</Text>
        <Text style={styles.bullet}>• Mot de passe (stocké de manière chiffrée)</Text>
        <Text style={styles.bullet}>• Date de création du compte</Text>

        <Text style={styles.subtitle}>{"Données d'utilisation"}</Text>
        <Text style={styles.bullet}>• Historique des achats et abonnements</Text>
        <Text style={styles.bullet}>• Pronostics créés</Text>
        <Text style={styles.bullet}>• Préférences de notification</Text>

        <Text style={styles.subtitle}>Données techniques</Text>
        <Text style={styles.bullet}>• Adresse IP (lors du consentement)</Text>
        <Text style={styles.bullet}>{"• Type d'appareil et système d'exploitation"}</Text>
        <Text style={styles.bullet}>{"• Version de l'application"}</Text>
      </Section>

      <Section title="2. Utilisation des données" styles={styles}>
        <Text style={styles.paragraph}>
          Vos données sont utilisées pour :
        </Text>
        <Text style={styles.bullet}>• Gérer votre compte et vos accès</Text>
        <Text style={styles.bullet}>• Traiter vos achats et transactions</Text>
        <Text style={styles.bullet}>• Vous envoyer des notifications pertinentes</Text>
        <Text style={styles.bullet}>• Améliorer nos services</Text>
        <Text style={styles.bullet}>• Prévenir les fraudes et abus</Text>
        <Text style={styles.paragraph}>
          Nous ne vendons jamais vos données à des tiers.
        </Text>
      </Section>

      <Section title="3. Cookies et stockage local" styles={styles}>
        <Text style={styles.paragraph}>
          ShareTips utilise le stockage local de votre appareil pour :
        </Text>
        <Text style={styles.bullet}>{"• Maintenir votre session (token d'authentification)"}</Text>
        <Text style={styles.bullet}>• Stocker vos préférences (thème, notifications)</Text>
        <Text style={styles.bullet}>• Améliorer les performances (cache)</Text>
        <Text style={styles.paragraph}>
          Ces données restent sur votre appareil et ne sont pas partagées avec des services publicitaires tiers.
        </Text>
      </Section>

      <Section title="4. Statistiques et analytics" styles={styles}>
        <Text style={styles.paragraph}>
          {"Nous collectons des statistiques anonymisées pour comprendre comment l'application est utilisée et l'améliorer :"}
        </Text>
        <Text style={styles.bullet}>• Pages visitées</Text>
        <Text style={styles.bullet}>• Fonctionnalités utilisées</Text>
        <Text style={styles.bullet}>• Erreurs rencontrées</Text>
        <Text style={styles.paragraph}>
          {"Ces données sont agrégées et ne permettent pas de vous identifier personnellement."}
        </Text>
      </Section>

      <Section title="5. Conservation des données" styles={styles}>
        <Text style={styles.paragraph}>
          {"Vos données sont conservées tant que votre compte est actif. L'historique des transactions est conservé 5 ans pour des raisons légales."}
        </Text>
        <Text style={styles.paragraph}>
          Après suppression de votre compte, vos données personnelles sont effacées sous 30 jours, sauf obligation légale de conservation.
        </Text>
      </Section>

      <Section title="6. Suppression de compte" styles={styles}>
        <Text style={styles.paragraph}>
          Vous pouvez demander la suppression de votre compte à tout moment en contactant notre support. La suppression entraîne :
        </Text>
        <Text style={styles.bullet}>• Effacement de vos données personnelles</Text>
        <Text style={styles.bullet}>• Anonymisation de vos pronostics publiés</Text>
        <Text style={styles.bullet}>• Perte définitive de votre solde non retiré</Text>
        <Text style={styles.paragraph}>
          {"Cette action est irréversible. Nous vous recommandons de retirer votre solde avant de demander la suppression."}
        </Text>
      </Section>

      <Section title="7. Vos droits (RGPD)" styles={styles}>
        <Text style={styles.paragraph}>
          Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :
        </Text>
        <Text style={styles.bullet}>{"• Droit d'accès : obtenir une copie de vos données"}</Text>
        <Text style={styles.bullet}>• Droit de rectification : corriger vos informations</Text>
        <Text style={styles.bullet}>{"• Droit à l'effacement : supprimer votre compte"}</Text>
        <Text style={styles.bullet}>• Droit à la portabilité : exporter vos données</Text>
        <Text style={styles.bullet}>{"• Droit d'opposition : refuser certains traitements"}</Text>
        <Text style={styles.paragraph}>
          {"Pour exercer ces droits, contactez-nous à l'adresse ci-dessous."}
        </Text>
      </Section>

      <Section title="8. Sécurité" styles={styles}>
        <Text style={styles.paragraph}>
          Nous mettons en œuvre des mesures de sécurité pour protéger vos données :
        </Text>
        <Text style={styles.bullet}>• Chiffrement des communications (HTTPS)</Text>
        <Text style={styles.bullet}>• Mots de passe hashés (bcrypt)</Text>
        <Text style={styles.bullet}>• Accès restreint aux données</Text>
        <Text style={styles.bullet}>• Surveillance des accès anormaux</Text>
      </Section>

      <Section title="9. Contact" styles={styles}>
        <Text style={styles.paragraph}>
          Pour toute question concernant vos données personnelles ou pour exercer vos droits :
        </Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>Email : privacy@sharetips.app</Text>
          <Text style={styles.contactText}>Support : support@sharetips.app</Text>
        </View>
        <Text style={styles.paragraph}>
          Nous nous engageons à répondre dans un délai de 30 jours.
        </Text>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Cette politique peut être mise à jour. Consultez cette page régulièrement.
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
          marginBottom: 16,
        },
        intro: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 22,
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
        subtitle: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginTop: 10,
          marginBottom: 6,
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
        contactBox: {
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          marginVertical: 10,
          gap: 4,
        },
        contactText: {
          fontSize: 14,
          color: colors.text,
        },
        footer: {
          marginTop: 16,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        },
        footerText: {
          fontSize: 12,
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [colors]
  );

export default PrivacyPolicyScreen;

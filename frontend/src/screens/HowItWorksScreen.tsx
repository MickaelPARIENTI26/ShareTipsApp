import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, type ThemeColors } from '../theme';

type TabType = 'parieur' | 'tipster';

interface StepProps {
  number: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: ThemeColors;
  styles: ReturnType<typeof useStyles>;
}

const Step: React.FC<StepProps> = ({ number, icon, title, description, colors, styles }) => (
  <View style={styles.step}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIcon}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const HowItWorksScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [activeTab, setActiveTab] = useState<TabType>('parieur');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bulb" size={32} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Comment ça marche ?</Text>
        <Text style={styles.headerSubtitle}>
          Choisissez votre profil pour découvrir ShareTips
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'parieur' && styles.tabActive]}
          onPress={() => setActiveTab('parieur')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === 'parieur' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'parieur' && styles.tabTextActive]}>
            Parieur
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tipster' && styles.tabActive]}
          onPress={() => setActiveTab('tipster')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'tipster' ? colors.textOnPrimary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'tipster' && styles.tabTextActive]}>
            Tipster
          </Text>
        </TouchableOpacity>
      </View>

      {/* Role description */}
      <View style={styles.roleCard}>
        <Ionicons
          name={activeTab === 'parieur' ? 'person' : 'star'}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.roleTitle}>
          {activeTab === 'parieur' ? 'Vous cherchez des pronostics' : 'Vous partagez vos pronostics'}
        </Text>
        <Text style={styles.roleDescription}>
          {activeTab === 'parieur'
            ? 'Accédez aux pronostics des meilleurs tipsters et découvrez leurs analyses pour vos paris sportifs.'
            : 'Monétisez votre expertise en vendant vos pronostics et construisez votre réputation de tipster.'}
        </Text>
      </View>

      {/* Steps based on tab */}
      {activeTab === 'parieur' ? (
        <View style={styles.stepsContainer}>
          <Step
            number={1}
            icon="storefront-outline"
            title="Explorez le marché"
            description="Parcourez la marketplace pour découvrir les tickets. Filtrez par sport, cote ou confiance pour trouver ce qui vous correspond."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={2}
            icon="eye-outline"
            title="Tickets gratuits ou payants"
            description="Les tickets publics sont visibles gratuitement. Les tickets privés nécessitent un achat pour voir les sélections détaillées."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={3}
            icon="trophy-outline"
            title="Analysez les tipsters"
            description="Consultez les stats des tipsters : taux de réussite, ROI, historique. Choisissez ceux qui ont fait leurs preuves."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={4}
            icon="card-outline"
            title="Achetez si vous le souhaitez"
            description="Pour accéder aux sélections des tickets privés, achetez-les en toute sécurité via Stripe. Prix fixé par le tipster."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={5}
            icon="notifications-outline"
            title="Abonnez-vous (optionnel)"
            description="Pour un accès illimité aux tickets d'un tipster, abonnez-vous à son profil. Vous recevrez aussi des notifications."
            colors={colors}
            styles={styles}
          />
        </View>
      ) : (
        <View style={styles.stepsContainer}>
          <Step
            number={1}
            icon="football-outline"
            title="Créez votre ticket"
            description="Sélectionnez vos matchs et pronostics. Combinez plusieurs sélections pour créer un ticket combiné avec une cote totale."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={2}
            icon="pricetag-outline"
            title="Fixez votre prix"
            description="Définissez le prix de vente de votre ticket (ou proposez-le gratuitement). Indiquez votre niveau de confiance de 1 à 10."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={3}
            icon="share-social-outline"
            title="Publiez et vendez"
            description="Votre ticket apparaît sur la marketplace. Les parieurs peuvent le voir et l'acheter pour accéder à vos sélections."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={4}
            icon="wallet-outline"
            title="Recevez vos gains"
            description="Vous recevez 90% du prix de vente sur chaque ticket vendu. 10% de commission plateforme."
            colors={colors}
            styles={styles}
          />

          <View style={styles.stepConnector} />

          <Step
            number={5}
            icon="cash-outline"
            title="Retirez votre argent"
            description="Configurez Stripe Connect pour recevoir vos paiements. Retirez vos gains directement sur votre compte bancaire."
            colors={colors}
            styles={styles}
          />
        </View>
      )}

      {/* Tips section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>
          {activeTab === 'parieur' ? 'Conseils pour bien choisir' : 'Conseils pour réussir'}
        </Text>

        {activeTab === 'parieur' ? (
          <>
            <View style={styles.tipCard}>
              <Ionicons name="gift" size={20} color={colors.success} />
              <Text style={styles.tipText}>
                Commencez par explorer les tickets gratuits pour découvrir les tipsters
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="stats-chart" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Avant d'acheter, vérifiez le taux de réussite et l'historique du tipster
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.tipText}>
                {"L'abonnement donne accès à tous les tickets d'un tipster : plus économique si vous le suivez régulièrement"}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.tipCard}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.tipText}>
                Soyez régulier et publiez des tickets de qualité pour fidéliser vos acheteurs
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="trending-up" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Plus votre taux de réussite est élevé, plus vous montez dans le classement
              </Text>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="megaphone" size={20} color={colors.primary} />
              <Text style={styles.tipText}>
                Créez des plans d'abonnement pour proposer un accès illimité à vos tickets
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
        <Text style={styles.disclaimerText}>
          ShareTips est une plateforme de partage de pronostics. Nous ne proposons pas de paris et ne garantissons aucun résultat. Pariez de manière responsable.
        </Text>
      </View>
    </ScrollView>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 16,
          paddingBottom: 40,
        },
        header: {
          alignItems: 'center',
          marginBottom: 24,
        },
        headerIcon: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 8,
        },
        headerSubtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        },
        tabsContainer: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        },
        tab: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          borderRadius: 10,
          gap: 8,
        },
        tabActive: {
          backgroundColor: colors.primary,
        },
        tabText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        tabTextActive: {
          color: colors.textOnPrimary,
        },
        roleCard: {
          backgroundColor: colors.primary + '10',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.primary + '20',
        },
        roleTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginTop: 12,
          marginBottom: 8,
          textAlign: 'center',
        },
        roleDescription: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        stepsContainer: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        },
        step: {
          flexDirection: 'row',
        },
        stepNumber: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        stepNumberText: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        stepContent: {
          flex: 1,
        },
        stepHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        },
        stepIcon: {
          marginRight: 10,
        },
        stepTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        stepDescription: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        stepConnector: {
          width: 2,
          height: 20,
          backgroundColor: colors.primary + '30',
          marginLeft: 13,
          marginVertical: 8,
        },
        tipsSection: {
          marginBottom: 24,
        },
        tipsTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 12,
        },
        tipCard: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          gap: 12,
        },
        tipText: {
          flex: 1,
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        disclaimer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: colors.textTertiary + '15',
          borderRadius: 12,
          padding: 14,
        },
        disclaimerText: {
          flex: 1,
          fontSize: 12,
          color: colors.textTertiary,
          lineHeight: 18,
        },
      }),
    [colors]
  );

export default HowItWorksScreen;

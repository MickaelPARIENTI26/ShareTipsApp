import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../../types';
import { DS } from '../../theme/designSystem';
import { PrimaryRefreshControl } from '../../components/common';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const HomeScreen: React.FC = () => {
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <PrimaryRefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          icon="information-circle"
        />
      }
    >
      {/* How it works banner */}
      <Animated.View
        style={[
          styles.howItWorksBanner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.howItWorksContent}
          onPress={() => rootNavigation.navigate('HowItWorks')}
          activeOpacity={0.8}
        >
          <View style={styles.howItWorksIcon}>
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              style={styles.howItWorksIconGradient}
            >
              <Ionicons name="bulb" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.howItWorksTextContainer}>
            <Text style={styles.howItWorksTitle}>Comment ça marche ?</Text>
            <Text style={styles.howItWorksSubtitle}>Découvrez ShareTips en quelques étapes</Text>
          </View>
          <View style={styles.howItWorksArrow}>
            <Ionicons name="chevron-forward" size={20} color="#FBBF24" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Aide Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>AIDE</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="FAQ - Questions fréquentes"
            onPress={() => rootNavigation.navigate('FAQ')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="mail-outline"
            label="Contactez-nous"
            onPress={() => rootNavigation.navigate('Contact')}
            isLast
          />
        </View>
      </Animated.View>

      {/* Légal Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>LÉGAL</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="document-text-outline"
            label="Conditions Générales d'Utilisation"
            onPress={() => rootNavigation.navigate('CGU')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="document-text-outline"
            label="Conditions Générales de Vente"
            onPress={() => rootNavigation.navigate('CGV')}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Politique de Confidentialité"
            onPress={() => rootNavigation.navigate('PrivacyPolicy')}
            isLast
          />
        </View>
      </Animated.View>

      {/* À propos Section */}
      <Animated.View
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>À PROPOS</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="information-circle-outline"
            label="À propos de ShareTips"
            onPress={() => rootNavigation.navigate('About')}
            isLast
          />
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View
        style={[
          styles.disclaimer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.disclaimerIconContainer}>
          <Ionicons name="information-circle" size={18} color={DS.colors.textSecondary} />
        </View>
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerText}>
            ShareTips est une plateforme de partage de pronostics. Nous ne proposons pas de paris et ne garantissons aucun résultat. Vous restez seul responsable de vos décisions.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// MENU ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, isLast }) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={20} color={DS.colors.textSecondary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={DS.colors.textSecondary} />
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // How it works banner
  howItWorksBanner: {
    marginBottom: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  howItWorksContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  howItWorksIcon: {
    marginRight: 12,
  },
  howItWorksIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksTextContainer: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.colors.white,
  },
  howItWorksSubtitle: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    marginTop: 2,
  },
  howItWorksArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
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

  // Menu Card
  menuCard: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: DS.colors.white,
  },
  menuDivider: {
    height: 1,
    backgroundColor: DS.colors.cardBorder,
    marginLeft: 64,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: DS.colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
  },
  disclaimerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerText: {
    fontSize: 12,
    color: DS.colors.textSecondary,
    lineHeight: 18,
  },
});

export default HomeScreen;

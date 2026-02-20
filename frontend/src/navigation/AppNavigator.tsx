import React, { Suspense, lazy, ComponentType } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import FloatingTabBar from '../components/navigation/FloatingTabBar';
import type {
  RootStackParamList,
  AppTabParamList,
  HomeStackParamList,
} from '../types';

// === EAGERLY LOADED SCREENS ===
// Main tabs and frequently accessed screens (loaded at startup)
import HomeScreen from '../screens/home/HomeScreen';
import SportsListScreen from '../screens/home/SportsListScreen';
import LeagueListScreen from '../screens/home/LeagueListScreen';
import MatchListScreen from '../screens/matches/MatchListScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import RankingScreen from '../screens/RankingScreen';

// === LAZY LOADED SCREENS ===
// Secondary screens (loaded on demand when navigated to)
const TicketPreviewScreen = lazy(() => import('../screens/TicketPreviewScreen'));
const MatchDetailsScreen = lazy(() => import('../screens/MatchDetailsScreen'));
const MyTicketsScreen = lazy(() => import('../screens/MyTicketsScreen'));
const TipsterProfileScreen = lazy(() => import('../screens/TipsterProfileScreen'));
const MesFavorisScreen = lazy(() => import('../screens/MesFavorisScreen'));
const MesAchatsScreen = lazy(() => import('../screens/MesAchatsScreen'));
const TicketDetailScreen = lazy(() => import('../screens/TicketDetailScreen'));
const MesAbonnementsScreen = lazy(() => import('../screens/MesAbonnementsScreen'));
const WalletScreen = lazy(() => import('../screens/WalletScreen'));
const NotificationsScreen = lazy(() => import('../screens/NotificationsScreen'));
const NotificationPreferencesScreen = lazy(() => import('../screens/NotificationPreferencesScreen'));
const StatistiquesScreen = lazy(() => import('../screens/StatistiquesScreen'));
const MesAbonnesScreen = lazy(() => import('../screens/MesAbonnesScreen'));
const MesPlansAbonnementScreen = lazy(() => import('../screens/MesPlansAbonnementScreen'));
const HistoriqueScreen = lazy(() => import('../screens/HistoriqueScreen'));
const CGUScreen = lazy(() => import('../screens/CGUScreen'));
const CGVScreen = lazy(() => import('../screens/CGVScreen'));
const PrivacyPolicyScreen = lazy(() => import('../screens/PrivacyPolicyScreen'));
const HowItWorksScreen = lazy(() => import('../screens/HowItWorksScreen'));
const MyBadgesScreen = lazy(() => import('../screens/MyBadgesScreen'));
const XpGuideScreen = lazy(() => import('../screens/XpGuideScreen'));

// Loading fallback component
const LoadingFallback: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

// HOC to wrap lazy components with Suspense
function withSuspense<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>
): React.FC<P> {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Wrapped lazy components for use in navigation
const LazyTicketPreviewScreen = withSuspense(TicketPreviewScreen);
const LazyMatchDetailsScreen = withSuspense(MatchDetailsScreen);
const LazyMyTicketsScreen = withSuspense(MyTicketsScreen);
const LazyTipsterProfileScreen = withSuspense(TipsterProfileScreen);
const LazyMesFavorisScreen = withSuspense(MesFavorisScreen);
const LazyMesAchatsScreen = withSuspense(MesAchatsScreen);
const LazyTicketDetailScreen = withSuspense(TicketDetailScreen);
const LazyMesAbonnementsScreen = withSuspense(MesAbonnementsScreen);
const LazyWalletScreen = withSuspense(WalletScreen);
const LazyNotificationsScreen = withSuspense(NotificationsScreen);
const LazyNotificationPreferencesScreen = withSuspense(NotificationPreferencesScreen);
const LazyStatistiquesScreen = withSuspense(StatistiquesScreen);
const LazyMesAbonnesScreen = withSuspense(MesAbonnesScreen);
const LazyMesPlansAbonnementScreen = withSuspense(MesPlansAbonnementScreen);
const LazyHistoriqueScreen = withSuspense(HistoriqueScreen);
const LazyCGUScreen = withSuspense(CGUScreen);
const LazyCGVScreen = withSuspense(CGVScreen);
const LazyPrivacyPolicyScreen = withSuspense(PrivacyPolicyScreen);
const LazyHowItWorksScreen = withSuspense(HowItWorksScreen);
const LazyMyBadgesScreen = withSuspense(MyBadgesScreen);
const LazyXpGuideScreen = withSuspense(XpGuideScreen);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackScreen: React.FC = () => {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Accueil' }}
      />
      <HomeStack.Screen
        name="SportsList"
        component={SportsListScreen}
        options={{ title: 'Sports' }}
      />
      <HomeStack.Screen
        name="LeagueList"
        component={LeagueListScreen}
        options={({ route }) => ({ title: route.params.sportName })}
      />
      <HomeStack.Screen
        name="MatchList"
        component={MatchListScreen}
        options={({ route }) => ({
          title: route.params.leagueName ?? route.params.sportName,
        })}
      />
    </HomeStack.Navigator>
  );
};

const MainTabs: React.FC = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      {/* Order: Home > Matches > Marketplace (center FAB) > Ranking > Profile */}
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          title: 'Matchs',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          title: 'Marché',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          title: 'Classement',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  // Initialize push notifications
  usePushNotifications();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="MatchDetails"
        component={LazyMatchDetailsScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Détails du match',
        })}
      />
      <RootStack.Screen
        name="TicketPreview"
        component={LazyTicketPreviewScreen}
        options={{
          title: 'Confirmer le ticket',
          presentation: 'modal',
        }}
      />
      <RootStack.Screen
        name="MyTickets"
        component={LazyMyTicketsScreen}
        options={{ title: 'Mes tickets' }}
      />
      <RootStack.Screen
        name="TipsterProfile"
        component={LazyTipsterProfileScreen}
        options={({ route }) => ({
          title: `@${route.params.tipsterUsername}`,
        })}
      />
      <RootStack.Screen
        name="MesFavoris"
        component={LazyMesFavorisScreen}
        options={{ title: 'Mes favoris' }}
      />
      <RootStack.Screen
        name="MesAchats"
        component={LazyMesAchatsScreen}
        options={{ title: 'Mes achats' }}
      />
      <RootStack.Screen
        name="TicketDetail"
        component={LazyTicketDetailScreen}
        options={{ title: 'Détail du ticket' }}
      />
      <RootStack.Screen
        name="MesAbonnements"
        component={LazyMesAbonnementsScreen}
        options={{ title: 'Mes abonnements' }}
      />
      <RootStack.Screen
        name="Wallet"
        component={LazyWalletScreen}
        options={{ title: 'Portefeuille' }}
      />
      <RootStack.Screen
        name="Notifications"
        component={LazyNotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <RootStack.Screen
        name="NotificationPreferences"
        component={LazyNotificationPreferencesScreen}
        options={{ title: 'Préférences' }}
      />
      <RootStack.Screen
        name="Statistiques"
        component={LazyStatistiquesScreen}
        options={{ title: 'Statistiques' }}
      />
      <RootStack.Screen
        name="MesAbonnes"
        component={LazyMesAbonnesScreen}
        options={{ title: 'Mes abonnés' }}
      />
      <RootStack.Screen
        name="MesPlansAbonnement"
        component={LazyMesPlansAbonnementScreen}
        options={{ title: "Mes plans d'abonnement" }}
      />
      <RootStack.Screen
        name="Historique"
        component={LazyHistoriqueScreen}
        options={{ title: 'Mes accès' }}
      />
      <RootStack.Screen
        name="CGU"
        component={LazyCGUScreen}
        options={{ title: "Conditions d'utilisation" }}
      />
      <RootStack.Screen
        name="CGV"
        component={LazyCGVScreen}
        options={{ title: 'Conditions de vente' }}
      />
      <RootStack.Screen
        name="PrivacyPolicy"
        component={LazyPrivacyPolicyScreen}
        options={{ title: 'Confidentialité' }}
      />
      <RootStack.Screen
        name="HowItWorks"
        component={LazyHowItWorksScreen}
        options={{ title: 'Comment ça marche' }}
      />
      <RootStack.Screen
        name="MyBadges"
        component={LazyMyBadgesScreen}
        options={{ title: 'Mes badges' }}
      />
      <RootStack.Screen
        name="XpGuide"
        component={LazyXpGuideScreen}
        options={{ title: 'Guide XP' }}
      />
    </RootStack.Navigator>
  );
};

export default AppNavigator;

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import HomeScreen from '../screens/home/HomeScreen';
import SportsListScreen from '../screens/home/SportsListScreen';
import LeagueListScreen from '../screens/home/LeagueListScreen';
import MatchListScreen from '../screens/matches/MatchListScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import TicketPreviewScreen from '../screens/TicketPreviewScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import TipsterProfileScreen from '../screens/TipsterProfileScreen';
import MesFavorisScreen from '../screens/MesFavorisScreen';
import MesAchatsScreen from '../screens/MesAchatsScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import MesAbonnementsScreen from '../screens/MesAbonnementsScreen';
import WalletScreen from '../screens/WalletScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import StatistiquesScreen from '../screens/StatistiquesScreen';
import MesAbonnesScreen from '../screens/MesAbonnesScreen';
import MesPlansAbonnementScreen from '../screens/MesPlansAbonnementScreen';
import HistoriqueScreen from '../screens/HistoriqueScreen';
import CGUScreen from '../screens/CGUScreen';
import CGVScreen from '../screens/CGVScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RankingScreen from '../screens/RankingScreen';
import type {
  RootStackParamList,
  AppTabParamList,
  HomeStackParamList,
} from '../types';

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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Ranking') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.tabBarBackground },
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{ title: 'Accueil' }}
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
        component={MatchDetailsScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Détails du match',
        })}
      />
      <RootStack.Screen
        name="TicketPreview"
        component={TicketPreviewScreen}
        options={{
          title: 'Confirmer le ticket',
          presentation: 'modal',
        }}
      />
      <RootStack.Screen
        name="MyTickets"
        component={MyTicketsScreen}
        options={{ title: 'Mes tickets' }}
      />
      <RootStack.Screen
        name="TipsterProfile"
        component={TipsterProfileScreen}
        options={({ route }) => ({
          title: `@${route.params.tipsterUsername}`,
        })}
      />
      <RootStack.Screen
        name="MesFavoris"
        component={MesFavorisScreen}
        options={{ title: 'Mes favoris' }}
      />
      <RootStack.Screen
        name="MesAchats"
        component={MesAchatsScreen}
        options={{ title: 'Mes achats' }}
      />
      <RootStack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ title: 'Détail du ticket' }}
      />
      <RootStack.Screen
        name="MesAbonnements"
        component={MesAbonnementsScreen}
        options={{ title: 'Mes abonnements' }}
      />
      <RootStack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: 'Portefeuille' }}
      />
      <RootStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <RootStack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Préférences' }}
      />
      <RootStack.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{ title: 'Statistiques' }}
      />
      <RootStack.Screen
        name="MesAbonnes"
        component={MesAbonnesScreen}
        options={{ title: 'Mes abonnés' }}
      />
      <RootStack.Screen
        name="MesPlansAbonnement"
        component={MesPlansAbonnementScreen}
        options={{ title: "Mes plans d'abonnement" }}
      />
      <RootStack.Screen
        name="Historique"
        component={HistoriqueScreen}
        options={{ title: 'Mes accès' }}
      />
      <RootStack.Screen
        name="CGU"
        component={CGUScreen}
        options={{ title: "Conditions d'utilisation" }}
      />
      <RootStack.Screen
        name="CGV"
        component={CGVScreen}
        options={{ title: 'Conditions de vente' }}
      />
      <RootStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Confidentialité' }}
      />
    </RootStack.Navigator>
  );
};

export default AppNavigator;

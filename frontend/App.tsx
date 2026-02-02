import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import { ThemeProvider, useTheme } from './src/theme';
import { useAuthStore } from './src/store/auth.store';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import TicketBuilder from './src/components/ticketBuilder/TicketBuilder';
import { navigationRef } from './src/navigation/navigationRef';
import { ErrorBoundary } from './src/components/common';
import type { RootStackParamList } from './src/types';

// Initialize Sentry
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachStacktrace: true,
    // Don't send PII
    beforeSend(event) {
      // Remove user email from events
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
  });
}

// Deep linking prefix (matches app.json scheme)
const prefix = Linking.createURL('/');

// Deep linking configuration for push notification navigation
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'sharetips://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Marketplace: 'marketplace',
          Matches: 'matches',
          Profile: 'profile',
        },
      },
      TicketDetail: {
        path: 'ticket/:ticketId',
        parse: {
          ticketId: (ticketId: string) => ticketId,
        },
      },
      TipsterProfile: {
        path: 'tipster/:tipsterId',
        parse: {
          tipsterId: (tipsterId: string) => tipsterId,
        },
      },
      MatchDetails: {
        path: 'match/:matchId',
        parse: {
          matchId: (matchId: string) => matchId,
        },
      },
      Notifications: 'notifications',
      Wallet: 'wallet',
      MyTickets: 'my-tickets',
      MesFavoris: 'favoris',
      MesAchats: 'achats',
      MesAbonnements: 'abonnements',
    },
  },
};

function AppContent() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      {isAuthenticated && <TicketBuilder />}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

// Wrap app with Sentry for error boundary and performance monitoring
export default Sentry.wrap(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

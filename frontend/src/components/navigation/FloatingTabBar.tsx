/**
 * FloatingTabBar — Barre de navigation premium
 *
 * Design épuré avec bouton central surélevé et glow effect.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { haptics } from '../../utils/haptics';

// ═══════════════════════════════════════════════════════════════
// COULEURS EXACTES DU DESIGN
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  background: '#0A0F0C',      // Noir très foncé avec teinte verte subtile
  borderTop: '#1A2420',       // Bordure haut très subtile vert foncé
  active: '#2D8C4E',          // Vert actif
  inactive: '#5A6A5E',        // Gris-vert foncé
  white: '#FFFFFF',
  fabGlow: 'rgba(45, 140, 78, 0.4)', // Glow du FAB
};

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TAB_BAR_HEIGHT = 52;
const FAB_SIZE = 50;
const FAB_OUTER_SIZE = 58;
const ICON_SIZE = 26;
const FAB_ICON_SIZE = 26;

/** Hauteur totale exportée pour le layout */
export const FLOATING_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;

/** Configuration des icônes pour chaque route */
const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap; label: string }
> = {
  Home: { icon: 'information-circle-outline', iconFocused: 'information-circle', label: 'Information' },
  Matches: { icon: 'football-outline', iconFocused: 'football', label: 'Matchs' },
  Marketplace: { icon: 'storefront-outline', iconFocused: 'storefront', label: 'Boutique' },
  Ranking: { icon: 'trophy-outline', iconFocused: 'trophy', label: 'Compétitions' },
  Profile: { icon: 'person-outline', iconFocused: 'person', label: 'Profil' },
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type FloatingTabBarVariant = 'default' | 'glass' | 'minimal';

export interface FloatingTabBarProps extends BottomTabBarProps {
  variant?: FloatingTabBarVariant;
  animated?: boolean;
  showFabGlow?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BOUTON FAB CENTRAL
// ═══════════════════════════════════════════════════════════════

interface CenterButtonProps {
  onPress: () => void;
  isFocused: boolean;
}

const CenterButton: React.FC<CenterButtonProps> = React.memo(({ onPress, isFocused }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    haptics.selection();
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={fabStyles.touchable}
      accessibilityRole="button"
      accessibilityLabel="Boutique"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[fabStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
        {/* Outer glow ring */}
        <View style={fabStyles.glowRing}>
          {/* Inner FAB button */}
          <View style={fabStyles.innerCircle}>
            <Ionicons
              name={isFocused ? 'storefront' : 'storefront-outline'}
              size={FAB_ICON_SIZE}
              color={COLORS.white}
            />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

CenterButton.displayName = 'CenterButton';

const fabStyles = StyleSheet.create({
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    zIndex: 99999,
    elevation: 999,
  },
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 999,
  },
  glowRing: {
    width: FAB_OUTER_SIZE,
    height: FAB_OUTER_SIZE,
    borderRadius: FAB_OUTER_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(45, 140, 78, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 99999,
    // Strong glow shadow
    ...Platform.select({
      ios: {
        shadowColor: '#2D8C4E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 999,
      },
    }),
  },
  innerCircle: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.active,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 999,
  },
});

// ═══════════════════════════════════════════════════════════════
// BOUTON D'ONGLET
// ═══════════════════════════════════════════════════════════════

interface TabButtonProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = React.memo(({
  routeName,
  isFocused,
  onPress,
  onLongPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    haptics.selection();
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const config = TAB_CONFIG[routeName];
  const iconName = isFocused ? config?.iconFocused : config?.icon;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={config?.label ?? routeName}
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={tabStyles.container}
      activeOpacity={0.8}
    >
      <Animated.View style={[tabStyles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={iconName ?? 'ellipse'}
          size={ICON_SIZE}
          color={isFocused ? COLORS.active : COLORS.inactive}
        />
      </Animated.View>
    </TouchableOpacity>
  );
});

TabButton.displayName = 'TabButton';

const tabStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // ── Calcul des routes ordonnées ──────────────────────────────
  const { leftRoutes, centerRoute, rightRoutes } = useMemo(() => {
    const orderedRouteNames = ['Profile', 'Matches', 'Marketplace', 'Ranking', 'Home'];
    const orderedRoutes = orderedRouteNames
      .map((name) => state.routes.find((r) => r.name === name))
      .filter((r): r is typeof state.routes[number] => r !== undefined);

    return {
      leftRoutes: orderedRoutes.slice(0, 2),
      centerRoute: orderedRoutes[2],
      rightRoutes: orderedRoutes.slice(3),
    };
  }, [state.routes]);

  // ── Handlers ─────────────────────────────────────────────────
  const getIsFocused = useCallback(
    (route: typeof state.routes[number]) => {
      return state.index === state.routes.findIndex((r) => r.key === route.key);
    },
    [state.index, state.routes]
  );

  const handlePress = useCallback(
    (route: typeof state.routes[number]) => {
      const isFocused = getIsFocused(route);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [getIsFocused, navigation]
  );

  const handleLongPress = useCallback(
    (route: typeof state.routes[number]) => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    },
    [navigation]
  );

  // ── Render des tabs ──────────────────────────────────────────
  const renderTab = useCallback(
    (route: typeof state.routes[number]) => (
      <TabButton
        key={route.key}
        routeName={route.name}
        isFocused={getIsFocused(route)}
        onPress={() => handlePress(route)}
        onLongPress={() => handleLongPress(route)}
      />
    ),
    [getIsFocused, handlePress, handleLongPress]
  );

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      accessibilityRole="tablist"
      accessibilityLabel="Navigation principale"
    >
      {/* Barre de fond */}
      <View style={styles.tabBar}>
        {/* Section gauche (Home, Matches) */}
        <View style={styles.section}>
          {leftRoutes.map(renderTab)}
        </View>

        {/* Bouton central (Marketplace) */}
        {centerRoute && (
          <CenterButton
            onPress={() => handlePress(centerRoute)}
            isFocused={getIsFocused(centerRoute)}
          />
        )}

        {/* Section droite (Ranking, Profile) */}
        <View style={styles.section}>
          {rightRoutes.map(renderTab)}
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    zIndex: 100000,
    elevation: 1000,
    overflow: 'visible',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: TAB_BAR_HEIGHT,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderTop,
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'visible',
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

// ═══════════════════════════════════════════════════════════════
// PRESETS — Pour compatibilité
// ═══════════════════════════════════════════════════════════════

export const DefaultFloatingTabBar: React.FC<FloatingTabBarProps> = (props) => (
  <FloatingTabBar {...props} />
);

export const GlassFloatingTabBar: React.FC<FloatingTabBarProps> = (props) => (
  <FloatingTabBar {...props} />
);

export const MinimalFloatingTabBar: React.FC<FloatingTabBarProps> = (props) => (
  <FloatingTabBar {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(FloatingTabBar);

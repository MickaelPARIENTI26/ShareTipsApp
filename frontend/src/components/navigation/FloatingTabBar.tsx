import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 66;
const FAB_SIZE = 56;
const NOTCH_WIDTH = 38;
const NOTCH_DEPTH = 22;

export const FLOATING_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT + NOTCH_DEPTH;

const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap }
> = {
  Home: { icon: 'home-outline', iconFocused: 'home' },
  Matches: { icon: 'football-outline', iconFocused: 'football' },
  Marketplace: { icon: 'storefront-outline', iconFocused: 'storefront' },
  Ranking: { icon: 'trophy-outline', iconFocused: 'trophy' },
  Profile: { icon: 'person-outline', iconFocused: 'person' },
};

const TabBarBackground: React.FC<{ color: string; width: number }> = ({ color, width }) => {
  const centerX = width / 2;
  const curveStart = centerX - NOTCH_WIDTH - 10;
  const curveEnd = centerX + NOTCH_WIDTH + 10;

  const d = `
    M 0 ${NOTCH_DEPTH}
    L ${curveStart} ${NOTCH_DEPTH}
    Q ${centerX - NOTCH_WIDTH} ${NOTCH_DEPTH} ${centerX - NOTCH_WIDTH + 6} 2
    Q ${centerX} 0 ${centerX} 0
    Q ${centerX} 0 ${centerX + NOTCH_WIDTH - 6} 2
    Q ${centerX + NOTCH_WIDTH} ${NOTCH_DEPTH} ${curveEnd} ${NOTCH_DEPTH}
    L ${width} ${NOTCH_DEPTH}
    L ${width} ${TAB_BAR_HEIGHT + NOTCH_DEPTH}
    L 0 ${TAB_BAR_HEIGHT + NOTCH_DEPTH}
    Z
  `;

  return (
    <Svg
      width={width}
      height={TAB_BAR_HEIGHT + NOTCH_DEPTH}
      style={styles.svgBackground}
    >
      <Path d={d} fill={color} />
    </Svg>
  );
};

const CenterButton: React.FC<{
  onPress: () => void;
  isFocused: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ onPress, isFocused, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.centerButtonWrapper,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: colors.primary,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.centerButtonTouchable}
        accessibilityRole="button"
        accessibilityLabel="Marché"
        accessibilityState={{ selected: isFocused }}
      >
        <Ionicons
          name={isFocused ? 'storefront' : 'storefront-outline'}
          size={28}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TabButton: React.FC<{
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ routeName, isFocused, onPress, onLongPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const config = TAB_CONFIG[routeName];
  const iconName = isFocused ? config?.iconFocused : config?.icon;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabIconContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name={iconName ?? 'ellipse'}
          size={26}
          color={isFocused ? colors.tabActive : colors.tabInactive}
        />
        {isFocused && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const orderedRouteNames = ['Home', 'Matches', 'Marketplace', 'Ranking', 'Profile'];
  const orderedRoutes = orderedRouteNames
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is typeof state.routes[number] => r !== undefined);

  const leftRoutes = orderedRoutes.slice(0, 2);
  const centerRoute = orderedRoutes[2];
  const rightRoutes = orderedRoutes.slice(3);

  const getIsFocused = (route: typeof state.routes[number]) => {
    return state.index === state.routes.findIndex((r) => r.key === route.key);
  };

  const handlePress = (route: typeof state.routes[number]) => {
    const isFocused = getIsFocused(route);
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const handleLongPress = (route: typeof state.routes[number]) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TabBarBackground color={colors.tabBarBackground} width={SCREEN_WIDTH} />

      {/* Icons row - positioned inside white area */}
      <View style={styles.iconsRow}>
        <View style={styles.leftSection}>
          {leftRoutes.map((route) => (
            <TabButton
              key={route.key}
              routeName={route.name}
              isFocused={getIsFocused(route)}
              onPress={() => handlePress(route)}
              onLongPress={() => handleLongPress(route)}
              colors={colors}
            />
          ))}
        </View>

        <View style={styles.centerSection} />

        <View style={styles.rightSection}>
          {rightRoutes.map((route) => (
            <TabButton
              key={route.key}
              routeName={route.name}
              isFocused={getIsFocused(route)}
              onPress={() => handlePress(route)}
              onLongPress={() => handleLongPress(route)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      {/* Center FAB - in the notch */}
      {centerRoute && (
        <View style={styles.fabPositioner}>
          <CenterButton
            onPress={() => handlePress(centerRoute)}
            isFocused={getIsFocused(centerRoute)}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  svgBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  // Icons positioned INSIDE the white area (starts at NOTCH_DEPTH, height TAB_BAR_HEIGHT)
  iconsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  centerSection: {
    width: FAB_SIZE + 24,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // FAB positioned at the notch
  fabPositioner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerButtonWrapper: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    marginTop: -FAB_SIZE / 2 - 10,
  },
  centerButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingTabBar;

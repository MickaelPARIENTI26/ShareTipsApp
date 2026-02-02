import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type ThemeColors } from '../../theme';
import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import { navigationRef } from '../../navigation/navigationRef';
import TicketBuilderHeader from './TicketBuilderHeader';
import SelectionItem from './SelectionItem';
import ConfidenceSelector from './ConfidenceSelector';
import VisibilitySelector from './VisibilitySelector';
import TicketBuilderFooter from './TicketBuilderFooter';
import type { TicketDraft } from '../../types';

const TAB_BAR_HEIGHT = 49;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_BODY_HEIGHT = SCREEN_HEIGHT * 0.6;

/** Screens where the TicketBuilder should be hidden entirely */
const HIDDEN_ROUTES = new Set(['TicketPreview']);

/** The root route that has a visible tab bar */
const TAB_ROOT_ROUTE = 'MainTabs';

const TicketBuilder: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const selections = useTicketBuilderStore((s) => s.selections);
  const isOpen = useTicketBuilderStore((s) => s.isOpen);
  const toggleTicketBuilder = useTicketBuilderStore((s) => s.toggleTicketBuilder);
  const removeSelection = useTicketBuilderStore((s) => s.removeSelection);
  const closeTicketBuilder = useTicketBuilderStore((s) => s.closeTicketBuilder);
  const clear = useTicketBuilderStore((s) => s.clear);
  const totalOdds = useTicketBuilderStore((s) => s.totalOdds);

  const confidenceIndex = useTicketBuilderStore((s) => s.confidenceIndex);
  const visibility = useTicketBuilderStore((s) => s.visibility);
  const priceCredits = useTicketBuilderStore((s) => s.priceCredits);
  const setConfidenceIndex = useTicketBuilderStore((s) => s.setConfidenceIndex);
  const setVisibility = useTicketBuilderStore((s) => s.setVisibility);
  const setPriceCredits = useTicketBuilderStore((s) => s.setPriceCredits);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // --- Track active route to adjust bottom offset & visibility ---
  const [activeRoute, setActiveRoute] = useState<string | undefined>(
    TAB_ROOT_ROUTE
  );

  const syncRoute = useCallback(() => {
    const state = navigationRef.getRootState?.();
    if (state) {
      const route = state.routes[state.index];
      setActiveRoute(route.name);
    }
  }, []);

  useEffect(() => {
    // Initial sync once navigator is ready
    if (navigationRef.isReady()) {
      syncRoute();
    }
    const unsubscribe = navigationRef.addListener('state', syncRoute);
    return unsubscribe;
  }, [syncRoute]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: false,
      friction: 10,
      tension: 60,
    }).start();
  }, [isOpen, slideAnim]);

  // Hide when empty or on screens where the ticket builder shouldn't appear
  if (selections.length === 0) return null;
  if (activeRoute && HIDDEN_ROUTES.has(activeRoute)) return null;

  const tabBarVisible = activeRoute === TAB_ROOT_ROUTE;
  const bottomOffset = insets.bottom + (tabBarVisible ? TAB_BAR_HEIGHT : 0);

  const bodyHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_BODY_HEIGHT],
    extrapolate: 'clamp',
  });

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (confidenceIndex == null) return;
    const draft: TicketDraft = {
      selections,
      totalOdds: totalOdds(),
      confidenceIndex,
      visibility,
      priceCredits: visibility === 'PRIVATE' ? priceCredits : null,
    };
    closeTicketBuilder();
    if (navigationRef.isReady()) {
      navigationRef.navigate('TicketPreview', { draft });
    }
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={styles.container}>
        <TicketBuilderHeader
          count={selections.length}
          isOpen={isOpen}
          totalOdds={totalOdds()}
          onToggle={toggleTicketBuilder}
        />
        <Animated.View style={[styles.body, { maxHeight: bodyHeight }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selections list */}
            {selections.map((sel) => (
              <SelectionItem
                key={sel.selectionId}
                item={sel}
                onRemove={removeSelection}
              />
            ))}

            {/* Confidence index */}
            <View style={styles.section}>
              <ConfidenceSelector
                value={confidenceIndex}
                onChange={setConfidenceIndex}
              />
            </View>

            {/* Visibility */}
            <View style={styles.section}>
              <VisibilitySelector
                visibility={visibility}
                priceCredits={priceCredits}
                onVisibilityChange={setVisibility}
                onPriceChange={setPriceCredits}
              />
            </View>
          </ScrollView>

          <TicketBuilderFooter
            totalOdds={totalOdds()}
            count={selections.length}
            confidenceIndex={confidenceIndex}
            visibility={visibility}
            priceCredits={priceCredits}
            onClear={clear}
            onSubmit={handleSubmit}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 100,
        },
        container: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 20,
          overflow: 'hidden',
        },
        body: {
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        scrollContent: {
          padding: 12,
          paddingBottom: 4,
        },
        section: {
          marginTop: 8,
        },
      }),
    [colors]
  );

export default TicketBuilder;

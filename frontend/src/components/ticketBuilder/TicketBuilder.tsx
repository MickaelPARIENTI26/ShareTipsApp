/**
 * TicketBuilder — Constructeur de ticket flottant
 *
 * Composant principal pour créer un ticket de pronostic.
 * S'affiche en bas de l'écran avec un header collapsible
 * et un body contenant les sélections et options.
 *
 * @example
 * // Le composant s'utilise sans props, il gère son état via le store
 * <TicketBuilder />
 *
 * @example
 * // Variante glass
 * <TicketBuilder variant="glass" />
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Keyboard,
  InputAccessoryView,
  TouchableOpacity,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  effectGlass,
  effectGradients,
  effectShadows,
  springConfigs,
} from '../../theme';
import { useTicketBuilderStore } from '../../store/ticketBuilder.store';
import { navigationRef } from '../../navigation/navigationRef';
import TicketBuilderHeader from './TicketBuilderHeader';
import SelectionItem from './SelectionItem';
import VisibilitySelector, { PRICE_INPUT_ACCESSORY_ID } from './VisibilitySelector';
import TicketBuilderFooter from './TicketBuilderFooter';
import type { TicketDraft } from '../../types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TAB_BAR_HEIGHT = 52;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_BODY_HEIGHT = SCREEN_HEIGHT * 0.6;

/** Screens where the TicketBuilder should be hidden entirely */
const HIDDEN_ROUTES = new Set(['TicketPreview']);

/** The root route that has a visible tab bar */
const TAB_ROOT_ROUTE = 'MainTabs';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles disponibles */
export type TicketBuilderVariant = 'default' | 'glass' | 'minimal';

/** Props du composant TicketBuilder */
export interface TicketBuilderProps {
  /** Variante visuelle */
  variant?: TicketBuilderVariant;
  /** Active les animations */
  animated?: boolean;
  /** Affiche la bordure glass */
  glassBorder?: boolean;
  /** Utilise le blur sur iOS */
  useBlur?: boolean;
  /** Style personnalisé du wrapper */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const TicketBuilder: React.FC<TicketBuilderProps> = ({
  variant = 'default',
  animated = true,
  glassBorder = false,
  useBlur = true,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles(colors, variant, glassBorder);

  // ── Store state ────────────────────────────────────────────────
  const selections = useTicketBuilderStore((s) => s.selections);
  const isOpen = useTicketBuilderStore((s) => s.isOpen);
  const toggleTicketBuilder = useTicketBuilderStore((s) => s.toggleTicketBuilder);
  const removeSelection = useTicketBuilderStore((s) => s.removeSelection);
  const closeTicketBuilder = useTicketBuilderStore((s) => s.closeTicketBuilder);
  const clear = useTicketBuilderStore((s) => s.clear);
  const totalOdds = useTicketBuilderStore((s) => s.totalOdds);
  const visibility = useTicketBuilderStore((s) => s.visibility);
  const priceEur = useTicketBuilderStore((s) => s.priceEur);
  const setVisibility = useTicketBuilderStore((s) => s.setVisibility);
  const setPriceEur = useTicketBuilderStore((s) => s.setPriceEur);

  // ── Animations ─────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // ── Track active route to adjust bottom offset & visibility ────
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

  // ── Handlers ───────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isOpen) {
      Keyboard.dismiss();
    }
    toggleTicketBuilder();
  }, [isOpen, toggleTicketBuilder]);

  const handleClear = useCallback(() => {
    Keyboard.dismiss();
    clear();
  }, [clear]);

  const handleRemoveSelection = useCallback(
    (matchId: string) => {
      removeSelection(matchId);
    },
    [removeSelection]
  );

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    if (selections.length === 0) return;
    const draft: TicketDraft = {
      selections,
      totalOdds: totalOdds(),
      visibility,
      priceEur: visibility === 'PRIVATE' ? priceEur : null,
    };
    closeTicketBuilder();
    if (navigationRef.isReady()) {
      navigationRef.navigate('TicketPreview', { draft });
    }
  }, [
    selections,
    totalOdds,
    visibility,
    priceEur,
    closeTicketBuilder,
  ]);

  // ── Effects ────────────────────────────────────────────────────
  useEffect(() => {
    // Initial sync once navigator is ready
    if (navigationRef.isReady()) {
      syncRoute();
    }
    const unsubscribe = navigationRef.addListener('state', syncRoute);
    return unsubscribe;
  }, [syncRoute]);

  useEffect(() => {
    if (animated) {
      Animated.spring(slideAnim, {
        toValue: isOpen ? 1 : 0,
        ...springConfigs.default,
        useNativeDriver: false,
      }).start();
    } else {
      slideAnim.setValue(isOpen ? 1 : 0);
    }
  }, [isOpen, slideAnim, animated]);

  // ── Early returns ──────────────────────────────────────────────
  // Hide when empty or on screens where the ticket builder shouldn't appear
  if (selections.length === 0) return null;
  if (activeRoute && HIDDEN_ROUTES.has(activeRoute)) return null;

  // ── Computed values ────────────────────────────────────────────
  const tabBarVisible = activeRoute === TAB_ROOT_ROUTE;
  const bottomOffset = insets.bottom + (tabBarVisible ? TAB_BAR_HEIGHT : 0);

  const bodyHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_BODY_HEIGHT],
    extrapolate: 'clamp',
  });

  const bodyOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  // ── Determine child variants based on parent variant ──────────
  const childVariant = variant === 'glass' ? 'glass' : 'default';

  // ── Render selections list ─────────────────────────────────────
  const renderSelections = () => (
    <View style={styles.selectionsContainer}>
      {selections.map((sel, index) => (
        <SelectionItem
          key={sel.selectionId}
          item={sel}
          onRemove={handleRemoveSelection}
          variant={childVariant}
          animated={animated}
          animationDelay={index * 50}
        />
      ))}
    </View>
  );

  // ── Render body content ────────────────────────────────────────
  const renderBody = () => (
    <Animated.View
      style={[
        styles.body,
        { maxHeight: bodyHeight, opacity: bodyOpacity },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selections list */}
        {renderSelections()}

        {/* Visibility */}
        <View style={styles.section}>
          <VisibilitySelector
            visibility={visibility}
            priceEur={priceEur}
            onVisibilityChange={setVisibility}
            onPriceChange={setPriceEur}
            variant={childVariant}
            animated={animated}
          />
        </View>
      </ScrollView>

      <TicketBuilderFooter
        totalOdds={totalOdds()}
        count={selections.length}
        visibility={visibility}
        priceEur={priceEur}
        onClear={handleClear}
        onSubmit={handleSubmit}
        variant={childVariant}
        animated={animated}
      />
    </Animated.View>
  );

  // ── Render container based on variant ──────────────────────────
  const renderContainer = () => {
    if (variant === 'glass' && Platform.OS === 'ios' && useBlur) {
      return (
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.glassOverlay}>
            <TicketBuilderHeader
              count={selections.length}
              isOpen={isOpen}
              totalOdds={totalOdds()}
              onToggle={handleToggle}
              variant="glass"
              animated={animated}
            />
            {renderBody()}
          </View>
        </BlurView>
      );
    }

    if (variant === 'glass') {
      return (
        <LinearGradient
          colors={effectGradients.cardGlass.colors}
          start={effectGradients.cardGlass.start}
          end={effectGradients.cardGlass.end}
          style={styles.container}
        >
          <TicketBuilderHeader
            count={selections.length}
            isOpen={isOpen}
            totalOdds={totalOdds()}
            onToggle={handleToggle}
            variant="glass"
            animated={animated}
          />
          {renderBody()}
        </LinearGradient>
      );
    }

    return (
      <View style={styles.container}>
        <TicketBuilderHeader
          count={selections.length}
          isOpen={isOpen}
          totalOdds={totalOdds()}
          onToggle={handleToggle}
          variant={variant === 'minimal' ? 'minimal' : 'gradient'}
          animated={animated}
        />
        {renderBody()}
      </View>
    );
  };

  // ── Render InputAccessoryView ──────────────────────────────────
  const renderAccessoryView = () => {
    if (Platform.OS !== 'ios') return null;

    return (
      <InputAccessoryView nativeID={PRICE_INPUT_ACCESSORY_ID}>
        <LinearGradient
          colors={['rgba(30, 30, 30, 0.98)', 'rgba(20, 20, 20, 1)']}
          style={styles.accessoryBar}
        >
          <View style={styles.accessoryBarSpacer} />
          <TouchableOpacity
            style={styles.accessoryBtn}
            onPress={() => Keyboard.dismiss()}
            activeOpacity={0.8}
            accessibilityLabel="Fermer le clavier"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={effectGradients.primary.colors}
              start={effectGradients.primary.start}
              end={effectGradients.primary.end}
              style={styles.accessoryBtnGradient}
            >
              <Text style={styles.accessoryBtnText}>Terminé</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </InputAccessoryView>
    );
  };

  // ── Main render ────────────────────────────────────────────────
  return (
    <>
      <Animated.View
        testID="ticket-builder"
        style={[
          styles.wrapper,
          { bottom: bottomOffset },
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          style,
        ]}
        accessibilityLabel={`Constructeur de ticket, ${selections.length} sélections`}
        accessibilityRole="none"
      >
        {renderContainer()}
      </Animated.View>

      {renderAccessoryView()}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  variant: TicketBuilderVariant,
  glassBorder: boolean
) =>
  useMemo(() => {
    const isGlass = variant === 'glass';
    const isMinimal = variant === 'minimal';

    return StyleSheet.create({
      wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 100,
      },
      container: {
        backgroundColor: isGlass ? 'transparent' : colors.surface,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        borderWidth: isMinimal ? 0 : 1,
        borderBottomWidth: 0,
        borderColor: isGlass
          ? glassBorder
            ? effectGlass.primary.borderColor
            : effectGlass.card.borderColor
          : colors.border,
        ...Platform.select({
          ios: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: isGlass ? 0.25 : 0.15,
            shadowRadius: 20,
          },
          android: {
            elevation: 24,
          },
        }),
        overflow: 'hidden',
      },
      blurContainer: {
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: glassBorder
          ? effectGlass.primary.borderColor
          : effectGlass.card.borderColor,
        ...effectShadows.glowPrimarySubtle,
      },
      glassOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      body: {
        backgroundColor: isGlass
          ? 'rgba(0, 0, 0, 0.2)'
          : colors.background,
        overflow: 'hidden',
      },
      scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xs,
      },
      selectionsContainer: {
        gap: spacing.xs,
      },
      section: {
        marginTop: spacing.md,
      },
      accessoryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: effectGlass.light.borderColor,
      },
      accessoryBarSpacer: {
        flex: 1,
      },
      accessoryBtn: {
        borderRadius: radius.md,
        overflow: 'hidden',
      },
      accessoryBtnGradient: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      },
      accessoryBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textOnPrimary,
        letterSpacing: 0.3,
      },
    });
  }, [colors, variant, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESETS — Variantes pré-configurées
// ═══════════════════════════════════════════════════════════════

/**
 * TicketBuilder par défaut
 */
export const DefaultTicketBuilder: React.FC<TicketBuilderProps> = (props) => (
  <TicketBuilder {...props} variant="default" />
);

/**
 * TicketBuilder avec effet glassmorphism
 */
export const GlassTicketBuilder: React.FC<TicketBuilderProps> = (props) => (
  <TicketBuilder {...props} variant="glass" glassBorder />
);

/**
 * TicketBuilder minimal
 */
export const MinimalTicketBuilder: React.FC<TicketBuilderProps> = (props) => (
  <TicketBuilder {...props} variant="minimal" />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(TicketBuilder);

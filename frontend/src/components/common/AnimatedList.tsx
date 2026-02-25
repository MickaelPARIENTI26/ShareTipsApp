/**
 * AnimatedList — Composant de liste avec animations d'entree staggered
 *
 * Wrapper pour FlatList qui ajoute automatiquement des animations
 * d'entree staggered a chaque element de la liste.
 *
 * @example
 * // Usage basique
 * <AnimatedList
 *   data={matches}
 *   renderItem={({ item }) => <MatchCard match={item} />}
 *   keyExtractor={(item) => item.id}
 * />
 *
 * @example
 * // Avec options d'animation personnalisees
 * <AnimatedList
 *   data={tickets}
 *   renderItem={({ item }) => <TicketCard ticket={item} />}
 *   animationConfig={{
 *     stagger: 80,
 *     direction: 'left',
 *     distance: 30,
 *   }}
 * />
 */

import React, { useRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  Animated,
  View,
  StyleSheet,
  type FlatListProps,
  type ListRenderItem,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

import { type EntranceDirection } from '../../hooks/useEntranceAnimation';
import { springConfigs } from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Configuration de l'animation */
export interface AnimationConfig {
  /** Delai entre chaque element en ms (defaut: 50) */
  stagger?: number;
  /** Delai initial avant le debut des animations (defaut: 0) */
  initialDelay?: number;
  /** Direction de l'animation (defaut: 'up') */
  direction?: EntranceDirection;
  /** Distance de deplacement en pixels (defaut: 20) */
  distance?: number;
  /** Duree de l'animation fade en ms (defaut: 300) */
  duration?: number;
  /** Utiliser spring au lieu de timing (defaut: true) */
  useSpring?: boolean;
  /** Nombre max d'elements a animer (defaut: 10) */
  maxAnimatedItems?: number;
}

/** Props du composant */
export interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  /** Fonction de rendu des items */
  renderItem: ListRenderItem<T>;
  /** Configuration de l'animation */
  animationConfig?: AnimationConfig;
  /** Style du conteneur anime */
  animatedItemStyle?: StyleProp<ViewStyle>;
  /** Desactiver les animations */
  disableAnimation?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED ITEM WRAPPER
// ═══════════════════════════════════════════════════════════════

interface AnimatedItemProps {
  index: number;
  children: React.ReactNode;
  config: Required<AnimationConfig>;
  style?: StyleProp<ViewStyle>;
  disabled: boolean;
}

const AnimatedItem: React.FC<AnimatedItemProps> = React.memo(
  ({ index, children, config, style, disabled }) => {
    const { stagger, initialDelay, direction, distance, duration, useSpring, maxAnimatedItems } =
      config;

    // Ne pas animer au-dela de maxAnimatedItems
    const shouldAnimate = !disabled && index < maxAnimatedItems;

    // Valeurs animees
    const opacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
    const translateX = useRef(
      new Animated.Value(
        shouldAnimate
          ? direction === 'left'
            ? -distance
            : direction === 'right'
              ? distance
              : 0
          : 0
      )
    ).current;
    const translateY = useRef(
      new Animated.Value(
        shouldAnimate
          ? direction === 'up'
            ? distance
            : direction === 'down'
              ? -distance
              : 0
          : 0
      )
    ).current;
    const scale = useRef(
      new Animated.Value(shouldAnimate && direction === 'scale' ? 0.8 : 1)
    ).current;

    // Animation au mount
    const hasAnimated = useRef(false);

    React.useEffect(() => {
      if (!shouldAnimate || hasAnimated.current) return;
      hasAnimated.current = true;

      const delay = initialDelay + index * stagger;

      const opacityAnim = Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      });

      const translateXAnim = useSpring
        ? Animated.spring(translateX, {
            toValue: 0,
            delay,
            ...springConfigs.snappy,
            useNativeDriver: true,
          })
        : Animated.timing(translateX, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          });

      const translateYAnim = useSpring
        ? Animated.spring(translateY, {
            toValue: 0,
            delay,
            ...springConfigs.snappy,
            useNativeDriver: true,
          })
        : Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          });

      const scaleAnim = useSpring
        ? Animated.spring(scale, {
            toValue: 1,
            delay,
            ...springConfigs.bouncy,
            useNativeDriver: true,
          })
        : Animated.timing(scale, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          });

      Animated.parallel([opacityAnim, translateXAnim, translateYAnim, scaleAnim]).start();
    }, [shouldAnimate]);

    const animatedStyle = useMemo(
      () => ({
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }),
      [opacity, translateX, translateY, scale]
    );

    return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
  }
);

AnimatedItem.displayName = 'AnimatedItem';

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: Required<AnimationConfig> = {
  stagger: 50,
  initialDelay: 0,
  direction: 'up',
  distance: 20,
  duration: 300,
  useSpring: true,
  maxAnimatedItems: 10,
};

function AnimatedListInner<T>(
  props: AnimatedListProps<T>,
  ref: React.ForwardedRef<FlatList<T>>
) {
  const {
    renderItem,
    animationConfig,
    animatedItemStyle,
    disableAnimation = false,
    ...flatListProps
  } = props;

  // Merge config with defaults
  const config = useMemo<Required<AnimationConfig>>(
    () => ({
      ...DEFAULT_CONFIG,
      ...animationConfig,
    }),
    [animationConfig]
  );

  // Wrapper pour renderItem avec animation
  const animatedRenderItem: ListRenderItem<T> = useCallback(
    (info) => (
      <AnimatedItem
        index={info.index}
        config={config}
        style={animatedItemStyle}
        disabled={disableAnimation}
      >
        {renderItem(info)}
      </AnimatedItem>
    ),
    [renderItem, config, animatedItemStyle, disableAnimation]
  );

  return <FlatList {...flatListProps} ref={ref} renderItem={animatedRenderItem} />;
}

// Typed forwardRef pour les generics
export const AnimatedList = React.forwardRef(AnimatedListInner) as <T>(
  props: AnimatedListProps<T> & { ref?: React.ForwardedRef<FlatList<T>> }
) => React.ReactElement;

// ═══════════════════════════════════════════════════════════════
// SECTION LIST VERSION
// ═══════════════════════════════════════════════════════════════

import {
  SectionList,
  type SectionListProps,
  type SectionListRenderItem,
  type DefaultSectionT,
} from 'react-native';

/** Props du composant SectionList anime */
export interface AnimatedSectionListProps<T, S = DefaultSectionT>
  extends Omit<SectionListProps<T, S>, 'renderItem'> {
  /** Fonction de rendu des items */
  renderItem: SectionListRenderItem<T, S>;
  /** Configuration de l'animation */
  animationConfig?: AnimationConfig;
  /** Style du conteneur anime */
  animatedItemStyle?: StyleProp<ViewStyle>;
  /** Desactiver les animations */
  disableAnimation?: boolean;
}

function AnimatedSectionListInner<T, S = DefaultSectionT>(
  props: AnimatedSectionListProps<T, S>,
  ref: React.ForwardedRef<SectionList<T, S>>
) {
  const {
    renderItem,
    animationConfig,
    animatedItemStyle,
    disableAnimation = false,
    ...sectionListProps
  } = props;

  // Merge config with defaults
  const config = useMemo<Required<AnimationConfig>>(
    () => ({
      ...DEFAULT_CONFIG,
      ...animationConfig,
    }),
    [animationConfig]
  );

  // Compteur global pour l'index d'animation
  const globalIndex = useRef(0);

  // Reset le compteur quand les sections changent
  React.useEffect(() => {
    globalIndex.current = 0;
  }, [sectionListProps.sections]);

  // Wrapper pour renderItem avec animation
  const animatedRenderItem: SectionListRenderItem<T, S> = useCallback(
    (info) => {
      const currentIndex = globalIndex.current++;
      return (
        <AnimatedItem
          index={currentIndex}
          config={config}
          style={animatedItemStyle}
          disabled={disableAnimation}
        >
          {renderItem(info)}
        </AnimatedItem>
      );
    },
    [renderItem, config, animatedItemStyle, disableAnimation]
  );

  return (
    <SectionList {...sectionListProps} ref={ref} renderItem={animatedRenderItem} />
  );
}

// Typed forwardRef pour les generics
export const AnimatedSectionList = React.forwardRef(AnimatedSectionListInner) as <
  T,
  S = DefaultSectionT
>(
  props: AnimatedSectionListProps<T, S> & { ref?: React.ForwardedRef<SectionList<T, S>> }
) => React.ReactElement;

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * AnimatedList preset pour les listes de matchs
 */
export const MatchAnimatedList = <T,>(props: AnimatedListProps<T>) => (
  <AnimatedList
    {...props}
    animationConfig={{
      stagger: 40,
      direction: 'up',
      distance: 15,
      ...props.animationConfig,
    }}
  />
);

/**
 * AnimatedList preset pour les cards
 */
export const CardAnimatedList = <T,>(props: AnimatedListProps<T>) => (
  <AnimatedList
    {...props}
    animationConfig={{
      stagger: 80,
      direction: 'up',
      distance: 25,
      initialDelay: 100,
      ...props.animationConfig,
    }}
  />
);

/**
 * AnimatedList preset pour slide lateral
 */
export const SlideAnimatedList = <T,>(props: AnimatedListProps<T>) => (
  <AnimatedList
    {...props}
    animationConfig={{
      stagger: 60,
      direction: 'left',
      distance: 30,
      ...props.animationConfig,
    }}
  />
);

/**
 * AnimatedList preset pour fade simple
 */
export const FadeAnimatedList = <T,>(props: AnimatedListProps<T>) => (
  <AnimatedList
    {...props}
    animationConfig={{
      stagger: 50,
      direction: 'fade',
      distance: 0,
      ...props.animationConfig,
    }}
  />
);

/**
 * AnimatedList preset avec effet scale
 */
export const ScaleAnimatedList = <T,>(props: AnimatedListProps<T>) => (
  <AnimatedList
    {...props}
    animationConfig={{
      stagger: 100,
      direction: 'scale',
      initialDelay: 150,
      ...props.animationConfig,
    }}
  />
);

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default AnimatedList;

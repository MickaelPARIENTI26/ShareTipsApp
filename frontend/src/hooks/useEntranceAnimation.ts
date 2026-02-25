/**
 * useEntranceAnimation — Hook pour animations d'entree staggered
 *
 * Cree des animations d'entree fluides avec effet stagger
 * pour les elements d'une liste ou d'un ecran.
 *
 * @example
 * // Usage basique
 * const { animatedStyles, triggerEntrance } = useEntranceAnimation({ count: 4 });
 *
 * return (
 *   <View>
 *     <Animated.View style={animatedStyles[0]}><Card1 /></Animated.View>
 *     <Animated.View style={animatedStyles[1]}><Card2 /></Animated.View>
 *     <Animated.View style={animatedStyles[2]}><Card3 /></Animated.View>
 *     <Animated.View style={animatedStyles[3]}><Card4 /></Animated.View>
 *   </View>
 * );
 *
 * @example
 * // Avec options personnalisees
 * const { animatedStyles } = useEntranceAnimation({
 *   count: 5,
 *   stagger: 80,
 *   initialDelay: 200,
 *   direction: 'up',
 *   distance: 30,
 * });
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated, type ViewStyle } from 'react-native';

import { springConfigs } from '../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Direction de l'animation d'entree */
export type EntranceDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

/** Configuration du hook */
export interface UseEntranceAnimationConfig {
  /** Nombre d'elements a animer */
  count: number;
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
  /** Declencher automatiquement au mount (defaut: true) */
  autoTrigger?: boolean;
  /** Utiliser spring au lieu de timing (defaut: true) */
  useSpring?: boolean;
}

/** Valeurs animees pour un element */
interface AnimationValues {
  opacity: Animated.Value;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
}

/** Retour du hook */
export interface UseEntranceAnimationReturn {
  /** Styles animes pour chaque element */
  animatedStyles: Animated.WithAnimatedObject<ViewStyle>[];
  /** Declencher manuellement l'animation */
  triggerEntrance: () => void;
  /** Reinitialiser les animations */
  reset: () => void;
  /** Indique si l'animation est en cours */
  isAnimating: boolean;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export const useEntranceAnimation = ({
  count,
  stagger = 50,
  initialDelay = 0,
  direction = 'up',
  distance = 20,
  duration = 300,
  autoTrigger = true,
  useSpring = true,
}: UseEntranceAnimationConfig): UseEntranceAnimationReturn => {
  // Creer les valeurs animees pour chaque element
  const animations = useRef<AnimationValues[]>(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(
        direction === 'left' ? -distance : direction === 'right' ? distance : 0
      ),
      translateY: new Animated.Value(
        direction === 'up' ? distance : direction === 'down' ? -distance : 0
      ),
      scale: new Animated.Value(direction === 'scale' ? 0.8 : 1),
    }))
  ).current;

  const isAnimatingRef = useRef(false);

  // Reinitialiser les animations
  const reset = useCallback(() => {
    animations.forEach((anim) => {
      anim.opacity.setValue(0);
      anim.translateX.setValue(
        direction === 'left' ? -distance : direction === 'right' ? distance : 0
      );
      anim.translateY.setValue(
        direction === 'up' ? distance : direction === 'down' ? -distance : 0
      );
      anim.scale.setValue(direction === 'scale' ? 0.8 : 1);
    });
    isAnimatingRef.current = false;
  }, [animations, direction, distance]);

  // Declencher l'animation
  const triggerEntrance = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const animationSequence = animations.map((anim, index) => {
      const delay = initialDelay + index * stagger;

      const opacityAnim = Animated.timing(anim.opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      });

      const translateXAnim = useSpring
        ? Animated.spring(anim.translateX, {
            toValue: 0,
            delay,
            ...springConfigs.snappy,
            useNativeDriver: true,
          })
        : Animated.timing(anim.translateX, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          });

      const translateYAnim = useSpring
        ? Animated.spring(anim.translateY, {
            toValue: 0,
            delay,
            ...springConfigs.snappy,
            useNativeDriver: true,
          })
        : Animated.timing(anim.translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          });

      const scaleAnim = useSpring
        ? Animated.spring(anim.scale, {
            toValue: 1,
            delay,
            ...springConfigs.bouncy,
            useNativeDriver: true,
          })
        : Animated.timing(anim.scale, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          });

      return Animated.parallel([opacityAnim, translateXAnim, translateYAnim, scaleAnim]);
    });

    Animated.parallel(animationSequence).start(() => {
      isAnimatingRef.current = false;
    });
  }, [animations, initialDelay, stagger, duration, useSpring]);

  // Auto-trigger au mount
  useEffect(() => {
    if (autoTrigger) {
      triggerEntrance();
    }
  }, [autoTrigger, triggerEntrance]);

  // Generer les styles animes
  const animatedStyles = useMemo(
    () =>
      animations.map((anim) => ({
        opacity: anim.opacity,
        transform: [
          { translateX: anim.translateX },
          { translateY: anim.translateY },
          { scale: anim.scale },
        ],
      })),
    [animations]
  );

  return {
    animatedStyles,
    triggerEntrance,
    reset,
    isAnimating: isAnimatingRef.current,
  };
};

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

/**
 * Preset pour animation de liste (stagger rapide)
 */
export const useListEntranceAnimation = (count: number) =>
  useEntranceAnimation({
    count,
    stagger: 40,
    direction: 'up',
    distance: 15,
  });

/**
 * Preset pour animation de cards (stagger moyen)
 */
export const useCardEntranceAnimation = (count: number) =>
  useEntranceAnimation({
    count,
    stagger: 80,
    direction: 'up',
    distance: 25,
    initialDelay: 100,
  });

/**
 * Preset pour animation de dashboard (effet scale)
 */
export const useDashboardEntranceAnimation = (count: number) =>
  useEntranceAnimation({
    count,
    stagger: 100,
    direction: 'scale',
    initialDelay: 150,
  });

/**
 * Preset pour animation laterale (de la gauche)
 */
export const useSlideInAnimation = (count: number) =>
  useEntranceAnimation({
    count,
    stagger: 60,
    direction: 'left',
    distance: 30,
  });

/**
 * Preset pour animation fade simple
 */
export const useFadeInAnimation = (count: number) =>
  useEntranceAnimation({
    count,
    stagger: 50,
    direction: 'fade',
    distance: 0,
  });

export default useEntranceAnimation;

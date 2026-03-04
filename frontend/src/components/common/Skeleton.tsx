/**
 * Skeleton — Composants de chargement premium
 *
 * Collection de composants skeleton avec animation shimmer
 * pour afficher des placeholders pendant le chargement.
 *
 * @example
 * // Skeleton basique
 * <Skeleton width={200} height={16} />
 *
 * @example
 * // Skeleton circulaire (avatar)
 * <Skeleton variant="circle" size={48} />
 *
 * @example
 * // Skeleton de carte
 * <SkeletonCard />
 *
 * @example
 * // Groupe de skeletons avec stagger
 * <SkeletonGroup count={3} stagger={100}>
 *   <Skeleton width="100%" height={80} />
 * </SkeletonGroup>
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type DimensionValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes de skeleton */
export type SkeletonVariant = 'rect' | 'text' | 'circle' | 'rounded';

/** Props du composant Skeleton */
export interface SkeletonProps {
  /** Largeur (nombre ou pourcentage) */
  width?: number | string;
  /** Hauteur */
  height?: number;
  /** Taille (pour circle, remplace width/height) */
  size?: number;
  /** Variante visuelle */
  variant?: SkeletonVariant;
  /** Border radius personnalisé */
  borderRadius?: number;
  /** Active l'animation shimmer */
  animated?: boolean;
  /** Durée de l'animation en ms */
  animationDuration?: number;
  /** Délai avant le début de l'animation */
  animationDelay?: number;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
}

/** Props du SkeletonGroup */
export interface SkeletonGroupProps {
  /** Nombre de répétitions */
  count: number;
  /** Délai entre chaque élément */
  stagger?: number;
  /** Espacement entre les éléments */
  gap?: number;
  /** Direction du groupe */
  direction?: 'column' | 'row';
  /** Enfants à répéter */
  children: React.ReactElement<SkeletonProps>;
  /** Style du container */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const VARIANT_RADIUS: Record<SkeletonVariant, number> = {
  rect: 0,
  text: radius.sm,
  circle: 9999,
  rounded: radius.md,
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT SKELETON
// ═══════════════════════════════════════════════════════════════

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  size,
  variant = 'rounded',
  borderRadius: customBorderRadius,
  animated = true,
  animationDuration = 1200,
  animationDelay = 0,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Dimensions
  const finalWidth = size ?? width;
  const finalHeight = size ?? height;
  const finalBorderRadius =
    customBorderRadius ?? (variant === 'circle' ? 9999 : VARIANT_RADIUS[variant]);

  // Animation shimmer
  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: animationDuration,
        delay: animationDelay,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animated, animationDuration, animationDelay, shimmerAnim]);

  // Interpolation pour le shimmer
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const styles = useSkeletonStyles(
    colors,
    finalWidth as DimensionValue,
    finalHeight,
    finalBorderRadius
  );

  return (
    <View style={[styles.container, style]}>
      {animated && (
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              `${colors.border}40`,
              `${colors.border}60`,
              `${colors.border}40`,
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

const useSkeletonStyles = (
  colors: ThemeColors,
  width: DimensionValue,
  height: number,
  borderRadius: number
) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceElevated,
          overflow: 'hidden',
        },
        shimmer: {
          ...StyleSheet.absoluteFillObject,
          width: 200,
        },
      }),
    [colors, width, height, borderRadius]
  );

// ═══════════════════════════════════════════════════════════════
// SKELETON GROUP
// ═══════════════════════════════════════════════════════════════

const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count,
  stagger = 100,
  gap = spacing.sm,
  direction = 'column',
  children,
  style,
}) => {
  const groupStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: direction,
          gap,
        },
      }),
    [direction, gap]
  );

  return (
    <View style={[groupStyles.container, style]}>
      {Array.from({ length: count }, (_, index) =>
        React.cloneElement(children, {
          key: index,
          animationDelay: index * stagger,
        })
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// PRESETS — Skeletons pré-configurés
// ═══════════════════════════════════════════════════════════════

/**
 * Skeleton pour une ligne de texte
 */
export const SkeletonText: React.FC<{
  width?: number | string;
  lines?: number;
  lineHeight?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '100%', lines = 1, lineHeight = 14, gap = spacing.xs, style }) => {
  const { colors } = useTheme();

  if (lines === 1) {
    return <Skeleton width={width} height={lineHeight} variant="text" style={style} />;
  }

  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : width}
          height={lineHeight}
          variant="text"
          animationDelay={index * 80}
        />
      ))}
    </View>
  );
};

/**
 * Skeleton pour un avatar
 */
export const SkeletonAvatar: React.FC<{
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ size = 48, style }) => (
  <Skeleton variant="circle" size={size} style={style} />
);

/**
 * Skeleton pour un badge
 */
export const SkeletonBadge: React.FC<{
  width?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = 60, style }) => (
  <Skeleton width={width} height={24} borderRadius={radius.full} style={style} />
);

/**
 * Skeleton pour un bouton
 */
export const SkeletonButton: React.FC<{
  width?: number | string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '100%', height = 48, style }) => (
  <Skeleton width={width} height={height} borderRadius={radius.lg} style={style} />
);

/**
 * Skeleton pour une carte Match
 */
export const SkeletonMatchCard: React.FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  const { colors } = useTheme();
  const styles = useMatchCardStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Header: League + Time */}
      <View style={styles.header}>
        <Skeleton width={100} height={14} variant="text" />
        <Skeleton width={50} height={14} variant="text" animationDelay={50} />
      </View>

      {/* Teams */}
      <View style={styles.teamsRow}>
        {/* Team 1 */}
        <View style={styles.team}>
          <SkeletonAvatar size={36} />
          <Skeleton width={80} height={14} variant="text" animationDelay={100} />
        </View>

        {/* VS */}
        <Skeleton width={30} height={20} borderRadius={radius.sm} animationDelay={150} />

        {/* Team 2 */}
        <View style={styles.team}>
          <SkeletonAvatar size={36} />
          <Skeleton width={80} height={14} variant="text" animationDelay={200} />
        </View>
      </View>

      {/* Odds */}
      <View style={styles.oddsRow}>
        <Skeleton width="30%" height={44} borderRadius={radius.md} animationDelay={250} />
        <Skeleton width="30%" height={44} borderRadius={radius.md} animationDelay={300} />
        <Skeleton width="30%" height={44} borderRadius={radius.md} animationDelay={350} />
      </View>
    </View>
  );
};

const useMatchCardStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        teamsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        team: {
          alignItems: 'center',
          gap: spacing.xs,
          flex: 1,
        },
        oddsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
      }),
    [colors]
  );

/**
 * Skeleton pour une carte Ticket
 */
export const SkeletonTicketCard: React.FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  const { colors } = useTheme();
  const styles = useTicketCardStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBadge width={70} />
          <Skeleton width={60} height={12} variant="text" animationDelay={50} />
        </View>
        <SkeletonBadge width={50} />
      </View>

      {/* Selections preview */}
      <View style={styles.selectionsRow}>
        <Skeleton width="100%" height={16} variant="text" animationDelay={100} />
        <Skeleton width="80%" height={16} variant="text" animationDelay={150} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Skeleton width={40} height={10} variant="text" animationDelay={200} />
          <Skeleton width={50} height={18} variant="text" animationDelay={250} />
        </View>
        <View style={styles.footerItem}>
          <Skeleton width={50} height={10} variant="text" animationDelay={300} />
          <Skeleton width={40} height={18} variant="text" animationDelay={350} />
        </View>
        <View style={styles.footerItem}>
          <Skeleton width={45} height={10} variant="text" animationDelay={400} />
          <Skeleton width={55} height={18} variant="text" animationDelay={450} />
        </View>
      </View>
    </View>
  );
};

const useTicketCardStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        selectionsRow: {
          gap: spacing.xs,
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        footerItem: {
          alignItems: 'center',
          gap: spacing.xxs,
        },
      }),
    [colors]
  );

/**
 * Skeleton pour une ligne de transaction
 */
export const SkeletonTransactionRow: React.FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  const { colors } = useTheme();
  const styles = useTransactionRowStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      <Skeleton variant="circle" size={40} />

      {/* Info */}
      <View style={styles.info}>
        <Skeleton width={120} height={14} variant="text" animationDelay={50} />
        <Skeleton width={80} height={12} variant="text" animationDelay={100} />
      </View>

      {/* Amount */}
      <View style={styles.amount}>
        <Skeleton width={60} height={16} variant="text" animationDelay={150} />
        <Skeleton width={40} height={10} variant="text" animationDelay={200} />
      </View>
    </View>
  );
};

const useTransactionRowStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.md,
        },
        info: {
          flex: 1,
          gap: spacing.xxs,
        },
        amount: {
          alignItems: 'flex-end',
          gap: spacing.xxs,
        },
      }),
    [colors]
  );

/**
 * Skeleton pour le profil utilisateur
 */
export const SkeletonProfile: React.FC<{
  style?: StyleProp<ViewStyle>;
}> = ({ style }) => {
  const { colors } = useTheme();
  const styles = useProfileStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <SkeletonAvatar size={80} />

      {/* Name & Username */}
      <View style={styles.nameSection}>
        <Skeleton width={150} height={20} variant="text" animationDelay={50} />
        <Skeleton width={100} height={14} variant="text" animationDelay={100} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statItem}>
            <Skeleton width={40} height={24} variant="text" animationDelay={150 + i * 50} />
            <Skeleton width={60} height={12} variant="text" animationDelay={200 + i * 50} />
          </View>
        ))}
      </View>
    </View>
  );
};

const useProfileStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          padding: spacing.lg,
          gap: spacing.md,
        },
        nameSection: {
          alignItems: 'center',
          gap: spacing.xs,
        },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%',
          paddingTop: spacing.md,
        },
        statItem: {
          alignItems: 'center',
          gap: spacing.xxs,
        },
      }),
    [colors]
  );

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS DE LISTE
// ═══════════════════════════════════════════════════════════════

/**
 * Liste de SkeletonMatchCard
 */
export const SkeletonMatchList: React.FC<{
  count?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ count = 3, style }) => (
  <View style={[{ gap: spacing.md }, style]}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonMatchCard key={index} />
    ))}
  </View>
);

/**
 * Liste de SkeletonTicketCard
 */
export const SkeletonTicketList: React.FC<{
  count?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ count = 3, style }) => (
  <View style={[{ gap: spacing.md }, style]}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonTicketCard key={index} />
    ))}
  </View>
);

/**
 * Liste de SkeletonTransactionRow
 */
export const SkeletonTransactionList: React.FC<{
  count?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ count = 5, style }) => (
  <View style={[{ gap: spacing.sm }, style]}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonTransactionRow key={index} />
    ))}
  </View>
);

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { Skeleton, SkeletonGroup };
export default Skeleton;

/**
 * CachedImage — Composant Image Premium avec Cache
 *
 * Image haute performance avec mise en cache automatique,
 * animations de chargement, et effets visuels premium.
 *
 * Fonctionnalités :
 * - Cache disque et mémoire automatique (expo-image)
 * - Animation shimmer pendant le chargement
 * - Effet de pression (scale) si pressable
 * - Variantes : default, avatar, card, thumbnail, hero
 * - Formes : square, rounded, circle
 * - Overlay gradient optionnel
 * - Bordure glassmorphism optionnelle
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useTheme,
  type ThemeColors,
  radius,
  spacing,
  effectGlass,
  effectGradients,
  springConfigs,
} from '../../theme';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du composant */
export type CachedImageVariant = 'default' | 'avatar' | 'card' | 'thumbnail' | 'hero';

/** Formes disponibles */
export type CachedImageShape = 'square' | 'rounded' | 'circle';

/** Tailles prédéfinies */
export type CachedImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Type d'overlay */
export type OverlayType = 'none' | 'gradient' | 'dark' | 'primary';

export interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /** URL de l'image */
  uri?: string;
  /** Source alternative (pour images locales) */
  source?: ImageSource;
  /** Icône de fallback si pas d'image */
  fallbackIcon?: React.ReactNode;
  /** Style du container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Variante visuelle */
  variant?: CachedImageVariant;
  /** Forme de l'image */
  shape?: CachedImageShape;
  /** Taille prédéfinie */
  size?: CachedImageSize;
  /** Activer l'effet de pression */
  pressable?: boolean;
  /** Callback au press */
  onPress?: () => void;
  /** Callback au long press */
  onLongPress?: () => void;
  /** Afficher animation shimmer au chargement */
  showShimmer?: boolean;
  /** Type d'overlay */
  overlay?: OverlayType;
  /** Bordure glassmorphism */
  glassBorder?: boolean;
  /** Désactivé (opacité réduite) */
  disabled?: boolean;
  /** Accessibilité : label */
  accessibilityLabel?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const SIZE_MAP: Record<CachedImageSize, number> = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
  full: -1, // -1 signifie 100%
};

const SHAPE_RADIUS: Record<CachedImageShape, number | 'full'> = {
  square: 0,
  rounded: radius.lg,
  circle: 'full',
};

const VARIANT_CONFIG: Record<
  CachedImageVariant,
  { shape: CachedImageShape; glassBorder: boolean; showShimmer: boolean }
> = {
  default: { shape: 'rounded', glassBorder: false, showShimmer: true },
  avatar: { shape: 'circle', glassBorder: true, showShimmer: true },
  card: { shape: 'rounded', glassBorder: false, showShimmer: true },
  thumbnail: { shape: 'rounded', glassBorder: false, showShimmer: true },
  hero: { shape: 'square', glassBorder: false, showShimmer: true },
};

// ═══════════════════════════════════════════════════════════════
// SHIMMER COMPONENT
// ═══════════════════════════════════════════════════════════════

const ShimmerOverlay: React.FC<{ colors: ThemeColors }> = React.memo(({ colors }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.skeleton, overflow: 'hidden' }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[...effectGradients.shimmer.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
});

ShimmerOverlay.displayName = 'ShimmerOverlay';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  source,
  style,
  fallbackIcon,
  containerStyle,
  placeholder,
  contentFit = 'cover',
  transition = 300,
  variant = 'default',
  shape: customShape,
  size,
  pressable = false,
  onPress,
  onLongPress,
  showShimmer: customShowShimmer,
  overlay = 'none',
  glassBorder: customGlassBorder,
  disabled = false,
  accessibilityLabel,
  ...rest
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Configuration basée sur variant ────────────────────────────
  const variantConfig = VARIANT_CONFIG[variant];
  const shape = customShape ?? variantConfig.shape;
  const showShimmer = customShowShimmer ?? variantConfig.showShimmer;
  const glassBorder = customGlassBorder ?? variantConfig.glassBorder;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(colors, shape, size, glassBorder);

  // ── Handlers ───────────────────────────────────────────────────
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handlePressIn = useCallback(() => {
    if (!pressable || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      ...springConfigs.button,
    }).start();
  }, [pressable, disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!pressable || disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfigs.snappy,
    }).start();
  }, [pressable, disabled, scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled) return;
    onLongPress?.();
  }, [disabled, onLongPress]);

  // ── Overlay rendering ──────────────────────────────────────────
  const renderOverlay = useMemo(() => {
    if (overlay === 'none') return null;

    const overlayGradients: Record<Exclude<OverlayType, 'none'>, readonly string[]> = {
      gradient: ['transparent', 'rgba(0, 0, 0, 0.7)'],
      dark: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)'],
      primary: ['rgba(30, 215, 96, 0.2)', 'rgba(30, 215, 96, 0.4)'],
    };

    return (
      <LinearGradient
        colors={overlayGradients[overlay] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.overlay]}
        pointerEvents="none"
      />
    );
  }, [overlay, styles.overlay]);

  // ── Fallback rendering ─────────────────────────────────────────
  const showFallback = (!uri && !source) || hasError;

  if (showFallback) {
    if (fallbackIcon) {
      const content = (
        <Animated.View
          style={[
            styles.container,
            styles.fallbackContainer,
            containerStyle,
            style,
            { transform: [{ scale: scaleAnim }] },
            disabled && styles.disabled,
          ]}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="image"
        >
          {fallbackIcon}
          {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
        </Animated.View>
      );

      if (pressable || onPress || onLongPress) {
        return (
          <TouchableWithoutFeedback
            onPress={handlePress}
            onLongPress={handleLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
          >
            {content}
          </TouchableWithoutFeedback>
        );
      }

      return content;
    }
    return null;
  }

  // ── Image source ───────────────────────────────────────────────
  const imageSource = source ?? { uri };

  // ── Main render ────────────────────────────────────────────────
  const imageContent = (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.disabled,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {/* Shimmer while loading */}
      {isLoading && showShimmer && <ShimmerOverlay colors={colors} />}

      {/* Main image */}
      <Image
        source={imageSource}
        style={[styles.image, style]}
        contentFit={contentFit}
        transition={transition}
        placeholder={placeholder}
        cachePolicy="memory-disk"
        recyclingKey={uri}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />

      {/* Overlay */}
      {!isLoading && renderOverlay}

      {/* Glass border */}
      {glassBorder && <View style={styles.glassBorderOverlay} pointerEvents="none" />}
    </Animated.View>
  );

  // ── Wrap with Touchable if pressable ───────────────────────────
  if (pressable || onPress || onLongPress) {
    return (
      <TouchableWithoutFeedback
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {imageContent}
      </TouchableWithoutFeedback>
    );
  }

  return imageContent;
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (
  colors: ThemeColors,
  shape: CachedImageShape,
  size?: CachedImageSize,
  glassBorder?: boolean
) =>
  useMemo(() => {
    const sizeValue = size ? SIZE_MAP[size] : undefined;
    const borderRadiusValue = SHAPE_RADIUS[shape];
    const finalBorderRadius =
      borderRadiusValue === 'full'
        ? sizeValue
          ? sizeValue / 2
          : 9999
        : borderRadiusValue;

    return StyleSheet.create({
      container: {
        overflow: 'hidden',
        borderRadius: finalBorderRadius,
        ...(sizeValue && sizeValue > 0
          ? { width: sizeValue, height: sizeValue }
          : {}),
      },
      image: {
        width: '100%',
        height: '100%',
        borderRadius: finalBorderRadius,
      },
      fallbackContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceElevated,
        borderWidth: glassBorder ? 0 : 1,
        borderColor: colors.border,
      },
      overlay: {
        borderRadius: finalBorderRadius,
      },
      glassBorderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: finalBorderRadius,
        borderWidth: effectGlass.light.borderWidth,
        borderColor: effectGlass.light.borderColor,
      },
      disabled: {
        opacity: 0.5,
      },
    });
  }, [colors, shape, size, glassBorder]);

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Avatar circulaire avec bordure glass */
export const AvatarImage: React.FC<Omit<CachedImageProps, 'variant'>> = (props) => (
  <CachedImage variant="avatar" {...props} />
);

/** Image pour carte de contenu */
export const CardImage: React.FC<Omit<CachedImageProps, 'variant'>> = (props) => (
  <CachedImage variant="card" {...props} />
);

/** Miniature (thumbnail) */
export const ThumbnailImage: React.FC<Omit<CachedImageProps, 'variant'>> = (props) => (
  <CachedImage variant="thumbnail" {...props} />
);

/** Image hero pleine largeur */
export const HeroImage: React.FC<Omit<CachedImageProps, 'variant'>> = (props) => (
  <CachedImage variant="hero" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(CachedImage);

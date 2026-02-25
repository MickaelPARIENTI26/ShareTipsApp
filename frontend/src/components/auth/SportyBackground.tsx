/**
 * SportyBackground — Fond Animé Premium Sportif
 *
 * Arrière-plan immersif avec effets de stade, lumières et motifs dynamiques.
 * Conçu pour les écrans d'authentification et pages marketing.
 *
 * Fonctionnalités :
 * - Variantes : default, stadium, field, minimal, premium, dark
 * - Effets de lumière de stade (radial gradients)
 * - Motifs géométriques (lignes diagonales)
 * - Icônes sport en filigrane
 * - Courbes d'accent animées
 * - Particules flottantes optionnelles
 * - Intensité configurable
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeContext';
import { darkColors, type ThemeColors } from '../../theme/colors';
import { effectGradients } from '../../theme/effects';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Variantes visuelles du background */
export type SportyBackgroundVariant =
  | 'default'
  | 'stadium'
  | 'field'
  | 'minimal'
  | 'premium'
  | 'dark';

/** Intensité des effets */
export type EffectIntensity = 'subtle' | 'normal' | 'strong';

export interface SportyBackgroundProps {
  /** Contenu à afficher par-dessus le fond */
  children: React.ReactNode;
  /** Variante visuelle (défaut: 'default') */
  variant?: SportyBackgroundVariant;
  /** Afficher les lumières de stade (défaut: true) */
  showLights?: boolean;
  /** Afficher les motifs géométriques (défaut: true) */
  showPatterns?: boolean;
  /** Afficher les filigranes sport (défaut: true) */
  showWatermarks?: boolean;
  /** Afficher les courbes d'accent (défaut: true) */
  showCurves?: boolean;
  /** Afficher les particules flottantes (défaut: false) */
  showParticles?: boolean;
  /** Activer les animations (défaut: true) */
  animated?: boolean;
  /** Intensité des effets (défaut: 'normal') */
  intensity?: EffectIntensity;
  /** Overlay sombre supplémentaire (défaut: true) */
  showOverlay?: boolean;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const INTENSITY_MAP: Record<EffectIntensity, number> = {
  subtle: 0.5,
  normal: 1,
  strong: 1.5,
};

type VariantConfig = {
  baseGradient: readonly [string, string, string];
  primaryGlow: string;
  accentGlow: string;
  showLights: boolean;
  showPatterns: boolean;
  showWatermarks: boolean;
  showCurves: boolean;
  overlayOpacity: number;
};

const getVariantConfig = (colors: ThemeColors): Record<SportyBackgroundVariant, VariantConfig> => ({
  default: {
    baseGradient: [colors.background, '#1A1A2E', colors.background],
    primaryGlow: effectGradients.primary.colors[0],
    accentGlow: effectGradients.accent.colors[0],
    showLights: true,
    showPatterns: true,
    showWatermarks: true,
    showCurves: true,
    overlayOpacity: 0.3,
  },
  stadium: {
    baseGradient: ['#0D0D1A', '#1A1A2E', '#0A0A14'],
    primaryGlow: effectGradients.primary.colors[0],
    accentGlow: effectGradients.accent.colors[0],
    showLights: true,
    showPatterns: true,
    showWatermarks: true,
    showCurves: true,
    overlayOpacity: 0.2,
  },
  field: {
    baseGradient: ['#0A1F0A', '#0D2D0D', '#051005'],
    primaryGlow: '#22C55E',
    accentGlow: '#86EFAC',
    showLights: true,
    showPatterns: true,
    showWatermarks: false,
    showCurves: true,
    overlayOpacity: 0.25,
  },
  minimal: {
    baseGradient: [colors.background, colors.surface, colors.background],
    primaryGlow: colors.primary,
    accentGlow: colors.accent,
    showLights: true,
    showPatterns: false,
    showWatermarks: false,
    showCurves: false,
    overlayOpacity: 0.4,
  },
  premium: {
    baseGradient: ['#0F0F1A', '#1A1025', '#0A0A12'],
    primaryGlow: '#A855F7',
    accentGlow: '#F59E0B',
    showLights: true,
    showPatterns: true,
    showWatermarks: true,
    showCurves: true,
    overlayOpacity: 0.15,
  },
  dark: {
    baseGradient: ['#000000', '#0A0A0A', '#000000'],
    primaryGlow: colors.primary,
    accentGlow: colors.accent,
    showLights: true,
    showPatterns: false,
    showWatermarks: false,
    showCurves: true,
    overlayOpacity: 0.5,
  },
});

// ═══════════════════════════════════════════════════════════════
// ANIMATED PARTICLES COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ParticleProps {
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
}

const AnimatedParticle: React.FC<ParticleProps> = React.memo(({
  delay,
  duration,
  startX,
  startY,
  size,
  color,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -SCREEN_HEIGHT * 0.3,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, [delay, duration, translateY, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
});

AnimatedParticle.displayName = 'AnimatedParticle';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const SportyBackground: React.FC<SportyBackgroundProps> = ({
  children,
  variant = 'default',
  showLights: customShowLights,
  showPatterns: customShowPatterns,
  showWatermarks: customShowWatermarks,
  showCurves: customShowCurves,
  showParticles = false,
  animated = true,
  intensity = 'normal',
  showOverlay = true,
  style,
}) => {
  const theme = useTheme();
  // Fallback to darkColors if theme context fails
  const colors = theme?.colors ?? darkColors;

  // ── Configuration ──────────────────────────────────────────────
  const variantConfig = getVariantConfig(colors)[variant];
  const intensityMultiplier = INTENSITY_MAP[intensity];

  const showLights = customShowLights ?? variantConfig.showLights;
  const showPatterns = customShowPatterns ?? variantConfig.showPatterns;
  const showWatermarks = customShowWatermarks ?? variantConfig.showWatermarks;
  const showCurves = customShowCurves ?? variantConfig.showCurves;

  // ── Styles mémorisés ───────────────────────────────────────────
  const styles = useStyles(colors, variantConfig);

  // ── Particles data ─────────────────────────────────────────────
  const particles = useMemo(() => {
    if (!showParticles || !animated) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 400,
      duration: 4000 + Math.random() * 2000,
      startX: Math.random() * SCREEN_WIDTH,
      startY: SCREEN_HEIGHT * 0.6 + Math.random() * SCREEN_HEIGHT * 0.3,
      size: 2 + Math.random() * 3,
      color: i % 2 === 0 ? variantConfig.primaryGlow : variantConfig.accentGlow,
    }));
  }, [showParticles, animated, variantConfig.primaryGlow, variantConfig.accentGlow]);

  // ── Pattern lines data ─────────────────────────────────────────
  const diagonalLines = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      key: `diag-${i}`,
      d: `M${-100 + i * 120} ${SCREEN_HEIGHT} L${SCREEN_WIDTH * 0.3 + i * 120} 0`,
      opacity: 0.03 * intensityMultiplier,
    }));
  }, [intensityMultiplier]);

  const accentLines = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      key: `accent-${i}`,
      d: `M${SCREEN_WIDTH + 50 - i * 150} ${SCREEN_HEIGHT} L${SCREEN_WIDTH * 0.7 - i * 150} 0`,
      opacity: 0.025 * intensityMultiplier,
    }));
  }, [intensityMultiplier]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <View style={[styles.container, style]}>
      {/* Base gradient */}
      <LinearGradient
        colors={variantConfig.baseGradient as unknown as string[]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Stadium lights effect */}
      {showLights && (
        <View style={styles.lightsContainer} pointerEvents="none">
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="light1" cx="0.2" cy="0.1" rx="0.5" ry="0.3">
                <Stop offset="0" stopColor={variantConfig.primaryGlow} stopOpacity={0.15 * intensityMultiplier} />
                <Stop offset="1" stopColor={variantConfig.primaryGlow} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="light2" cx="0.8" cy="0.15" rx="0.4" ry="0.25">
                <Stop offset="0" stopColor={variantConfig.accentGlow} stopOpacity={0.12 * intensityMultiplier} />
                <Stop offset="1" stopColor={variantConfig.accentGlow} stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="light3" cx="0.5" cy="0.9" rx="0.6" ry="0.3">
                <Stop offset="0" stopColor={variantConfig.primaryGlow} stopOpacity={0.08 * intensityMultiplier} />
                <Stop offset="1" stopColor={variantConfig.primaryGlow} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.1} r={SCREEN_WIDTH * 0.5} fill="url(#light1)" />
            <Circle cx={SCREEN_WIDTH * 0.8} cy={SCREEN_HEIGHT * 0.15} r={SCREEN_WIDTH * 0.4} fill="url(#light2)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.9} r={SCREEN_WIDTH * 0.6} fill="url(#light3)" />
          </Svg>
        </View>
      )}

      {/* Geometric patterns - diagonal lines */}
      {showPatterns && (
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.patterns} pointerEvents="none">
          {diagonalLines.map((line) => (
            <Path
              key={line.key}
              d={line.d}
              stroke={variantConfig.primaryGlow}
              strokeWidth={2}
              strokeOpacity={line.opacity}
            />
          ))}
          {accentLines.map((line) => (
            <Path
              key={line.key}
              d={line.d}
              stroke={variantConfig.accentGlow}
              strokeWidth={1.5}
              strokeOpacity={line.opacity}
            />
          ))}
        </Svg>
      )}

      {/* Sport icons watermark */}
      {showWatermarks && (
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.watermarks} pointerEvents="none">
          {/* Football/Soccer ball outline - top right */}
          <Circle
            cx={SCREEN_WIDTH * 0.85}
            cy={SCREEN_HEIGHT * 0.12}
            r={35}
            stroke={colors.text}
            strokeWidth={2}
            strokeOpacity={0.04 * intensityMultiplier}
            fill="none"
          />
          {/* Inner pattern of ball */}
          <Path
            d={`M${SCREEN_WIDTH * 0.85 - 20} ${SCREEN_HEIGHT * 0.12}
                L${SCREEN_WIDTH * 0.85 + 20} ${SCREEN_HEIGHT * 0.12}`}
            stroke={colors.text}
            strokeWidth={1}
            strokeOpacity={0.03 * intensityMultiplier}
          />
          <Path
            d={`M${SCREEN_WIDTH * 0.85} ${SCREEN_HEIGHT * 0.12 - 20}
                L${SCREEN_WIDTH * 0.85} ${SCREEN_HEIGHT * 0.12 + 20}`}
            stroke={colors.text}
            strokeWidth={1}
            strokeOpacity={0.03 * intensityMultiplier}
          />

          {/* Trophy outline - bottom left */}
          <Path
            d={`M${SCREEN_WIDTH * 0.12} ${SCREEN_HEIGHT * 0.82}
                Q${SCREEN_WIDTH * 0.08} ${SCREEN_HEIGHT * 0.78} ${SCREEN_WIDTH * 0.08} ${SCREEN_HEIGHT * 0.74}
                L${SCREEN_WIDTH * 0.08} ${SCREEN_HEIGHT * 0.72}
                L${SCREEN_WIDTH * 0.16} ${SCREEN_HEIGHT * 0.72}
                L${SCREEN_WIDTH * 0.16} ${SCREEN_HEIGHT * 0.74}
                Q${SCREEN_WIDTH * 0.16} ${SCREEN_HEIGHT * 0.78} ${SCREEN_WIDTH * 0.12} ${SCREEN_HEIGHT * 0.82}
                M${SCREEN_WIDTH * 0.10} ${SCREEN_HEIGHT * 0.82}
                L${SCREEN_WIDTH * 0.14} ${SCREEN_HEIGHT * 0.82}
                L${SCREEN_WIDTH * 0.14} ${SCREEN_HEIGHT * 0.84}
                L${SCREEN_WIDTH * 0.10} ${SCREEN_HEIGHT * 0.84}
                Z`}
            stroke={variantConfig.accentGlow}
            strokeWidth={1.5}
            strokeOpacity={0.06 * intensityMultiplier}
            fill="none"
          />

          {/* Star - center right */}
          <Path
            d={`M${SCREEN_WIDTH * 0.92} ${SCREEN_HEIGHT * 0.5}
                L${SCREEN_WIDTH * 0.92 + 8} ${SCREEN_HEIGHT * 0.5 + 6}
                L${SCREEN_WIDTH * 0.92 + 15} ${SCREEN_HEIGHT * 0.5 + 6}
                L${SCREEN_WIDTH * 0.92 + 10} ${SCREEN_HEIGHT * 0.5 + 12}
                L${SCREEN_WIDTH * 0.92 + 12} ${SCREEN_HEIGHT * 0.5 + 20}
                L${SCREEN_WIDTH * 0.92} ${SCREEN_HEIGHT * 0.5 + 15}
                L${SCREEN_WIDTH * 0.92 - 12} ${SCREEN_HEIGHT * 0.5 + 20}
                L${SCREEN_WIDTH * 0.92 - 10} ${SCREEN_HEIGHT * 0.5 + 12}
                L${SCREEN_WIDTH * 0.92 - 15} ${SCREEN_HEIGHT * 0.5 + 6}
                L${SCREEN_WIDTH * 0.92 - 8} ${SCREEN_HEIGHT * 0.5 + 6}
                Z`}
            stroke={variantConfig.primaryGlow}
            strokeWidth={1}
            strokeOpacity={0.05 * intensityMultiplier}
            fill="none"
          />
        </Svg>
      )}

      {/* Curved accent lines */}
      {showCurves && (
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.curves} pointerEvents="none">
          <Path
            d={`M0 ${SCREEN_HEIGHT * 0.65} Q${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT * 0.55} ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.7}`}
            stroke={variantConfig.primaryGlow}
            strokeWidth={3}
            strokeOpacity={0.08 * intensityMultiplier}
            fill="none"
          />
          <Path
            d={`M0 ${SCREEN_HEIGHT * 0.68} Q${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT * 0.58} ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.73}`}
            stroke={variantConfig.accentGlow}
            strokeWidth={2}
            strokeOpacity={0.05 * intensityMultiplier}
            fill="none"
          />
          {/* Top curve */}
          <Path
            d={`M0 ${SCREEN_HEIGHT * 0.25} Q${SCREEN_WIDTH * 0.3} ${SCREEN_HEIGHT * 0.2} ${SCREEN_WIDTH * 0.6} ${SCREEN_HEIGHT * 0.28}`}
            stroke={variantConfig.primaryGlow}
            strokeWidth={2}
            strokeOpacity={0.04 * intensityMultiplier}
            fill="none"
          />
        </Svg>
      )}

      {/* Floating particles */}
      {showParticles && animated && (
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map((particle) => (
            <AnimatedParticle key={particle.id} {...particle} />
          ))}
        </View>
      )}

      {/* Bottom gradient fade / overlay */}
      {showOverlay && (
        <LinearGradient
          colors={[
            'transparent',
            `rgba(0, 0, 0, ${variantConfig.overlayOpacity * 0.5})`,
            `rgba(0, 0, 0, ${variantConfig.overlayOpacity})`,
          ]}
          locations={[0.4, 0.7, 1]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      )}

      {/* Vignette effect */}
      <View style={styles.vignette} pointerEvents="none">
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <RadialGradient id="vignette" cx="0.5" cy="0.5" rx="0.8" ry="0.8">
              <Stop offset="0.4" stopColor="transparent" stopOpacity="0" />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.4 * intensityMultiplier} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#vignette)" />
        </Svg>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const useStyles = (colors: ThemeColors, variantConfig: VariantConfig) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: variantConfig.baseGradient[0],
        },
        lightsContainer: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 1,
        },
        patterns: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 2,
        },
        watermarks: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 3,
        },
        curves: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 4,
        },
        particlesContainer: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 5,
        },
        bottomFade: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 6,
        },
        vignette: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 7,
        },
        content: {
          flex: 1,
          zIndex: 10,
        },
      }),
    [colors, variantConfig]
  );

// ═══════════════════════════════════════════════════════════════
// PRESET COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Background par défaut */
export const DefaultBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="default" {...props} />
);

/** Background style stade */
export const StadiumBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="stadium" {...props} />
);

/** Background style terrain */
export const FieldBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="field" {...props} />
);

/** Background minimaliste */
export const MinimalBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="minimal" {...props} />
);

/** Background premium (violet/or) */
export const PremiumBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="premium" {...props} />
);

/** Background sombre */
export const DarkBackground: React.FC<Omit<SportyBackgroundProps, 'variant'>> = (props) => (
  <SportyBackground variant="dark" {...props} />
);

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export default React.memo(SportyBackground);

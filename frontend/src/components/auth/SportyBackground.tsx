import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

interface SportyBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'stadium' | 'field';
}

const SportyBackground: React.FC<SportyBackgroundProps> = ({
  children,
  variant = 'default'
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#0F1923', '#1B2A4A', '#0F1923']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Stadium lights effect */}
      <View style={styles.lightsContainer}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="light1"
              cx="0.2"
              cy="0.1"
              rx="0.5"
              ry="0.3"
            >
              <Stop offset="0" stopColor="#2ECC71" stopOpacity="0.15" />
              <Stop offset="1" stopColor="#2ECC71" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient
              id="light2"
              cx="0.8"
              cy="0.15"
              rx="0.4"
              ry="0.25"
            >
              <Stop offset="0" stopColor="#F39C12" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#F39C12" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={width * 0.2} cy={height * 0.1} r={width * 0.5} fill="url(#light1)" />
          <Circle cx={width * 0.8} cy={height * 0.15} r={width * 0.4} fill="url(#light2)" />
        </Svg>
      </View>

      {/* Geometric patterns - diagonal lines */}
      <Svg width={width} height={height} style={[StyleSheet.absoluteFill, styles.patterns]}>
        {/* Dynamic diagonal lines */}
        {[...Array(8)].map((_, i) => (
          <Path
            key={`diag-${i}`}
            d={`M${-100 + i * 120} ${height} L${width * 0.3 + i * 120} 0`}
            stroke="rgba(46, 204, 113, 0.04)"
            strokeWidth={2}
          />
        ))}
        {/* Accent diagonal lines */}
        {[...Array(5)].map((_, i) => (
          <Path
            key={`accent-${i}`}
            d={`M${width + 50 - i * 150} ${height} L${width * 0.7 - i * 150} 0`}
            stroke="rgba(243, 156, 18, 0.03)"
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* Sport icons watermark */}
      <Svg width={width} height={height} style={[StyleSheet.absoluteFill, styles.watermarks]}>
        {/* Football/Soccer ball outline - top right */}
        <Circle
          cx={width * 0.85}
          cy={height * 0.12}
          r={35}
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={2}
          fill="none"
        />
        {/* Trophy outline - bottom left */}
        <Path
          d={`M${width * 0.12} ${height * 0.82}
              Q${width * 0.08} ${height * 0.78} ${width * 0.08} ${height * 0.74}
              L${width * 0.08} ${height * 0.72}
              L${width * 0.16} ${height * 0.72}
              L${width * 0.16} ${height * 0.74}
              Q${width * 0.16} ${height * 0.78} ${width * 0.12} ${height * 0.82}
              M${width * 0.10} ${height * 0.82}
              L${width * 0.14} ${height * 0.82}
              L${width * 0.14} ${height * 0.84}
              L${width * 0.10} ${height * 0.84}
              Z`}
          stroke="rgba(243, 156, 18, 0.05)"
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>

      {/* Curved accent line */}
      <Svg width={width} height={height} style={[StyleSheet.absoluteFill, styles.accentCurve]}>
        <Path
          d={`M0 ${height * 0.65} Q${width * 0.5} ${height * 0.55} ${width} ${height * 0.7}`}
          stroke="rgba(46, 204, 113, 0.08)"
          strokeWidth={3}
          fill="none"
        />
        <Path
          d={`M0 ${height * 0.68} Q${width * 0.5} ${height * 0.58} ${width} ${height * 0.73}`}
          stroke="rgba(243, 156, 18, 0.05)"
          strokeWidth={2}
          fill="none"
        />
      </Svg>

      {/* Bottom gradient fade */}
      <LinearGradient
        colors={['transparent', 'rgba(15, 25, 35, 0.8)']}
        locations={[0.6, 1]}
        style={[StyleSheet.absoluteFill, styles.bottomFade]}
      />

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#0F1923',
        },
        lightsContainer: {
          ...StyleSheet.absoluteFillObject,
          opacity: 1,
        },
        patterns: {
          opacity: 1,
        },
        watermarks: {
          opacity: 1,
        },
        accentCurve: {
          opacity: 1,
        },
        bottomFade: {
          zIndex: 1,
        },
        content: {
          flex: 1,
          zIndex: 2,
        },
      }),
    []
  );

export default SportyBackground;

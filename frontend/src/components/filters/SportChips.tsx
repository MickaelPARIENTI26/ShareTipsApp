import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SportDto } from '../../types/sport.types';
import type { ThemeColors } from '../../theme';

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  football: 'football',
  basketball: 'basketball',
  tennis: 'tennisball',
  baseball: 'baseball',
  golf: 'golf',
};

function getSportIcon(code: string, isActive: boolean): keyof typeof Ionicons.glyphMap {
  const baseIcon = SPORT_ICONS[code.toLowerCase()];
  if (!baseIcon) return isActive ? 'trophy' : 'trophy-outline';
  return isActive ? baseIcon : (`${baseIcon}-outline` as keyof typeof Ionicons.glyphMap);
}

interface SportChipsProps {
  sports: SportDto[];
  selectedSport: string | null; // null = "Tous"
  onSelect: (sportCode: string | null) => void;
  colors: ThemeColors;
}

const SportChips: React.FC<SportChipsProps> = ({
  sports,
  selectedSport,
  onSelect,
  colors,
}) => {
  const styles = useStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "Tous" chip */}
        <TouchableOpacity
          style={[styles.chip, selectedSport === null && styles.chipActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, selectedSport === null && styles.iconWrapperActive]}>
            <Ionicons
              name={selectedSport === null ? 'apps' : 'apps-outline'}
              size={14}
              color={selectedSport === null ? colors.textOnPrimary : colors.primary}
            />
          </View>
          <Text
            style={[
              styles.chipText,
              selectedSport === null && styles.chipTextActive,
            ]}
          >
            Tous
          </Text>
        </TouchableOpacity>

        {/* Sport chips */}
        {sports.map((sport) => {
          const isActive = selectedSport === sport.code;
          return (
            <TouchableOpacity
              key={sport.code}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(sport.code)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <Ionicons
                  name={getSportIcon(sport.code, isActive)}
                  size={14}
                  color={isActive ? colors.textOnPrimary : colors.primary}
                />
              </View>
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: 'transparent',
          paddingVertical: 14,
          paddingTop: 16,
        },
        scrollContent: {
          paddingHorizontal: 16,
          gap: 10,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          // Glassmorphism effect
          backgroundColor: `${colors.surface}CC`, // 80% opacity
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 24,
          borderWidth: 0.5,
          borderColor: `${colors.border}80`,
          // Subtle shadow for depth
          ...Platform.select({
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          // Enhanced shadow for active state
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        iconWrapper: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconWrapperActive: {
          backgroundColor: `${colors.textOnPrimary}25`,
        },
        chipText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: 0.2,
        },
        chipTextActive: {
          color: colors.textOnPrimary,
          fontWeight: '700',
        },
      }),
    [colors]
  );

export default SportChips;

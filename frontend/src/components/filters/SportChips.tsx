import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SportDto } from '../../types/sport.types';
import type { ThemeColors } from '../../theme';

const SPORT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  football: 'football-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  baseball: 'baseball-outline',
  golf: 'golf-outline',
};

function getSportIcon(code: string): keyof typeof Ionicons.glyphMap {
  return SPORT_ICONS[code.toLowerCase()] ?? 'trophy-outline';
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
          activeOpacity={0.7}
        >
          <Ionicons
            name="apps-outline"
            size={16}
            color={selectedSport === null ? colors.textOnPrimary : colors.text}
          />
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
              activeOpacity={0.7}
            >
              <Ionicons
                name={getSportIcon(sport.code)}
                size={16}
                color={isActive ? colors.textOnPrimary : colors.text}
              />
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
          backgroundColor: colors.surface,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        scrollContent: {
          paddingHorizontal: 12,
          gap: 8,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.surfaceSecondary,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
        },
        chipTextActive: {
          color: colors.textOnPrimary,
        },
      }),
    [colors]
  );

export default SportChips;

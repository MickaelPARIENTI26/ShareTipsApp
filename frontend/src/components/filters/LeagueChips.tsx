import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import type { ThemeColors } from '../../theme';

interface LeagueChipsProps {
  leagues: string[];
  selectedLeague: string | null; // null = "Toutes"
  onSelect: (league: string | null) => void;
  colors: ThemeColors;
}

const LeagueChips: React.FC<LeagueChipsProps> = ({
  leagues,
  selectedLeague,
  onSelect,
  colors,
}) => {
  const styles = useStyles(colors);

  if (leagues.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* "Toutes" chip */}
        <TouchableOpacity
          style={[styles.chip, selectedLeague === null && styles.chipActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedLeague === null && styles.chipTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>

        {/* League chips */}
        {leagues.map((league) => {
          const isActive = selectedLeague === league;
          return (
            <TouchableOpacity
              key={league}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(league)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {league}
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
          backgroundColor: colors.background,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        scrollContent: {
          paddingHorizontal: 12,
          gap: 8,
        },
        chip: {
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        },
        chipText: {
          fontSize: 13,
          fontWeight: '500',
          color: colors.textSecondary,
        },
        chipTextActive: {
          color: colors.primary,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default LeagueChips;

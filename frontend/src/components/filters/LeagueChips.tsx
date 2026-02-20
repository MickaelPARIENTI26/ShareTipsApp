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
          activeOpacity={0.8}
        >
          <Ionicons
            name={selectedLeague === null ? 'layers' : 'layers-outline'}
            size={12}
            color={selectedLeague === null ? colors.primary : colors.textSecondary}
          />
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
              activeOpacity={0.8}
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
          backgroundColor: 'transparent',
          paddingVertical: 10,
        },
        scrollContent: {
          paddingHorizontal: 16,
          gap: 8,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          // Glassmorphism - lighter variant
          backgroundColor: `${colors.surface}B3`, // 70% opacity
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: `${colors.border}60`,
          ...Platform.select({
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
            },
            android: {
              elevation: 1,
            },
          }),
        },
        chipActive: {
          backgroundColor: `${colors.primary}18`,
          borderColor: `${colors.primary}50`,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        chipText: {
          fontSize: 13,
          fontWeight: '500',
          color: colors.textSecondary,
          letterSpacing: 0.1,
        },
        chipTextActive: {
          color: colors.primary,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default LeagueChips;

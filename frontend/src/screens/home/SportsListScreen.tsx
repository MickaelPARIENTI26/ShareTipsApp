import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { sportsApi } from '../../api/sports.api';
import type { SportDto } from '../../types/sport.types';
import type { HomeStackParamList } from '../../types';
import { useTheme, type ThemeColors, spacing, radius, typography, fontWeight } from '../../theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

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

const SportsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [sports, setSports] = useState<SportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSports = useCallback(async () => {
    try {
      setError(null);
      const { data } = await sportsApi.getAll();
      setSports(data.filter((s) => s.isActive));
    } catch {
      setError('Impossible de charger les sports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSports();
  }, [fetchSports]);

  const handlePress = (sport: SportDto) => {
    navigation.navigate('LeagueList', {
      sportCode: sport.code,
      sportName: sport.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSports}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sports.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun sport disponible</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sports}
      keyExtractor={(item) => item.code}
      style={styles.container}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => handlePress(item)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getSportIcon(item.code)}
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={styles.rowLabel}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const useStyles = (colors: ThemeColors) =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: spacing.xl,
        },
        list: {
          flexGrow: 1,
          backgroundColor: colors.background,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          paddingVertical: spacing.base,
          paddingHorizontal: spacing.base,
        },
        iconContainer: {
          width: spacing['3xl'],
          height: spacing['3xl'],
          borderRadius: spacing.lg,
          backgroundColor: colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing['md+'],
        },
        rowLabel: {
          flex: 1,
          ...typography.body,
          fontWeight: fontWeight.semibold,
          color: colors.text,
        },
        separator: {
          height: 1,
          backgroundColor: colors.border,
          marginLeft: 70,
        },
        errorText: {
          color: colors.danger,
          fontSize: 15,
          textAlign: 'center',
          marginTop: spacing.md,
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 15,
          textAlign: 'center',
          marginTop: spacing.md,
        },
        retryBtn: {
          marginTop: spacing.base,
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing['sm+'],
        },
        retryBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: fontWeight.semibold,
        },
      }),
    [colors]
  );

export default SportsListScreen;

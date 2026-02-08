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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { matchApi } from '../../api/match.api';
import type { HomeStackParamList } from '../../types';
import { useTheme, type ThemeColors } from '../../theme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface LeagueItem {
  name: string;
  matchCount: number;
}

const LeagueListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { sportCode, sportName } = route.params as { sportCode: string; sportName: string };

  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeagues = useCallback(async () => {
    try {
      setError(null);
      const { data } = await matchApi.getAll({ sport: sportCode });

      // Extract unique leagues with match counts
      const leagueMap = new Map<string, number>();
      for (const match of data) {
        const count = leagueMap.get(match.leagueName) ?? 0;
        leagueMap.set(match.leagueName, count + 1);
      }

      const leagueList = Array.from(leagueMap.entries())
        .map(([name, matchCount]) => ({ name, matchCount }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setLeagues(leagueList);
      setTotalMatches(data.length);
    } catch {
      setError('Impossible de charger les championnats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sportCode]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeagues();
  }, [fetchLeagues]);

  const handleLeaguePress = (leagueName?: string) => {
    navigation.navigate('MatchList', {
      sportCode,
      sportName,
      leagueName,
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
        <TouchableOpacity style={styles.retryBtn} onPress={fetchLeagues}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (leagues.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="football-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun match disponible</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={leagues}
      keyExtractor={(item) => item.name}
      style={styles.container}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={() => (
        <TouchableOpacity
          style={styles.voirToutRow}
          activeOpacity={0.7}
          onPress={() => handleLeaguePress(undefined)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="grid-outline" size={22} color={colors.textOnPrimary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.voirToutLabel}>Voir tout</Text>
            <Text style={styles.matchCount}>{totalMatches} matchs</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => handleLeaguePress(item.name)}
        >
          <View style={styles.leagueIconContainer}>
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{item.name}</Text>
            <Text style={styles.matchCountSecondary}>{item.matchCount} matchs</Text>
          </View>
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
          padding: 24,
        },
        list: {
          flexGrow: 1,
          backgroundColor: colors.background,
          paddingBottom: 24,
        },
        voirToutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 16,
          marginBottom: 8,
        },
        iconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        leagueIconContainer: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        rowContent: {
          flex: 1,
        },
        voirToutLabel: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          paddingVertical: 14,
          paddingHorizontal: 16,
        },
        rowLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        matchCount: {
          fontSize: 13,
          color: colors.textOnPrimary,
          opacity: 0.8,
          marginTop: 2,
        },
        matchCountSecondary: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
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
          marginTop: 12,
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: 15,
          textAlign: 'center',
          marginTop: 12,
        },
        retryBtn: {
          marginTop: 16,
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingHorizontal: 24,
          paddingVertical: 10,
        },
        retryBtnText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [colors]
  );

export default LeagueListScreen;

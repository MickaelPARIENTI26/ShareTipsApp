import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { followApi, type FollowerDto } from '../api/follow.api';
import { useAuthStore } from '../store/auth.store';
import { useFollowStore } from '../store/follow.store';
import type { RootStackParamList } from '../types';
import { useTheme, type ThemeColors, spacing, radius, typography, palette } from '../theme';

const MesAbonnesScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggle);

  const [followers, setFollowers] = useState<FollowerDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data } = await followApi.getFollowers(currentUserId);
      setFollowers(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos abonnés');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const handleFollowBack = useCallback(
    async (user: FollowerDto) => {
      try {
        await toggleFollow(user.userId);
      } catch {
        Alert.alert('Erreur', 'Impossible de modifier le suivi');
      }
    },
    [toggleFollow]
  );

  const handleTipsterPress = useCallback(
    (user: FollowerDto) => {
      navigation.navigate('TipsterProfile', {
        tipsterId: user.userId,
        tipsterUsername: user.username,
      });
    },
    [navigation]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: FollowerDto }) => {
    const following = isFollowing(item.userId);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleTipsterPress(item)}
          activeOpacity={0.6}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.dates}>
              Vous suit depuis le {formatDate(item.followedAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={() => handleFollowBack(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? 'Suivi' : 'Suivre'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={
          followers.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun abonné</Text>
            <Text style={styles.emptyHint}>
              Partagez vos tickets pour attirer des abonnés et développer votre
              communauté.
            </Text>
          </View>
        }
      />
    </View>
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
        // Loading state
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          gap: spacing.md,
        },
        loadingText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        listContent: {
          padding: spacing.md,
          paddingBottom: spacing.xl,
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: palette.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        cardContent: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        },
        info: {
          flex: 1,
        },
        username: {
          ...typography.bodyLarge,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: 2,
        },
        dates: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        followBtn: {
          marginTop: spacing.sm,
          alignSelf: 'flex-end',
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        followingBtn: {
          backgroundColor: colors.primaryBg,
        },
        followText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        followingText: {
          color: colors.primary,
        },

        // Empty state
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
        },
        emptyIconWrapper: {
          width: 80,
          height: 80,
          borderRadius: radius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        emptyTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        emptyHint: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 280,
        },
      }),
    [colors]
  );

export default MesAbonnesScreen;

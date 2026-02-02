import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { followApi, type FollowerDto } from '../api/follow.api';
import { useAuthStore } from '../store/auth.store';
import { useFollowStore } from '../store/follow.store';
import type { RootStackParamList } from '../types';
import { useTheme, type ThemeColors } from '../theme';

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun abonné</Text>
            <Text style={styles.emptyText}>
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
        center: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        listContent: {
          padding: 16,
          paddingBottom: 32,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        },

        // Card
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
        },
        cardContent: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primaryLight ?? `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        info: {
          flex: 1,
        },
        username: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: 2,
        },
        dates: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        followBtn: {
          marginTop: 10,
          alignSelf: 'flex-end',
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        followingBtn: {
          backgroundColor: colors.primaryLight ?? `${colors.primary}15`,
        },
        followText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        followingText: {
          color: colors.primary,
        },

        // Empty state
        emptyState: {
          alignItems: 'center',
          gap: 8,
        },
        emptyTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
        },
        emptyText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        },
      }),
    [colors]
  );

export default MesAbonnesScreen;

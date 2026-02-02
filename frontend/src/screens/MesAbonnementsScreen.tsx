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
import type { RootStackParamList } from '../types';
import { useTheme, type ThemeColors } from '../theme';

const MesAbonnementsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [following, setFollowing] = useState<FollowerDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data } = await followApi.getFollowing(currentUserId);
      setFollowing(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos abonnements');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const handleUnfollow = useCallback(
    (user: FollowerDto) => {
      Alert.alert(
        'Ne plus suivre',
        `Voulez-vous ne plus suivre @${user.username} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ne plus suivre',
            style: 'destructive',
            onPress: async () => {
              // Optimistic removal
              setFollowing((prev) =>
                prev.filter((f) => f.userId !== user.userId)
              );
              try {
                await followApi.unfollow(user.userId);
              } catch {
                // Revert on error
                setFollowing((prev) => [...prev, user]);
                Alert.alert('Erreur', 'Impossible de se désabonner');
              }
            },
          },
        ]
      );
    },
    []
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

  const renderItem = ({ item }: { item: FollowerDto }) => (
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
            Suivi depuis le {formatDate(item.followedAt)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.unsubBtn}
        onPress={() => handleUnfollow(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.unsubText}>Ne plus suivre</Text>
      </TouchableOpacity>
    </View>
  );

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
        data={following}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={
          following.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun abonnement</Text>
            <Text style={styles.emptyText}>
              Suivez des pronostiqueurs depuis leur profil pour retrouver leurs
              tickets ici.
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
          backgroundColor: '#E8F0FE',
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
        unsubBtn: {
          marginTop: 10,
          alignSelf: 'flex-end',
          backgroundColor: '#FFF0F0',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        unsubText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.danger,
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

export default MesAbonnementsScreen;

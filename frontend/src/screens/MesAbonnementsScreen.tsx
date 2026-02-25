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
import {
  useTheme,
  type ThemeColors,
  spacing,
  radius,
  typography,
  size,
  // Shared component styles
  cardCompactStyle,
  iconWrapperLarge,
  loadingContainer as sharedLoadingContainer,
  loadingText as sharedLoadingText,
  emptyContainer as sharedEmptyContainer,
  emptyTitle as sharedEmptyTitle,
  emptyHint as sharedEmptyHint,
  listContent as sharedListContent,
  rowCenter,
} from '../theme';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun abonnement</Text>
            <Text style={styles.emptyHint}>
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
        // Loading state — using shared styles
        loadingContainer: sharedLoadingContainer(colors),
        loadingText: sharedLoadingText(colors),
        listContent: {
          ...sharedListContent,
        },

        // Card — using shared card style
        card: {
          ...cardCompactStyle(colors),
          marginBottom: spacing.sm,
        },
        cardContent: rowCenter,
        avatar: {
          width: size.avatar.md,
          height: size.avatar.md,
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
        unsubBtn: {
          marginTop: spacing.sm,
          alignSelf: 'flex-end',
          backgroundColor: colors.dangerBg,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
        },
        unsubText: {
          ...typography.body,
          fontWeight: '600',
          color: colors.danger,
        },

        // Empty state — using shared styles
        emptyContainer: sharedEmptyContainer,
        emptyIconWrapper: {
          ...iconWrapperLarge(colors),
          marginBottom: spacing.md,
        },
        emptyTitle: sharedEmptyTitle(colors),
        emptyHint: sharedEmptyHint(colors),
      }),
    [colors]
  );

export default MesAbonnementsScreen;

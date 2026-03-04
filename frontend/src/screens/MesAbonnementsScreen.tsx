import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { followApi, type FollowerDto } from '../api/follow.api';
import { useAuthStore } from '../store/auth.store';
import type { RootStackParamList } from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// FOLLOWING ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface FollowingItemProps {
  item: FollowerDto;
  onPress: (user: FollowerDto) => void;
  onUnfollow: (user: FollowerDto) => void;
  index: number;
}

const FollowingItem = React.memo<FollowingItemProps>(function FollowingItem({
  item,
  onPress,
  onUnfollow,
  index,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onPress(item)}
          activeOpacity={0.6}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={DS.colors.green} />
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
          onPress={() => onUnfollow(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={14} color="#EF4444" />
          <Text style={styles.unsubText}>Ne plus suivre</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MesAbonnementsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
              setFollowing((prev) =>
                prev.filter((f) => f.userId !== user.userId)
              );
              try {
                await followApi.unfollow(user.userId);
              } catch {
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

  const renderItem = useCallback(
    ({ item, index }: { item: FollowerDto; index: number }) => (
      <FollowingItem
        item={item}
        onPress={handleTipsterPress}
        onUnfollow={handleUnfollow}
        index={index}
      />
    ),
    [handleTipsterPress, handleUnfollow]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DS.colors.green} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      {following.length > 0 && (
        <View style={styles.headerStats}>
          <View style={styles.statIconContainer}>
            <Ionicons name="heart" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.headerStatsText}>
            <Text style={styles.headerStatsCount}>{following.length}</Text> abonnement{following.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={following}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={
          following.length === 0
            ? styles.emptyContainerStyle
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="people-outline" size={40} color={DS.colors.green} />
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

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: DS.colors.textSecondary,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: DS.colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.cardBorder,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatsText: {
    fontSize: 15,
    color: DS.colors.textSecondary,
  },
  headerStatsCount: {
    fontWeight: '700',
    color: DS.colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: DS.colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DS.colors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DS.colors.greenBgSubtle,
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
    color: DS.colors.green,
    marginBottom: 2,
  },
  dates: {
    fontSize: 12,
    color: DS.colors.textSecondary,
  },
  unsubBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  unsubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyContainerStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DS.colors.greenBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: DS.colors.green,
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
    fontSize: 18,
    fontWeight: '700',
    color: DS.colors.white,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});

export default MesAbonnementsScreen;

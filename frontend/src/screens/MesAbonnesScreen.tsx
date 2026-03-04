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
import { useFollowStore } from '../store/follow.store';
import type { RootStackParamList } from '../types';
import { DS } from '../theme/designSystem';

// ═══════════════════════════════════════════════════════════════
// FOLLOWER ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════

interface FollowerItemProps {
  item: FollowerDto;
  onPress: (user: FollowerDto) => void;
  onFollowBack: (user: FollowerDto) => void;
  isFollowing: boolean;
  index: number;
}

const FollowerItem = React.memo<FollowerItemProps>(function FollowerItem({
  item,
  onPress,
  onFollowBack,
  isFollowing,
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
              Vous suit depuis le {formatDate(item.followedAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => onFollowBack(item)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFollowing ? 'checkmark' : 'person-add-outline'}
            size={14}
            color={isFollowing ? DS.colors.green : DS.colors.white}
          />
          <Text style={[styles.followText, isFollowing && styles.followingText]}>
            {isFollowing ? 'Suivi' : 'Suivre'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const MesAbonnesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  const renderItem = useCallback(
    ({ item, index }: { item: FollowerDto; index: number }) => (
      <FollowerItem
        item={item}
        onPress={handleTipsterPress}
        onFollowBack={handleFollowBack}
        isFollowing={isFollowing(item.userId)}
        index={index}
      />
    ),
    [handleTipsterPress, handleFollowBack, isFollowing]
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
      {followers.length > 0 && (
        <View style={styles.headerStats}>
          <View style={styles.statIconContainer}>
            <Ionicons name="people" size={18} color={DS.colors.green} />
          </View>
          <Text style={styles.headerStatsText}>
            <Text style={styles.headerStatsCount}>{followers.length}</Text> abonné{followers.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={followers}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={
          followers.length === 0 ? styles.emptyContainerStyle : styles.listContent
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
  followBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DS.colors.green,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followingBtn: {
    backgroundColor: DS.colors.greenBgSubtle,
    borderWidth: 1,
    borderColor: 'rgba(45, 140, 78, 0.3)',
  },
  followText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.colors.white,
  },
  followingText: {
    color: DS.colors.green,
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

export default MesAbonnesScreen;

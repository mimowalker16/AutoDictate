import React, { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  FadeIn,
  SlideInLeft,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useNotes } from '@/context/NotesContext';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';
import { formatDate, formatMillis } from '@/utils/time';

export default function NotesListScreen() {
  const router = useRouter();
  const { notes, ready, deleteNote } = useNotes();

  // Header animations
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);
  const counterScale = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withSpring(0, animations.spring);
    counterScale.value = withDelay(200, withSpring(1, animations.springBouncy));
  }, [counterScale, headerOpacity, headerY]);

  const data = useMemo(
    () =>
      notes.map((note) => ({
        ...note,
        subtitle: note.summary || note.transcript.slice(0, 80),
      })),
    [notes],
  );

  const confirmDelete = (id: string) => {
    Alert.alert('Notu sil? / Delete note?', 'Bu işlem geri alınamaz / This action is permanent.', [
      { text: 'İptal / Cancel', style: 'cancel' },
      {
        text: 'Sil / Delete',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ]);
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  return (
    <GradientScreen>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.titleRow}>
          <View style={styles.brandContainer}>
            <Text style={styles.crown}>👑</Text>
            <View>
              <LinearGradient colors={gradients.gold} style={styles.brandBadge}>
                <Text style={styles.eyebrow}>AUTODICTATE</Text>
              </LinearGradient>
            </View>
          </View>
          <Animated.View style={[styles.pill, counterStyle]}>
            <Text style={styles.pillText}>{notes.length} not / notes</Text>
          </Animated.View>
        </View>
        <Text style={styles.title}>Kayıtların / Your Recordings</Text>
        <Text style={styles.subtitle}>
          Dinle, zaman çizgisini incele, AI özet paylaş / Listen, explore timeline, share AI summary.
        </Text>
      </Animated.View>

      {/* Content */}
      {!ready ? (
        <View style={styles.loadingList}>
          {[0, 1, 2].map((key) => (
            <LoadingSkeleton key={key} delay={key * 100} />
          ))}
        </View>
      ) : data.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NoteCard
              item={item}
              index={index}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
              onDelete={() => confirmDelete(item.id)}
            />
          )}
        />
      )}

      <FloatingActionButton label="Yeni kayıt / New recording" onPress={() => router.push('/record')} />
    </GradientScreen>
  );
}

// Note card with staggered animation
const NoteCard: React.FC<{
  item: any;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}> = ({ item, index, onPress, onDelete }) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, animations.spring));
  }, [index, opacity, scale, translateX]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={cardStyle}>
      <Pressable onPress={onPress}>
        <GlassCard>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <View style={styles.itemIcon}>
                <Feather name="mic" size={16} color={colors.gold} />
              </View>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title || 'Note audio'}
                </Text>
                <Text style={styles.duration}>{formatMillis(item.duration)}</Text>
              </View>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={styles.deleteButton}
              hitSlop={10}>
              <Feather name="trash-2" size={16} color={colors.danger} />
            </Pressable>
          </View>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          <Text style={styles.itemText} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

// Loading skeleton with shimmer
const LoadingSkeleton: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.3, { duration: 800 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.loadingCard, style]} />;
};

import { withRepeat, withSequence } from 'react-native-reanimated';

// Empty state
const EmptyState: React.FC = () => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, animations.spring);
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <GlassCard style={styles.empty} glowing>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>🎙️</Text>
        </View>
        <Text style={styles.emptyTitle}>Henüz not yok / No notes yet</Text>
        <Text style={styles.muted}>
          AI sihirini görmek için kayıt başlat ✨ / Start recording to see AI magic ✨
        </Text>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  crown: {
    fontSize: 22,
  },
  brandBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  eyebrow: {
    color: colors.backgroundDeep,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 11,
  },
  pill: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
  loadingList: {
    gap: spacing.md,
  },
  loadingCard: {
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 140,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  duration: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 12,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 20,
  },
});

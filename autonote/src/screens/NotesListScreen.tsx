import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { useNotes } from '@/context/NotesContext';
import { colors, radius, spacing, animations } from '@/styles/theme';
import { formatDate, formatMillis } from '@/utils/time';
import { withRepeat, withSequence } from 'react-native-reanimated';

export default function NotesListScreen() {
  const router = useRouter();
  const { notes, ready, deleteNote } = useNotes();
  const [search, setSearch] = useState('');

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-15);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withSpring(0, animations.spring);
  }, [headerOpacity, headerY]);

  const data = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notes
      .filter((note) => {
        if (!q) return true;
        return (
          (note.title || '').toLowerCase().includes(q) ||
          (note.summary || '').toLowerCase().includes(q) ||
          (note.transcript || '').toLowerCase().includes(q)
        );
      })
      .map((note) => ({
        ...note,
        subtitle: note.summary || note.transcript.slice(0, 80),
      }));
  }, [notes, search]);

  const confirmDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete note?', 'This action is permanent.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ]);
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  return (
    <GradientScreen>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.appName}>AutoDictate</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{notes.length}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Your recordings</Text>
      </Animated.View>

      {/* Search */}
      {ready && notes.length > 0 && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search notes"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      {!ready ? (
        <View style={styles.loadingList}>
          {[0, 1, 2].map((key) => (
            <LoadingSkeleton key={key} delay={key * 80} />
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

      <FloatingActionButton label="New recording" onPress={() => router.push('/record')} />
    </GradientScreen>
  );
}

// Note card
const NoteCard: React.FC<{
  item: any;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}> = ({ item, index, onPress, onDelete }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, animations.spring));
  }, [index, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
      <Pressable onPress={onPress}>
        <GlassCard>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <View style={styles.itemIcon}>
                <Feather name="mic" size={15} color={colors.accent} />
              </View>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title || 'Audio note'}
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
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Delete note">
              <Feather name="trash-2" size={15} color={colors.danger} />
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

// Loading skeleton
const LoadingSkeleton: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
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

// Empty state
const EmptyState: React.FC = () => {
  const router = useRouter();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <GlassCard style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Feather name="mic" size={28} color={colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>No notes yet</Text>
        <Text style={styles.emptySubtitle}>
          Record a lecture and let AI handle the rest
        </Text>
        <Pressable
          style={styles.emptyCta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/record');
          }}
          accessibilityRole="button"
          accessibilityLabel="Record your first lecture">
          <Feather name="mic" size={16} color="#FFFFFF" />
          <Text style={styles.emptyCtaText}>Record your first lecture</Text>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  countText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  loadingList: {
    gap: spacing.md,
  },
  loadingCard: {
    height: 90,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundDeep,
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
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  duration: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 12,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 18,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

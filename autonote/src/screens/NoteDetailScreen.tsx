import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { TimelineSegment } from '@/components/TimelineSegment';
import { AudioProgress } from '@/components/AudioProgress';
import { useNotes } from '@/context/NotesContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, radius, spacing, animations } from '@/styles/theme';
import { chunkTimeline } from '@/utils/timeline';
import { formatMillis } from '@/utils/time';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { key: 'player', icon: 'headphones', label: 'Player' },
  { key: 'summary', icon: 'file-text', label: 'Summary' },
  { key: 'points', icon: 'star', label: 'Points' },
  { key: 'notes', icon: 'edit-3', label: 'Notes' },
  { key: 'timeline', icon: 'clock', label: 'Timeline' },
] as const;

// Tab index for the key-points/study-topics page
const POINTS_TAB = 2;

export default function NoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getNote, updateNote } = useNotes();
  const note = params.id ? getNote(params.id) : undefined;
  const player = useAudioPlayer(note?.audioUri);
  const playbackError = player.error;

  const [summary, setSummary] = useState(note?.summary ?? '');
  const [keyPointsText, setKeyPointsText] = useState((note?.keyPoints ?? []).join('\n'));
  const [actionsText, setActionsText] = useState((note?.actionItems ?? []).join('\n'));
  const [notesText, setNotesText] = useState(note?.notes ?? '');
  const [activeTab, setActiveTab] = useState(0);

  const pagerRef = useRef<ScrollView>(null);
  const indicatorX = useSharedValue(0);
  const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

  // Header animation
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-15);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withSpring(0, animations.spring);
  }, [headerOpacity, headerY]);

  useEffect(() => {
    if (note) {
      setSummary(note.summary);
      setKeyPointsText(note.keyPoints.join('\n'));
      setActionsText(note.actionItems.join('\n'));
      setNotesText(note.notes);
    }
  }, [note?.id]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const goToTab = (index: number) => {
    setActiveTab(index);
    indicatorX.value = withSpring(index * TAB_WIDTH, animations.spring);
    pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const onPageScroll = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (page !== activeTab) {
      setActiveTab(page);
      indicatorX.value = withSpring(page * TAB_WIDTH, animations.spring);
    }
  };

  if (!note) {
    return (
      <GradientScreen>
        <View style={styles.notFound}>
          <Feather name="search" size={40} color={colors.muted} />
          <Text style={styles.notFoundTitle}>Note not found</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.backLink}>
            <Feather name="arrow-left" size={16} color={colors.accent} />
            <Text style={styles.link}>Back</Text>
          </Pressable>
        </View>
      </GradientScreen>
    );
  }

  const saveSummary = async () => updateNote(note.id, { summary });
  const saveKeyPoints = async () =>
    updateNote(note.id, { keyPoints: keyPointsText.split('\n').map((l) => l.trim()).filter(Boolean) });
  const saveActions = async () =>
    updateNote(note.id, { actionItems: actionsText.split('\n').map((l) => l.trim()).filter(Boolean) });
  const saveNotes = async () => updateNote(note.id, { notes: notesText });

  const segments = useMemo(() => chunkTimeline(note.timeline), [note.timeline]);

  return (
    <GradientScreen style={styles.screen}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{note.title || 'Audio note'}</Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={12} color={colors.muted} />
            <Text style={styles.metaText}>{formatMillis(note.duration)}</Text>
            <View style={styles.metaDot} />
            <Feather name="calendar" size={12} color={colors.muted} />
            <Text style={styles.metaText}>{new Date(note.date).toLocaleDateString()}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === i;
          return (
            <Pressable key={tab.key} style={styles.tabItem} onPress={() => goToTab(i)}>
              <Feather
                name={tab.icon as any}
                size={17}
                color={isActive ? colors.accent : colors.muted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        <Animated.View style={[styles.tabIndicator, { width: TAB_WIDTH }, indicatorStyle]} />
      </View>

      {/* Pages */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPageScroll}
        style={styles.pager}
        keyboardShouldPersistTaps="handled"
      >
        {/* Player */}
        <PageWrapper>
          <GlassCard glowing>
            <View style={styles.playerHeader}>
              <Feather name="headphones" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Audio player</Text>
            </View>
            <View style={styles.playerRow}>
              <Pressable
                style={[styles.playButton, playbackError && styles.playButtonDisabled]}
                onPress={player.toggle}
                disabled={!!playbackError}>
                <Feather
                  name={player.isPlaying ? 'pause' : 'play'}
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <AudioProgress position={player.position} duration={player.duration} onSeek={player.seekTo} />
              </View>
            </View>
            {playbackError ? (
              <Text style={styles.errorText}>{playbackError}</Text>
            ) : (
              <Text style={styles.hint}>Tap the bar to seek</Text>
            )}
          </GlassCard>

          {note.timedKeywords.length > 0 && (
            <View style={[styles.keywordsSection, { marginTop: spacing.lg }]}>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={15} color={colors.accent} />
                <Text style={styles.sectionTitle}>Keywords</Text>
              </View>
              <View style={styles.keywordRow}>
                {note.timedKeywords.map((kw, i) => (
                  <KeywordBadge key={kw.keyword} keyword={kw} index={i} />
                ))}
              </View>
            </View>
          )}
        </PageWrapper>

        {/* Summary */}
        <PageWrapper>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <TextInput
              multiline
              value={summary}
              onChangeText={setSummary}
              onBlur={saveSummary}
              placeholder="Edit summary..."
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>
        </PageWrapper>

        {/* Points + Actions */}
        <PageWrapper scrollable>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Key points</Text>
            </View>
            <TextInput
              multiline
              value={keyPointsText}
              onChangeText={setKeyPointsText}
              onBlur={saveKeyPoints}
              placeholder="One point per line"
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>

          <GlassCard style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Feather name="book-open" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Study Topics</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Topics from this lecture worth studying deeper
            </Text>
            <TextInput
              multiline
              value={actionsText}
              onChangeText={setActionsText}
              onBlur={saveActions}
              placeholder="One topic per line"
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>
        </PageWrapper>

        {/* Notes */}
        <PageWrapper>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="edit-3" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Personal notes</Text>
            </View>
            <TextInput
              multiline
              value={notesText}
              onChangeText={setNotesText}
              onBlur={saveNotes}
              placeholder="Add your notes or decisions..."
              placeholderTextColor={colors.muted}
              style={[styles.textArea, { minHeight: 200 }]}
            />
          </GlassCard>
        </PageWrapper>

        {/* Timeline */}
        <PageWrapper scrollable>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            {segments.map((seg, idx) => (
              <TimelineSegment
                key={`${seg.start}-${idx}`}
                text={seg.text}
                startMs={seg.start * 1000}
                index={idx}
                onPress={(ms) => {
                  if (!playbackError) {
                    player.seekTo(ms);
                    goToTab(0);
                  }
                }}
              />
            ))}
          </GlassCard>
        </PageWrapper>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {TABS.map((_, i) => (
          <Pressable key={i} onPress={() => goToTab(i)}>
            <View style={[styles.dot, activeTab === i && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </GradientScreen>
  );
}

// Page wrapper
const PageWrapper: React.FC<{ children: React.ReactNode; scrollable?: boolean }> = ({
  children,
  scrollable = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(40, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(40, withSpring(0, animations.spring));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    width: SCREEN_WIDTH,
  }));

  return (
    <Animated.View style={style}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.pageContent}>{children}</View>
      )}
    </Animated.View>
  );
};

// Keyword badge
const KeywordBadge: React.FC<{ keyword: { keyword: string; time: number }; index: number }> = ({ keyword, index }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 40, withSpring(1, animations.springBouncy));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.keyword, style]}>
      <Text style={styles.keywordLabel}>{keyword.keyword}</Text>
      <Text style={styles.keywordTime}>{formatMillis(keyword.time * 1000)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 0,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
    backgroundColor: colors.background,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },

  // Pager
  pager: {
    flex: 1,
  },
  pageContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  keywordsSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },

  // Player
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginTop: -2,
  },
  textArea: {
    color: colors.text,
    backgroundColor: colors.backgroundDeep,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  keyword: {
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.12)',
  },
  keywordLabel: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  keywordTime: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
  },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Share,
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
import * as Haptics from 'expo-haptics';
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
  const [savedField, setSavedField] = useState<string | null>(null);

  const segments = useMemo(() => note ? chunkTimeline(note.timeline) : [], [note?.timeline]);

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
    Haptics.selectionAsync();
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

  const showSaved = (field: string) => {
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1200);
  };

  const saveSummary = async () => { await updateNote(note.id, { summary }); showSaved('summary'); };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parts: string[] = [];
    parts.push(`📝 ${note.title || 'Audio Note'}`);
    parts.push(`📅 ${new Date(note.date).toLocaleDateString()}`);
    parts.push('');
    if (note.summary) {
      parts.push('📋 Summary');
      parts.push(note.summary);
      parts.push('');
    }
    if (note.keyPoints.length > 0) {
      parts.push('⭐ Key Points');
      note.keyPoints.forEach((p) => parts.push(`• ${p}`));
      parts.push('');
    }
    if (note.actionItems.length > 0) {
      parts.push('📚 Study Topics');
      note.actionItems.forEach((a) => parts.push(`• ${a}`));
      parts.push('');
    }
    parts.push('— Shared from AutoDictate');
    try {
      await Share.share({ message: parts.join('\n') });
    } catch {
      // user cancelled
    }
  };
  const saveKeyPoints = async () => {
    await updateNote(note.id, { keyPoints: keyPointsText.split('\n').map((l) => l.trim()).filter(Boolean) });
    showSaved('keyPoints');
  };
  const saveActions = async () => {
    await updateNote(note.id, { actionItems: actionsText.split('\n').map((l) => l.trim()).filter(Boolean) });
    showSaved('actions');
  };
  const saveNotes = async () => { await updateNote(note.id, { notes: notesText }); showSaved('notes'); };

  return (
    <GradientScreen style={styles.screen}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
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
        <Pressable
          onPress={handleShare}
          style={styles.shareButton}
          accessibilityRole="button"
          accessibilityLabel="Share note">
          <Feather name="share" size={18} color={colors.accent} />
        </Pressable>
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === i;
          return (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={() => goToTab(i)}
              hitSlop={{ top: 8, bottom: 8 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}>
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  player.toggle();
                }}
                disabled={!!playbackError}
                accessibilityRole="button"
                accessibilityLabel={player.isPlaying ? 'Pause audio' : 'Play audio'}>
                <Feather
                  name={player.isPlaying ? 'pause' : 'play'}
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <AudioProgress position={player.position} duration={player.duration} onSeek={player.seekTo} />
              </View>
              <Pressable
                style={styles.speedButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  player.cycleRate();
                }}
                disabled={!!playbackError}
                accessibilityRole="button"
                accessibilityLabel={`Playback speed ${player.rate}x. Tap to change.`}>
                <Text style={styles.speedText}>{player.rate}x</Text>
              </Pressable>
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
                  <KeywordBadge
                    key={kw.keyword}
                    keyword={kw}
                    index={i}
                    onPress={(ms) => {
                      if (!playbackError) player.seekTo(ms);
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </PageWrapper>

        {/* Summary */}
        <PageWrapper scrollable>
          {/* TL;DR banner */}
          {!!(note.tldr ?? '') && (
            <View style={styles.tldrCard}>
              <View style={styles.tldrHeader}>
                <Feather name="zap" size={14} color={colors.accent} />
                <Text style={styles.tldrLabel}>TL;DR</Text>
              </View>
              <Text style={styles.tldrText}>{note.tldr}</Text>
            </View>
          )}

          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Summary</Text>
              {savedField === 'summary' && <SavedBadge />}
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

          {/* Glossary */}
          {(note.definitions ?? []).length > 0 && (
            <GlassCard style={{ marginTop: spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Feather name="book" size={17} color={colors.accent} />
                <Text style={styles.sectionTitle}>Glossary</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Key terms defined in this lecture</Text>
              {(note.definitions ?? []).map((d, i) => (
                <View key={i} style={[styles.definitionItem, i < (note.definitions?.length ?? 0) - 1 && styles.definitionItemBorder]}>
                  <Text style={styles.definitionTerm}>{d.term}</Text>
                  <Text style={styles.definitionText}>{d.definition}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </PageWrapper>

        {/* Points + Actions */}
        <PageWrapper scrollable>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Key points</Text>
              {savedField === 'keyPoints' && <SavedBadge />}
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
              {savedField === 'actions' && <SavedBadge />}
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

          {/* Exam Questions */}
          {(note.examQuestions ?? []).length > 0 && (
            <GlassCard style={{ marginTop: spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Feather name="help-circle" size={17} color={colors.accent} />
                <Text style={styles.sectionTitle}>Exam Questions</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Likely questions based on what was emphasized</Text>
              {(note.examQuestions ?? []).map((q, i) => (
                <View key={i} style={styles.examQuestion}>
                  <View style={styles.examQBadge}>
                    <Text style={styles.examQNumber}>Q{i + 1}</Text>
                  </View>
                  <Text style={styles.examQText}>{q}</Text>
                </View>
              ))}
            </GlassCard>
          )}

          {/* Study Plan */}
          {(note.studyPlan ?? []).length > 0 && (
            <GlassCard style={{ marginTop: spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Feather name="check-square" size={17} color={colors.accent} />
                <Text style={styles.sectionTitle}>Study Plan</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Actionable steps for this lecture</Text>
              {(note.studyPlan ?? []).map((step, i) => (
                <View key={i} style={styles.studyStep}>
                  <View style={styles.studyStepDot} />
                  <Text style={styles.studyStepText}>{step}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </PageWrapper>

        {/* Notes */}
        <PageWrapper scrollable>
          {/* Flashcards */}
          {(note.flashcards ?? []).length > 0 && (
            <GlassCard style={{ marginBottom: spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Feather name="layers" size={17} color={colors.accent} />
                <Text style={styles.sectionTitle}>Flashcards</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Tap a card to reveal the answer</Text>
              {(note.flashcards ?? []).map((f, i) => (
                <FlashCard key={i} question={f.question} answer={f.answer} index={i} />
              ))}
            </GlassCard>
          )}

          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="edit-3" size={17} color={colors.accent} />
              <Text style={styles.sectionTitle}>Personal notes</Text>
              {savedField === 'notes' && <SavedBadge />}
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
            {segments.map((seg, idx) => {
              const segStartMs = seg.start * 1000;
              const nextStartMs = idx < segments.length - 1 ? segments[idx + 1].start * 1000 : Infinity;
              const isActive = player.position >= segStartMs && player.position < nextStartMs;
              return (
                <TimelineSegment
                  key={`${seg.start}-${idx}`}
                  text={seg.text}
                  startMs={segStartMs}
                  index={idx}
                  isActive={isActive}
                  onPress={(ms) => {
                    if (!playbackError) {
                      player.seekTo(ms);
                      goToTab(0);
                    }
                  }}
                />
              );
            })}
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

// FlashCard — tap to flip between question and answer
const FlashCard: React.FC<{ question: string; answer: string; index: number }> = ({
  question,
  answer,
  index,
}) => {
  const [flipped, setFlipped] = React.useState(false);
  const rotateY = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    transform: [{ rotateY: `${rotateY.value}deg` }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transform: [{ rotateY: `${rotateY.value + 180}deg` }],
  }));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = flipped ? 0 : 180;
    rotateY.value = withSpring(next, { damping: 14, stiffness: 120 });
    setFlipped(!flipped);
  };

  return (
    <Pressable onPress={handleFlip} style={styles.flashcardWrapper}>
      <View style={{ height: 80 }}>
        <Animated.View style={[styles.flashcardFace, styles.flashcardFront, frontStyle]}>
          <Text style={styles.flashcardSideLabel}>Q</Text>
          <Text style={styles.flashcardText} numberOfLines={3}>{question}</Text>
        </Animated.View>
        <Animated.View style={[styles.flashcardFace, styles.flashcardBack, backStyle]}>
          <Text style={[styles.flashcardSideLabel, { color: colors.success }]}>A</Text>
          <Text style={[styles.flashcardText, { color: colors.text }]} numberOfLines={3}>{answer}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
};

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

// Saved badge — appears briefly after save
const SavedBadge: React.FC = () => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
    }, 800);
    return () => clearTimeout(timer);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.savedBadge, style]}>
      <Feather name="check" size={11} color={colors.success} />
      <Text style={styles.savedText}>Saved</Text>
    </Animated.View>
  );
};

// Keyword badge
const KeywordBadge: React.FC<{
  keyword: { keyword: string; time: number };
  index: number;
  onPress?: (ms: number) => void;
}> = ({ keyword, index, onPress }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 40, withSpring(1, animations.springBouncy));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(keyword.time * 1000);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Seek to ${keyword.keyword}`}>
      <Animated.View style={[styles.keyword, style]}>
        <Text style={styles.keywordLabel}>{keyword.keyword}</Text>
        <Text style={styles.keywordTime}>{formatMillis(keyword.time * 1000)}</Text>
      </Animated.View>
    </Pressable>
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
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
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
    paddingVertical: spacing.md,
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
  speedButton: {
    minWidth: 44,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  speedText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
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
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  savedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
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

  // TL;DR
  tldrCard: {
    backgroundColor: 'rgba(217, 119, 6, 0.07)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tldrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tldrLabel: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tldrText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Glossary / Definitions
  definitionItem: {
    paddingVertical: spacing.sm,
  },
  definitionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  definitionTerm: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 3,
  },
  definitionText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Exam questions
  examQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  examQBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  examQNumber: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
  },
  examQText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },

  // Study plan
  studyStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  studyStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
    flexShrink: 0,
  },
  studyStepText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Flashcards
  flashcardWrapper: {
    marginTop: spacing.sm,
  },
  flashcardFace: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 80,
  },
  flashcardFront: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
  },
  flashcardBack: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  flashcardSideLabel: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
    width: 20,
    flexShrink: 0,
    marginTop: 1,
  },
  flashcardText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

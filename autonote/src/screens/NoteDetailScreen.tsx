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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { TimelineSegment } from '@/components/TimelineSegment';
import { AudioProgress } from '@/components/AudioProgress';
import { useNotes } from '@/context/NotesContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';
import { chunkTimeline } from '@/utils/timeline';
import { formatMillis } from '@/utils/time';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { key: 'player',   icon: 'headphones', label: 'Player'    },
  { key: 'summary',  icon: 'file-text',  label: 'Özet'      },
  { key: 'points',   icon: 'star',       label: 'Noktalar'  },
  { key: 'notes',    icon: 'edit-3',     label: 'Notlar'    },
  { key: 'timeline', icon: 'clock',      label: 'Timeline'  },
] as const;

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
  const headerY = useSharedValue(-20);
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
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={styles.error}>Not bulunamadı / Note not found</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.backLink}>
            <Feather name="arrow-left" size={18} color={colors.gold} />
            <Text style={styles.link}>Geri / Back</Text>
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
      {/* ── Persistent Header ── */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.gold} />
        </Pressable>
        <View style={styles.headerContent}>
          <LinearGradient colors={gradients.gold} style={styles.eyebrowBadge}>
            <Text style={styles.eyebrow}>RECORDED</Text>
          </LinearGradient>
          <Text style={styles.title} numberOfLines={2}>{note.title || 'Ses notu / Audio note'}</Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={13} color={colors.muted} />
            <Text style={styles.metaText}>{formatMillis(note.duration)}</Text>
            <View style={styles.metaDot} />
            <Feather name="calendar" size={13} color={colors.muted} />
            <Text style={styles.metaText}>{new Date(note.date).toLocaleDateString()}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === i;
          return (
            <Pressable key={tab.key} style={styles.tabItem} onPress={() => goToTab(i)}>
              <Feather
                name={tab.icon as any}
                size={18}
                color={isActive ? colors.primary : colors.muted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        {/* Sliding indicator */}
        <Animated.View style={[styles.tabIndicator, { width: TAB_WIDTH }, indicatorStyle]} />
      </View>

      {/* ── Swipeable Pages ── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPageScroll}
        style={styles.pager}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page 0 — Player */}
        <PageWrapper>
          <GlassCard glowing>
            <View style={styles.playerHeader}>
              <Feather name="headphones" size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>Ses oynatıcı / Audio player</Text>
            </View>
            <View style={styles.playerRow}>
              <Pressable
                style={[styles.playButton, playbackError && styles.playButtonDisabled]}
                onPress={player.toggle}
                disabled={!!playbackError}>
                <LinearGradient
                  colors={playbackError ? [colors.muted, colors.muted] : gradients.gold}
                  style={styles.playButtonGradient}>
                  <Feather
                    name={player.isPlaying ? 'pause' : 'play'}
                    size={26}
                    color={colors.backgroundDeep}
                  />
                </LinearGradient>
              </Pressable>
              <View style={{ flex: 1 }}>
                <AudioProgress position={player.position} duration={player.duration} onSeek={player.seekTo} />
              </View>
            </View>
            {playbackError ? (
              <Text style={styles.errorText}>{playbackError}</Text>
            ) : (
              <Text style={styles.hint}>Çubuğa dokunarak ileri/geri sar / Tap to seek</Text>
            )}
          </GlassCard>

          {/* Keywords inside player page */}
          {note.timedKeywords.length > 0 && (
            <View style={[styles.glassSection, { marginTop: spacing.lg }]}>
              <View style={styles.sectionHeader}>
                <Feather name="tag" size={16} color={colors.gold} />
                <Text style={styles.sectionTitle}>Anahtar kelimeler / Keywords</Text>
              </View>
              <View style={styles.keywordRow}>
                {note.timedKeywords.map((kw, i) => (
                  <KeywordBadge key={kw.keyword} keyword={kw} index={i} />
                ))}
              </View>
            </View>
          )}
        </PageWrapper>

        {/* Page 1 — Summary */}
        <PageWrapper>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Özet / Summary</Text>
            </View>
            <TextInput
              multiline
              value={summary}
              onChangeText={setSummary}
              onBlur={saveSummary}
              placeholder="Özeti düzenle / Edit summary..."
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>
        </PageWrapper>

        {/* Page 2 — Key Points + Actions */}
        <PageWrapper scrollable>
          <GlassCard style={styles.pageCard}>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Anahtar noktalar / Key points</Text>
            </View>
            <TextInput
              multiline
              value={keyPointsText}
              onChangeText={setKeyPointsText}
              onBlur={saveKeyPoints}
              placeholder="Her satıra bir nokta / One point per line"
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>

          <GlassCard style={[styles.pageCard, { marginTop: spacing.lg }]}>
            <View style={styles.sectionHeader}>
              <Feather name="check-circle" size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Eylemler / Actions</Text>
            </View>
            <TextInput
              multiline
              value={actionsText}
              onChangeText={setActionsText}
              onBlur={saveActions}
              placeholder="Her satıra bir eylem / One action per line"
              placeholderTextColor={colors.muted}
              style={styles.textArea}
            />
          </GlassCard>
        </PageWrapper>

        {/* Page 3 — Personal Notes */}
        <PageWrapper>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="edit-3" size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Kişisel notlar / Personal notes</Text>
            </View>
            <TextInput
              multiline
              value={notesText}
              onChangeText={setNotesText}
              onBlur={saveNotes}
              placeholder="Notlarını veya kararlarını ekle / Add your notes or decisions..."
              placeholderTextColor={colors.muted}
              style={[styles.textArea, { minHeight: 200 }]}
            />
          </GlassCard>
        </PageWrapper>

        {/* Page 4 — Timeline */}
        <PageWrapper scrollable>
          <GlassCard>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={18} color={colors.gold} />
              <Text style={styles.sectionTitle}>Zaman çizgisi / Timeline</Text>
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
                    goToTab(0); // jump back to player page
                  }
                }}
              />
            ))}
          </GlassCard>
        </PageWrapper>
      </ScrollView>

      {/* ── Dot pagination ── */}
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

// ── Page wrapper: each page is full-screen width, vertically scrollable ──
const PageWrapper: React.FC<{ children: React.ReactNode; scrollable?: boolean }> = ({
  children,
  scrollable = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(60, withTiming(1, { duration: 280 }));
    translateY.value = withDelay(60, withSpring(0, animations.spring));
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
    scale.value = withDelay(index * 50, withSpring(1, animations.springBouncy));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.keyword, style]}>
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.keywordLabel}>{keyword.keyword}</Text>
      <Text style={styles.keywordTime}>{formatMillis(keyword.time * 1000)}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // ── Override GradientScreen padding so pager spans full width ──
  screen: {
    padding: 0,
    paddingBottom: 0,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
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
  eyebrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  eyebrow: {
    color: colors.backgroundDeep,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 10,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
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

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },

  // ── Pager ──
  pager: {
    flex: 1,
  },
  pageContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pageCard: {
    // GlassCard already has padding/border
  },
  glassSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  // ── Dot pagination ──
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
    width: 20,
    backgroundColor: colors.primary,
  },

  // ── Player ──
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
    borderRadius: 30,
    overflow: 'hidden',
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playButtonGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── Sections ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  textArea: {
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  keywordLabel: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  keywordTime: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },

  // ── Not found ──
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  notFoundEmoji: {
    fontSize: 48,
  },
  error: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  link: {
    color: colors.gold,
    fontWeight: '700',
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
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

  // Animations
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
    updateNote(note.id, {
      keyPoints: keyPointsText.split('\n').map((l) => l.trim()).filter(Boolean),
    });
  const saveActions = async () =>
    updateNote(note.id, {
      actionItems: actionsText.split('\n').map((l) => l.trim()).filter(Boolean),
    });
  const saveNotes = async () => updateNote(note.id, { notes: notesText });

  const segments = useMemo(() => chunkTimeline(note.timeline), [note.timeline]);

  return (
    <GradientScreen scrollable>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.gold} />
        </Pressable>
        <View style={styles.headerContent}>
          <LinearGradient colors={gradients.gold} style={styles.eyebrowBadge}>
            <Text style={styles.eyebrow}>RECORDED</Text>
          </LinearGradient>
          <Text style={styles.title}>{note.title || 'Ses notu / Audio note'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={colors.muted} />
              <Text style={styles.metaText}>{formatMillis(note.duration)}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={colors.muted} />
              <Text style={styles.metaText}>{new Date(note.date).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Audio Player */}
      <AnimatedCard delay={100}>
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
                  size={24}
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
            <Text style={styles.hint}>Gezinmek için çubuğa veya zaman çizgisine dokunun / Tap bar or timeline to navigate</Text>
          )}
        </GlassCard>
      </AnimatedCard>

      {/* Summary */}
      <AnimatedCard delay={200}>
        <GlassCard>
          <SectionHeader icon="file-text" title="Özet / Summary" />
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
      </AnimatedCard>

      {/* Key Points & Actions */}
      <AnimatedCard delay={300}>
        <GlassCard>
          <SectionHeader icon="star" title="Anahtar noktalar / Key points" />
          <TextInput
            multiline
            value={keyPointsText}
            onChangeText={setKeyPointsText}
            onBlur={saveKeyPoints}
            placeholder="Her satıra bir nokta / One point per line"
            placeholderTextColor={colors.muted}
            style={styles.textArea}
          />
          <SectionHeader icon="check-circle" title="Eylemler / Actions" style={{ marginTop: spacing.lg }} />
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
      </AnimatedCard>

      {/* Notes */}
      <AnimatedCard delay={400}>
        <GlassCard>
          <SectionHeader icon="edit-3" title="Kişisel notlar / Personal notes" />
          <TextInput
            multiline
            value={notesText}
            onChangeText={setNotesText}
            onBlur={saveNotes}
            placeholder="Notlarını veya kararlarını ekle / Add your notes or decisions..."
            placeholderTextColor={colors.muted}
            style={styles.textArea}
          />
        </GlassCard>
      </AnimatedCard>

      {/* Timeline */}
      <AnimatedCard delay={500}>
        <GlassCard>
          <SectionHeader icon="clock" title="Timeline" />
          <ScrollView style={styles.timeline} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {segments.map((segment, idx) => (
              <TimelineSegment
                key={`${segment.start}-${idx}`}
                text={segment.text}
                startMs={segment.start * 1000}
                index={idx}
                onPress={(ms) => {
                  if (!playbackError) player.seekTo(ms);
                }}
              />
            ))}
          </ScrollView>
        </GlassCard>
      </AnimatedCard>

      {/* Keywords */}
      {note.timedKeywords.length > 0 && (
        <AnimatedCard delay={600}>
          <View style={styles.keywordRow}>
            {note.timedKeywords.map((kw, i) => (
              <KeywordBadge key={kw.keyword} keyword={kw} index={i} />
            ))}
          </View>
        </AnimatedCard>
      )}
    </GradientScreen>
  );
}

// Animated card wrapper
const AnimatedCard: React.FC<{ children: React.ReactNode; delay: number }> = ({ children, delay }) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, animations.spring));
  }, [delay, opacity, scale, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    marginBottom: spacing.lg,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

// Section header
const SectionHeader: React.FC<{ icon: string; title: string; style?: any }> = ({ icon, title, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Feather name={icon as any} size={18} color={colors.gold} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
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
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
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
    borderRadius: 28,
    overflow: 'hidden',
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
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
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
  },
  timeline: {
    maxHeight: 350,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
});

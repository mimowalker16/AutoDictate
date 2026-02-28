import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { colors, spacing, radius, animations } from '@/styles/theme';
import { uploadToSpeechmatics, pollSpeechmaticsTranscript } from '@/api/speechmatics';
import { summarizeWithGemini } from '@/api/gemini';
import { useNotes } from '@/context/NotesContext';
import { Note } from '@/types/note';
import { estimateKeywordTimes } from '@/utils/timeline';

const clipText = (value: string, max = 800) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const stripExtension = (value?: string) => (value ? value.replace(/\.[^/.]+$/, '') : '');

const fallbackTitleFromFileName = (fileName?: string) => {
  const trimmed = stripExtension(fileName) || '';
  if (trimmed && trimmed.toLowerCase() !== 'recording') return trimmed;
  return `Note audio ${new Date().toLocaleString()}`;
};

const extractExtension = (fileName?: string, uri?: string) => {
  const fromName = fileName?.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName;
  const uriPart = uri?.split('?')[0];
  const fromUri = uriPart?.split('.').pop();
  if (fromUri && fromUri.length <= 5) return fromUri;
  return 'm4a';
};

const slugifyTitle = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return (normalized || 'note').toLowerCase().slice(0, 60);
};

const renameRecordingWithTitle = async (uri: string, title: string, extension: string) => {
  if (Platform.OS === 'web') return uri;
  try {
    const cleanUri = uri.split('?')[0];
    const lastSlash = cleanUri.lastIndexOf('/');
    if (lastSlash === -1) return uri;
    const dir = cleanUri.slice(0, lastSlash + 1);
    const safeBase = slugifyTitle(title);
    const target = `${dir}${safeBase}-${Date.now()}.${extension || 'm4a'}`;
    await FileSystem.moveAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
};

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ audioUri?: string; duration?: string; fileName?: string }>();
  const { addNote } = useNotes();

  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-15);
  const loaderRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withSpring(0, animations.spring);

    loaderRotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false,
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000 }),
        withTiming(0.95, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [headerOpacity, headerY, loaderRotation, pulseScale]);

  const steps = useMemo(
    () => [
      { label: 'Uploading audio...', active: activeIndex === 0, done: activeIndex > 0 },
      { label: 'Transcribing...', active: activeIndex === 1, done: activeIndex > 1 },
      { label: 'AI summarizing...', active: activeIndex === 2, done: activeIndex > 2 },
      { label: 'Saving...', active: activeIndex === 3, done: activeIndex > 3 },
    ],
    [activeIndex],
  );

  const process = React.useCallback(async () => {
    if (!params.audioUri) return;
    try {
      setError(null);
      setFailed(false);
      setActiveIndex(0);
      const defaultTitle = fallbackTitleFromFileName(params.fileName);
      const audioExtension = extractExtension(params.fileName, params.audioUri);
      let chosenTitle = defaultTitle;

      if (Platform.OS === 'web' && params.audioUri?.startsWith('blob:')) {
        throw new Error("Web recordings not supported");
      }

      const jobId = await uploadToSpeechmatics(params.audioUri!);
      setActiveIndex(1);

      const { transcriptText, timeline, transcriptJson } = await pollSpeechmaticsTranscript(
        jobId,
        (status) => setActiveIndex(status === 'done' ? 2 : 1),
      );

      setTranscript(transcriptText || '(Empty)');
      setActiveIndex(2);

      let summaryText = 'Transcript empty.';
      let points: string[] = [];
      let acts: string[] = [];
      if (transcriptText && transcriptText.length > 0) {
        try {
          const g = await summarizeWithGemini(transcriptText, timeline);
          summaryText = g.summary;
          points = g.keyPoints ?? [];
          acts = g.actionItems ?? [];
          if (g.title?.trim()) chosenTitle = g.title.trim();
        } catch {
          summaryText = 'Summary unavailable.';
        }
      }
      setSummary(summaryText);
      setKeyPoints(points);

      setActiveIndex(3);
      const finalTitle = chosenTitle || defaultTitle;
      const renamedUri = await renameRecordingWithTitle(params.audioUri!, finalTitle, audioExtension);
      const note: Note = {
        id: `note-${Date.now()}`,
        title: finalTitle,
        audioUri: renamedUri,
        duration: Number(params.duration ?? 0),
        date: new Date().toISOString(),
        transcript: transcriptText,
        summary: summaryText,
        keyPoints: points,
        actionItems: acts,
        notes: '',
        timeline,
        timedKeywords: estimateKeywordTimes(points ?? [], timeline),
      };
      await addNote(note);

      setActiveIndex(4);
      router.replace({ pathname: '/note/[id]', params: { id: note.id } });
    } catch (err) {
      const msg = (err as Error).message || 'Network error';
      setError(msg);
      setFailed(true);
    }
  }, [addNote, params.audioUri, params.duration, params.fileName, router]);

  useEffect(() => {
    if (!params.audioUri) {
      router.replace('/record');
      return;
    }
    process();
  }, [params.audioUri, process, router]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loaderRotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <GradientScreen scrollable>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.title}>Processing</Text>
        <Text style={styles.subtitle}>
          Transcribing and summarizing your recording...
        </Text>
      </Animated.View>

      {/* Main card */}
      <GlassCard style={styles.card} glowing={!error}>
        {/* Loader */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.loaderOuter, pulseStyle]}>
            <Animated.View style={[styles.loaderSpinner, loaderStyle]}>
              <View style={styles.loaderArc} />
            </Animated.View>
            <View style={styles.loaderCenter}>
              {error ? (
                <Feather name="alert-circle" size={28} color={colors.danger} />
              ) : activeIndex >= 4 ? (
                <Feather name="check" size={28} color={colors.success} />
              ) : (
                <Text style={styles.loaderPercent}>
                  {Math.min(100, Math.round(((activeIndex + 1) / 5) * 100))}%
                </Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Steps */}
        <ProcessingSteps steps={steps} />

        {/* Status */}
        <View style={styles.statusContainer}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.hint}>Check your connection or API key.</Text>
              {failed && (
                <View style={styles.retryRow}>
                  <Pressable style={styles.retryButton} onPress={() => process()}>
                    <Feather name="refresh-cw" size={15} color={colors.accent} />
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                  <Pressable style={styles.retryButtonSecondary} onPress={() => router.replace('/record')}>
                    <Feather name="arrow-left" size={15} color={colors.muted} />
                    <Text style={styles.retryTextSecondary}>Go back</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.hint}>This may take a few seconds...</Text>
          )}
        </View>

        {/* Previews */}
        {!!transcript && (
          <View style={styles.previewBlock}>
            <View style={styles.previewHeader}>
              <Feather name="file-text" size={15} color={colors.accent} />
              <Text style={styles.previewTitle}>Transcript</Text>
            </View>
            <Text style={styles.previewText}>{clipText(transcript, 400)}</Text>
          </View>
        )}

        {!!summary && (
          <View style={styles.previewBlock}>
            <View style={styles.previewHeader}>
              <Feather name="zap" size={15} color={colors.accent} />
              <Text style={styles.previewTitle}>AI Summary</Text>
            </View>
            <Text style={styles.previewText}>{clipText(summary, 400)}</Text>
            {keyPoints.length > 0 && (
              <View style={styles.keyPointsList}>
                {keyPoints.slice(0, 3).map((kp) => (
                  <View key={kp} style={styles.keyPointItem}>
                    <View style={styles.keyPointDot} />
                    <Text style={styles.keyPointText}>{kp}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </GlassCard>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: spacing.xl,
  },
  loaderContainer: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  loaderOuter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderSpinner: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  loaderArc: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: colors.accent,
    borderRightColor: 'rgba(217, 119, 6, 0.3)',
  },
  loaderCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderPercent: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
  },
  statusContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  retryText: {
    color: colors.accent,
    fontWeight: '600',
  },
  retryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  retryButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryTextSecondary: {
    color: colors.muted,
    fontWeight: '600',
  },
  previewBlock: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  previewText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  keyPointsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  keyPointDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  keyPointText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});

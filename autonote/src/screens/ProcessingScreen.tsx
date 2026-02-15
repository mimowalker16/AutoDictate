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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { ProcessingSteps } from '@/components/ProcessingSteps';
import { colors, gradients, spacing, radius, animations } from '@/styles/theme';
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
  const headerY = useSharedValue(-20);
  const spinnerRotation = useSharedValue(0);
  const progressPulse = useSharedValue(0.8);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withSpring(0, animations.spring);

    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );

    progressPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.8, { duration: 800 }),
      ),
      -1,
      true,
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(0.9, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, [headerOpacity, headerY, progressPulse, ringScale, spinnerRotation]);

  const steps = useMemo(
    () => [
      { label: 'Ses dosyası yükleniyor... / Uploading audio...', active: activeIndex === 0, done: activeIndex > 0 },
      { label: 'Transkript oluşturuluyor... / Transcribing...', active: activeIndex === 1, done: activeIndex > 1 },
      { label: 'AI ile özet hazırlanıyor... / AI summarizing...', active: activeIndex === 2, done: activeIndex > 2 },
      { label: 'Kaydediliyor... / Saving...', active: activeIndex === 3, done: activeIndex > 3 },
    ],
    [activeIndex],
  );

  useEffect(() => {
    if (!params.audioUri) {
      router.replace('/record');
      return;
    }

    const process = async () => {
      try {
        setError(null);
        setFailed(false);
        setActiveIndex(0);
        const defaultTitle = fallbackTitleFromFileName(params.fileName);
        const audioExtension = extractExtension(params.fileName, params.audioUri);
        let chosenTitle = defaultTitle;

        if (Platform.OS === 'web' && params.audioUri?.startsWith('blob:')) {
          throw new Error("Web kayıtları desteklenmiyor / Web recordings not supported");
        }

        const jobId = await uploadToSpeechmatics(params.audioUri!);
        setActiveIndex(1);

        const { transcriptText, timeline, transcriptJson } = await pollSpeechmaticsTranscript(
          jobId,
          (status) => setActiveIndex(status === 'done' ? 2 : 1),
        );

        setTranscript(transcriptText || '(Boş / Empty)');
        setActiveIndex(2);

        let summaryText = 'Transkript boş / Transcript empty.';
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
            summaryText = 'Özet kullanılamıyor / Summary unavailable.';
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
        const msg = (err as Error).message || 'Ağ hatası / Network error';
        setError(msg);
        setFailed(true);
      }
    };

    process();
  }, [addNote, params.audioUri, params.duration, params.fileName, router]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: progressPulse.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <GradientScreen scrollable>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.eyebrowRow}>
          <LinearGradient colors={gradients.gold} style={styles.eyebrowBadge}>
            <Text style={styles.eyebrow}>PROCESSING</Text>
          </LinearGradient>
          <Text style={styles.crown}>⚙️</Text>
        </View>
        <Text style={styles.title}>Transcription + Résumé</Text>
        <Text style={styles.subtitle}>
          Audio envoyé à Speechmatics puis résumé par Gemini ✨
        </Text>
      </Animated.View>

      {/* Main processing card */}
      <GlassCard style={styles.card} glowing={!error}>
        {/* Animated loader */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.loaderRing, pulseStyle]} />
          <Animated.View style={[styles.spinner, spinnerStyle]}>
            <LinearGradient
              colors={error ? [colors.danger, colors.danger] : gradients.gold}
              style={styles.spinnerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          <View style={styles.loaderCenter}>
            {error ? (
              <Feather name="alert-circle" size={32} color={colors.danger} />
            ) : activeIndex >= 4 ? (
              <Feather name="check" size={32} color={colors.success} />
            ) : (
              <Text style={styles.loaderPercent}>{Math.min(100, Math.round(((activeIndex + 1) / 5) * 100))}%</Text>
            )}
          </View>
        </View>

        {/* Processing steps */}
        <ProcessingSteps steps={steps} />

        {/* Status message */}
        <View style={styles.statusContainer}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.hint}>Vérifie la connexion ou la clé API.</Text>
              {failed && (
                <Pressable style={styles.retryButton} onPress={() => router.replace('/record')}>
                  <Feather name="arrow-left" size={16} color={colors.gold} />
                  <Text style={styles.retryText}>Retour</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Text style={styles.hint}>Cela peut prendre quelques secondes...</Text>
          )}
        </View>

        {/* Preview sections */}
        {!!transcript && (
          <View style={styles.previewBlock}>
            <View style={styles.previewHeader}>
              <Feather name="file-text" size={16} color={colors.gold} />
              <Text style={styles.previewTitle}>Transcript</Text>
            </View>
            <Text style={styles.previewText}>{clipText(transcript, 400)}</Text>
          </View>
        )}

        {!!summary && (
          <View style={styles.previewBlock}>
            <View style={styles.previewHeader}>
              <Feather name="zap" size={16} color={colors.gold} />
              <Text style={styles.previewTitle}>Résumé Gemini</Text>
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrowBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  eyebrow: {
    color: colors.backgroundDeep,
    letterSpacing: 2,
    fontWeight: '800',
    fontSize: 11,
  },
  crown: {
    fontSize: 18,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  loaderRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  spinner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
  },
  spinnerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    opacity: 0.3,
  },
  loaderCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  loaderPercent: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
  },
  statusContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  retryText: {
    color: colors.gold,
    fontWeight: '700',
  },
  previewBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    fontWeight: '700',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  keyPointText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});

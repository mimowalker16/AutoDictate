import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientScreen } from '@/components/GradientScreen';
import { RecordButton } from '@/components/RecordButton';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { colors, spacing, radius, animations } from '@/styles/theme';

// ElevenLabs-style bar visualizer
const WaveformVisualizer: React.FC<{ isRecording: boolean; level: number }> = ({
  isRecording,
  level,
}) => {
  const bars = 14;

  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: bars }).map((_, i) => (
        <WaveformBar key={i} index={i} isRecording={isRecording} level={level} totalBars={bars} />
      ))}
    </View>
  );
};

const WaveformBar: React.FC<{
  index: number;
  isRecording: boolean;
  level: number;
  totalBars: number;
}> = ({ index, isRecording, level, totalBars }) => {
  const height = useSharedValue(6);
  const barOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (isRecording) {
      const center = totalBars / 2;
      const dist = Math.abs(index - center) / center;
      const baseHeight = 12 + (1 - dist) * 30;
      const variation = Math.random() * 20 + level * 40;
      const targetHeight = Math.min(56, baseHeight + variation);

      height.value = withTiming(targetHeight, {
        duration: 80 + Math.random() * 80,
        easing: Easing.out(Easing.ease),
      });
      barOpacity.value = withTiming(0.5 + level * 0.5, { duration: 80 });
    } else {
      height.value = withSpring(6, { damping: 18, stiffness: 100 });
      barOpacity.value = withTiming(0.2, { duration: 300 });
    }
  }, [height, index, isRecording, level, barOpacity, totalBars]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: barOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        isRecording && styles.waveformBarActive,
        barStyle,
      ]}
    />
  );
};

// Timer
const RecordingTimer: React.FC<{ isRecording: boolean; startTime: number | null; isPaused?: boolean }> = ({
  isRecording,
  startTime,
  isPaused = false,
}) => {
  const [time, setTime] = React.useState('00:00');
  const pausedElapsedRef = React.useRef(0);
  const pauseStartRef = React.useRef<number | null>(null);
  const totalPausedRef = React.useRef(0);
  const opacity = useSharedValue(0);
  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    if (isPaused) {
      pauseStartRef.current = Date.now();
      dotOpacity.value = withTiming(0.3, { duration: 300 });
    } else if (pauseStartRef.current) {
      totalPausedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [isPaused, dotOpacity]);

  useEffect(() => {
    opacity.value = withTiming(isRecording ? 1 : 0, { duration: 200 });
    if (isRecording && !isPaused) {
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (!isRecording) {
      dotOpacity.value = withTiming(1, { duration: 200 });
      setTime('00:00');
      totalPausedRef.current = 0;
      pauseStartRef.current = null;
    }
  }, [isRecording, opacity, dotOpacity]);

  useEffect(() => {
    if (!isRecording || !startTime) return;
    const interval = setInterval(() => {
      if (isPaused) return;
      const currentPaused = totalPausedRef.current + (pauseStartRef.current ? Date.now() - pauseStartRef.current : 0);
      const elapsed = Math.floor((Date.now() - startTime - currentPaused) / 1000);
      const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const secs = (elapsed % 60).toString().padStart(2, '0');
      setTime(`${mins}:${secs}`);
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, startTime, isPaused]);

  const timerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  if (!isRecording) return null;

  return (
    <Animated.View style={[styles.timerContainer, timerStyle]}>
      <Animated.View style={[styles.timerDot, dotStyle]} />
      <Text style={styles.timerText}>{time}</Text>
    </Animated.View>
  );
};

export default function RecordScreen() {
  const router = useRouter();
  const { start, stop, isRecording, isPaused, error, level, togglePause } = useAudioRecorder();
  const [recordingStartTime, setRecordingStartTime] = React.useState<number | null>(null);

  // Entry animations
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(15);

  useEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    contentY.value = withDelay(100, withSpring(0, animations.spring));
  }, [contentOpacity, contentY]);

  const handlePress = async () => {
    if (!isRecording) {
      setRecordingStartTime(Date.now());
      await start();
    } else {
      setRecordingStartTime(null);
      const result = await stop();
      if (!result) return;
      router.push({
        pathname: '/processing',
        params: {
          audioUri: result.uri,
          duration: String(result.duration),
          fileName: result.fileName,
        },
      });
    }
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <GradientScreen>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>AutoDictate</Text>
          <Text style={styles.subtitle}>
            Tap to record, we'll handle the rest
          </Text>
        </View>

        {/* Center */}
        <View style={styles.center}>
          {/* Status */}
          <View style={[styles.statusChip, isRecording && !isPaused && styles.statusChipRecording, isPaused && styles.statusChipPaused]}>
            <Text style={[styles.statusText, isRecording && !isPaused && styles.statusTextRecording, isPaused && styles.statusTextPaused]}>
              {isPaused ? 'Paused' : isRecording ? 'Recording...' : 'Ready'}
            </Text>
          </View>

          {/* Waveform */}
          <WaveformVisualizer isRecording={isRecording && !isPaused} level={level} />

          {/* Timer */}
          <RecordingTimer isRecording={isRecording} startTime={recordingStartTime} isPaused={isPaused} />

          {/* Orb button */}
          <RecordButton isRecording={isRecording} onPress={handlePress} level={level} />

          {/* Pause button */}
          {isRecording && (
            <Pressable
              style={[styles.pauseButton, isPaused && styles.pauseButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                togglePause();
              }}
              accessibilityRole="button"
              accessibilityLabel={isPaused ? 'Resume recording' : 'Pause recording'}>
              <Feather name={isPaused ? 'play' : 'pause'} size={20} color={isPaused ? colors.accent : colors.muted} />
              <Text style={[styles.pauseLabel, isPaused && styles.pauseLabelActive]}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}
        </View>

        {/* Bottom features */}
        <View style={styles.features}>
          {['Auto timestamps', 'AI summary', 'Timeline'].map((feat) => (
            <View key={feat} style={styles.featureChip}>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
  },
  appName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  statusChip: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  statusChipRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusChipPaused: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  statusText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  statusTextRecording: {
    color: colors.recording,
  },
  statusTextPaused: {
    color: colors.accent,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    paddingHorizontal: spacing.xl,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  waveformBarActive: {
    backgroundColor: colors.accent,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.recording,
  },
  timerText: {
    color: colors.recording,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  error: {
    color: colors.danger,
    fontWeight: '500',
    fontSize: 14,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  featureChip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseButtonActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  pauseLabel: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  pauseLabelActive: {
    color: colors.accent,
  },
});

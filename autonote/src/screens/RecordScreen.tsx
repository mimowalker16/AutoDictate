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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GradientScreen } from '@/components/GradientScreen';
import { GlassCard } from '@/components/GlassCard';
import { RecordButton } from '@/components/RecordButton';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';

const highlights = ['Horodatage auto', 'Résumé Gemini', 'Lecture timeline'];

// Audio Waveform Visualizer Component
const WaveformVisualizer: React.FC<{ isRecording: boolean; level: number }> = ({
  isRecording,
  level,
}) => {
  const bars = 20;

  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: bars }).map((_, i) => (
        <WaveformBar key={i} index={i} isRecording={isRecording} level={level} />
      ))}
    </View>
  );
};

const WaveformBar: React.FC<{ index: number; isRecording: boolean; level: number }> = ({
  index,
  isRecording,
  level,
}) => {
  const height = useSharedValue(8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (isRecording) {
      // Create varied animation based on position
      const centerDistance = Math.abs(index - 10) / 10;
      const baseHeight = 15 + (1 - centerDistance) * 35;
      const variation = Math.random() * 30 + level * 50;
      const targetHeight = Math.min(70, baseHeight + variation);

      height.value = withTiming(targetHeight, {
        duration: 100 + Math.random() * 100,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(0.6 + level * 0.4, { duration: 100 });
    } else {
      height.value = withSpring(8, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [height, index, isRecording, level, opacity]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.waveformBar, barStyle]}>
      <LinearGradient
        colors={[colors.gold, colors.goldLight, colors.gold]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Animated.View>
  );
};

// Recording Timer Component
const RecordingTimer: React.FC<{ isRecording: boolean; startTime: number | null }> = ({
  isRecording,
  startTime,
}) => {
  const [time, setTime] = React.useState('00:00');
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      scale.value = withSpring(1, animations.springBouncy);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      setTime('00:00');
    }
  }, [isRecording, opacity, scale]);

  useEffect(() => {
    if (!isRecording || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const secs = (elapsed % 60).toString().padStart(2, '0');
      setTime(`${mins}:${secs}`);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isRecording) return null;

  return (
    <Animated.View style={[styles.timerContainer, containerStyle]}>
      <View style={styles.timerDot} />
      <Text style={styles.timerText}>{time}</Text>
    </Animated.View>
  );
};

export default function RecordScreen() {
  const router = useRouter();
  const { start, stop, isRecording, error, level } = useAudioRecorder();
  const [recordingStartTime, setRecordingStartTime] = React.useState<number | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const statusGlow = useSharedValue(0.5);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    headerTranslateY.value = withDelay(100, withSpring(0, animations.spring));
    cardScale.value = withDelay(300, withSpring(1, animations.spring));
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    statusGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [cardOpacity, cardScale, headerOpacity, headerTranslateY, statusGlow]);

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

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const statusGlowStyle = useAnimatedStyle(() => ({
    opacity: statusGlow.value,
  }));

  const statusLabel = isRecording ? '🔴 Enregistrement...' : '✦ Prêt à capter';

  return (
    <GradientScreen>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.eyebrowContainer}>
          <LinearGradient colors={gradients.gold} style={styles.eyebrowGradient}>
            <Text style={styles.eyebrow}>CAPTURE</Text>
          </LinearGradient>
          <Text style={styles.crown}>👑</Text>
        </View>
        <Text style={styles.title}>Enregistrer en un tap</Text>
        <Text style={styles.subtitle}>
          Une note claire, des timestamps précis, résumé automatique.
        </Text>
      </Animated.View>

      {/* Center - Record section */}
      <View style={styles.center}>
        {/* Status chip */}
        <View style={styles.statusWrapper}>
          {isRecording && <Animated.View style={[styles.statusGlow, statusGlowStyle]} />}
          <View style={[styles.statusChip, isRecording && styles.statusChipRecording]}>
            <Text style={[styles.statusText, isRecording && styles.statusTextRecording]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Waveform Visualizer - appears when recording */}
        <WaveformVisualizer isRecording={isRecording} level={level} />

        {/* Recording Timer */}
        <RecordingTimer isRecording={isRecording} startTime={recordingStartTime} />

        {/* Record Button */}
        <RecordButton isRecording={isRecording} onPress={handlePress} level={level} />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
      </View>

      {/* Bottom card */}
      <Animated.View style={cardStyle}>
        <GlassCard glowing={isRecording}>
          <View style={styles.chipsRow}>
            {highlights.map((item, index) => (
              <ChipAnimated key={item} label={item} delay={index * 100 + 400} />
            ))}
          </View>
          <Text style={styles.helper}>
            Appuie, parle, stoppe. On s'occupe du reste ✨
          </Text>
        </GlassCard>
      </Animated.View>
    </GradientScreen>
  );
}

// Animated chip component
const ChipAnimated: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, animations.springBouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.chip, style]}>
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={styles.chipText}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrowGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  eyebrow: {
    color: colors.backgroundDeep,
    letterSpacing: 2,
    fontWeight: '800',
    fontSize: 12,
  },
  crown: {
    fontSize: 18,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
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
  statusWrapper: {
    position: 'relative',
  },
  statusGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.recording,
    borderRadius: radius.lg,
    transform: [{ scale: 1.3 }],
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipRecording: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: colors.recording,
  },
  statusText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  statusTextRecording: {
    color: '#ff6b6b',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 3,
    paddingHorizontal: spacing.lg,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  timerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.recording,
  },
  timerText: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chipText: {
    color: colors.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  helper: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

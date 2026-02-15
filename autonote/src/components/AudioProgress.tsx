import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';
import { formatMillis } from '@/utils/time';

type Props = {
  position: number;
  duration: number;
  onSeek?: (ms: number) => void;
};

export const AudioProgress: React.FC<Props> = ({ position, duration, onSeek }) => {
  const [width, setWidth] = useState(1);
  const progressAnim = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handlePress = useCallback(
    (event: any) => {
      if (!duration || !onSeek) return;
      const x = event.nativeEvent.locationX;
      const ratio = Math.min(1, Math.max(0, x / width));
      onSeek(ratio * duration);

      // Thumb bounce
      thumbScale.value = withSpring(1.3, animations.springBouncy);
      setTimeout(() => {
        thumbScale.value = withSpring(1, animations.spring);
      }, 150);
    },
    [duration, onSeek, thumbScale, width],
  );

  useEffect(() => {
    const progress = duration ? Math.min(1, position / duration) : 0;
    progressAnim.value = withTiming(progress, { duration: 100 });
  }, [duration, position, progressAnim]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progressAnim.value * 100}%`,
    transform: [{ scale: thumbScale.value }, { translateX: -8 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progressAnim.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} onLayout={handleLayout} style={styles.barContainer}>
        {/* Background track */}
        <View style={styles.track}>
          {/* Waveform-style bars (decorative) */}
          <View style={styles.waveContainer}>
            {Array.from({ length: 30 }).map((_, i) => {
              const height = Math.sin(i * 0.5) * 50 + 50;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    { height: `${height}%` },
                  ]}
                />
              );
            })}
          </View>

          {/* Progress fill */}
          <Animated.View style={[styles.fill, progressStyle]}>
            <LinearGradient
              colors={gradients.gold}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {/* Overlay waveform for progress */}
            <View style={styles.waveContainer}>
              {Array.from({ length: 30 }).map((_, i) => {
                const height = Math.sin(i * 0.5) * 50 + 50;
                return (
                  <View
                    key={i}
                    style={[
                      styles.waveBarFilled,
                      { height: `${height}%` },
                    ]}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>

        {/* Glowing thumb */}
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Animated.View style={[styles.thumbGlow, glowStyle]} />
          <LinearGradient colors={gradients.gold} style={styles.thumbInner} />
        </Animated.View>
      </Pressable>

      {/* Time display */}
      <View style={styles.times}>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatMillis(position)}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatMillis(duration)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barContainer: {
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 2,
    paddingHorizontal: 4,
  },
  waveBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
  },
  waveBarFilled: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.3)',
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
  },
  thumbInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.backgroundDeep,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  time: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

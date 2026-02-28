import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, animations } from '@/styles/theme';
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
  const isDragging = useSharedValue(false);
  const widthShared = useSharedValue(1);

  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    setWidth(w);
    widthShared.value = w;
  };

  const seekToRatio = useCallback(
    (ratio: number) => {
      if (!duration || !onSeek) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      onSeek(clamped * duration);
    },
    [duration, onSeek],
  );

  const hapticTick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Tap gesture
  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (!duration) return;
    const ratio = Math.min(1, Math.max(0, e.x / widthShared.value));
    progressAnim.value = withTiming(ratio, { duration: 80 });
    runOnJS(hapticTick)();
    runOnJS(seekToRatio)(ratio);
    thumbScale.value = withSpring(1.4, animations.springBouncy);
    thumbScale.value = withSpring(1, animations.spring);
  });

  // Pan gesture for drag-to-scrub
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      isDragging.value = true;
      thumbScale.value = withSpring(1.5, animations.springBouncy);
      const ratio = Math.min(1, Math.max(0, e.x / widthShared.value));
      progressAnim.value = ratio;
      runOnJS(hapticTick)();
      runOnJS(seekToRatio)(ratio);
    })
    .onUpdate((e) => {
      const ratio = Math.min(1, Math.max(0, e.x / widthShared.value));
      progressAnim.value = ratio;
      runOnJS(seekToRatio)(ratio);
    })
    .onEnd(() => {
      isDragging.value = false;
      thumbScale.value = withSpring(1, animations.spring);
    })
    .onFinalize(() => {
      isDragging.value = false;
      thumbScale.value = withSpring(1, animations.spring);
    })
    .minDistance(0)
    .activeOffsetX([-5, 5]);

  const composed = Gesture.Race(panGesture, tapGesture);

  useEffect(() => {
    if (isDragging.value) return;
    const progress = duration ? Math.min(1, position / duration) : 0;
    progressAnim.value = withTiming(progress, { duration: 100 });
  }, [duration, position, progressAnim]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${progressAnim.value * 100}%`,
    transform: [{ scale: thumbScale.value }, { translateX: -7 }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View onLayout={handleLayout} style={styles.barContainer}>
          {/* Track */}
          <View style={styles.track}>
            {/* Fill */}
            <Animated.View style={[styles.fill, progressStyle]} />
          </View>

          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </Animated.View>
      </GestureDetector>

      {/* Times */}
      <View style={styles.times}>
        <Text style={styles.time}>{formatMillis(position)}</Text>
        <Text style={styles.time}>{formatMillis(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  barContainer: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});

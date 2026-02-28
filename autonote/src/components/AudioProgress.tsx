import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handlePress = useCallback(
    (event: any) => {
      if (!duration || !onSeek) return;
      const x = event.nativeEvent.locationX;
      const ratio = Math.min(1, Math.max(0, x / width));
      onSeek(ratio * duration);
      thumbScale.value = withSpring(1.4, animations.springBouncy);
      setTimeout(() => {
        thumbScale.value = withSpring(1, animations.spring);
      }, 120);
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
    transform: [{ scale: thumbScale.value }, { translateX: -7 }],
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} onLayout={handleLayout} style={styles.barContainer}>
        {/* Track */}
        <View style={styles.track}>
          {/* Fill */}
          <Animated.View style={[styles.fill, progressStyle]} />
        </View>

        {/* Thumb */}
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Pressable>

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

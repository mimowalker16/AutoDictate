import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';
import { formatMillis } from '@/utils/time';

type Props = {
  text: string;
  startMs: number;
  onPress: (ms: number) => void;
  index?: number;
};

export const TimelineSegment: React.FC<Props> = ({ text, startMs, onPress, index = 0 }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const pressed = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, animations.spring));
  }, [index, opacity, scale, translateX]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * (1 - pressed.value * 0.02) },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 150 });
  };

  return (
    <Pressable
      onPress={() => onPress(startMs)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View style={[styles.segment, containerStyle]}>
        {/* Vertical line connector */}
        <View style={styles.lineContainer}>
          <View style={styles.lineDot}>
            <LinearGradient colors={gradients.gold} style={StyleSheet.absoluteFill} />
          </View>
          <View style={styles.line} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.badge}>
            <LinearGradient
              colors={[colors.gold, colors.goldLight]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.badgeText}>{formatMillis(startMs)}</Text>
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  lineContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  lineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    minHeight: 40,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  badgeText: {
    color: colors.backgroundDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});

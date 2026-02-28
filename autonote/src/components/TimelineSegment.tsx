import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, animations } from '@/styles/theme';
import { formatMillis } from '@/utils/time';

type Props = {
  text: string;
  startMs: number;
  onPress: (ms: number) => void;
  index?: number;
  isActive?: boolean;
};

export const TimelineSegment: React.FC<Props> = ({ text, startMs, onPress, index = 0, isActive = false }) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
  }, [index, opacity, scale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (1 - pressed.value * 0.02) }],
    opacity: opacity.value,
  }));

  const activeGlow = useSharedValue(0);

  useEffect(() => {
    activeGlow.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive, activeGlow]);

  const contentActiveStyle = useAnimatedStyle(() => ({
    borderColor: isActive ? 'rgba(217, 119, 6, 0.35)' : colors.border,
    backgroundColor: isActive ? 'rgba(217, 119, 6, 0.04)' : colors.card,
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 80 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 120 });
  };

  return (
    <Pressable
      onPress={() => onPress(startMs)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View style={[styles.segment, containerStyle]}>
        {/* Timeline dot & line */}
        <View style={styles.lineContainer}>
          <View style={[styles.dot, isActive && styles.dotActive]} />
          <View style={[styles.line, isActive && styles.lineActive]} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, contentActiveStyle]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatMillis(startMs)}</Text>
          </View>
          <Text style={styles.text}>{text}</Text>
        </Animated.View>
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginBottom: spacing.xs,
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    minHeight: 30,
  },
  lineActive: {
    backgroundColor: colors.accent,
    width: 2.5,
  },
  content: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});

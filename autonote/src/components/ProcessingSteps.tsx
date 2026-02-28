import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, animations } from '@/styles/theme';

type Step = {
  label: string;
  active: boolean;
  done: boolean;
};

type Props = {
  steps: Step[];
};

const StepItem: React.FC<{ step: Step; index: number; total: number }> = ({
  step,
  index,
  total,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    const delay = index * 80;
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));

    if (step.active) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 }),
        ),
        -1,
        true,
      );
    }
  }, [index, opacity, pulseOpacity, scale, step.active]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const dotPulseStyle = useAnimatedStyle(() => ({
    opacity: step.active ? pulseOpacity.value : 1,
  }));

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.stepRow}>
        {/* Indicator */}
        <View style={styles.indicatorCol}>
          <View
            style={[
              styles.dot,
              step.done && styles.dotDone,
              step.active && styles.dotActive,
            ]}>
            {step.done ? (
              <Feather name="check" size={12} color="#FFFFFF" />
            ) : step.active ? (
              <Animated.View style={[styles.activeDot, dotPulseStyle]} />
            ) : (
              <View style={styles.inactiveDot} />
            )}
          </View>
          {index < total - 1 && (
            <View style={[styles.line, step.done && styles.lineDone]} />
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            step.done && styles.labelDone,
            step.active && styles.labelActive,
          ]}>
          {step.label}
        </Text>

        {/* Status */}
        {step.done && (
          <Text style={styles.statusDone}>Done</Text>
        )}
      </View>
    </Animated.View>
  );
};

export const ProcessingSteps: React.FC<Props> = ({ steps }) => (
  <View style={styles.container}>
    {steps.map((step, index) => (
      <StepItem key={step.label} step={step} index={index} total={steps.length} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: spacing.md,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFFFFF',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 1,
    marginTop: 4,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
  label: {
    flex: 1,
    color: colors.muted,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 24,
  },
  labelDone: {
    color: colors.text,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  statusDone: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 24,
  },
});

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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, animations } from '@/styles/theme';

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
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const checkScale = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance
    const delay = index * 100;
    scale.value = withDelay(delay, withSpring(1, animations.spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, animations.spring));

    if (step.done) {
      checkScale.value = withSpring(1, animations.springBouncy);
      progressWidth.value = withTiming(100, { duration: 300 });
    } else if (step.active) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.3, { duration: 800 }),
        ),
        -1,
        true,
      );
      progressWidth.value = withRepeat(
        withSequence(
          withTiming(70, { duration: 1000 }),
          withTiming(30, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      progressWidth.value = 0;
    }
  }, [checkScale, index, opacity, progressWidth, pulseOpacity, scale, step.active, step.done, translateX]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View style={[styles.step, containerStyle]}>
      {/* Connecting line */}
      {index < total - 1 && (
        <View style={styles.connector}>
          <View style={[styles.connectorLine, step.done && styles.connectorDone]} />
        </View>
      )}

      <View style={styles.stepContent}>
        {/* Status indicator */}
        <View style={[styles.indicator, step.done && styles.indicatorDone, step.active && styles.indicatorActive]}>
          {step.done ? (
            <Animated.View style={checkStyle}>
              <Feather name="check" size={14} color={colors.backgroundDeep} />
            </Animated.View>
          ) : step.active ? (
            <Animated.View style={[styles.pulse, pulseStyle]}>
              <LinearGradient colors={gradients.gold} style={StyleSheet.absoluteFill} />
            </Animated.View>
          ) : (
            <View style={styles.dot} />
          )}
        </View>

        {/* Step info */}
        <View style={styles.stepInfo}>
          <Text style={[styles.label, step.done && styles.labelDone, step.active && styles.labelActive]}>
            {step.label}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <LinearGradient
                colors={step.done ? [colors.success, colors.success] : gradients.gold}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
        </View>

        {/* Status badge */}
        <View style={[styles.badge, step.done && styles.badgeDone, step.active && styles.badgeActive]}>
          <Text style={styles.badgeText}>
            {step.done ? '✓' : step.active ? '...' : '○'}
          </Text>
        </View>
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
    gap: spacing.sm,
  },
  step: {
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: 40,
    bottom: -spacing.sm,
    width: 2,
  },
  connectorLine: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  connectorDone: {
    backgroundColor: colors.success,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  indicatorDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  indicatorActive: {
    borderColor: colors.gold,
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  stepInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  labelDone: {
    color: colors.success,
  },
  labelActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDone: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.success,
  },
  badgeActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.gold,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
